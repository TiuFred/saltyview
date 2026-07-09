import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BearerTokenAuthenticator,
  DeviceHealthState,
  SmartThingsClient,
} from '@smartthings/core-sdk';
import type {
  ACState,
  DeviceCommand,
  DeviceProviderType,
  DeviceState,
  DeviceType,
  TVState,
} from '@casa/shared-types';
import { DeviceProvider, ProviderCommandError } from '@casa/device-contracts';
import { SAMSUNG_TV_APP_IDS } from './samsung-tv-apps';
import {
  SAMSUNG_AC_MODE,
  SAMSUNG_AC_MODE_REVERSE,
  SAMSUNG_FAN_SPEED,
  SAMSUNG_FAN_SPEED_REVERSE,
  SAMSUNG_OPTIONAL_MODE,
  SAMSUNG_OPTIONAL_MODE_REVERSE,
  SAMSUNG_SWING_REVERSE,
} from './samsung-ac-capabilities';

const MAIN_COMPONENT = 'main';

// Capabilities best-effort sem documentação pública estável — precisam de calibração contra
// um AC Samsung real antes de confiar no comportamento (mesmo espírito do aviso em thinq-mappings.ts).
const ENERGY_SAVING_CAPABILITY = 'custom.energySavingMode';
const AC_LIGHTING_CAPABILITY = 'samsungce.airConditionerLighting';

@Injectable()
export class SmartThingsProvider implements DeviceProvider {
  readonly providerType: DeviceProviderType = 'SMARTTHINGS';

  private readonly client: SmartThingsClient;

  constructor(config: ConfigService) {
    this.client = new SmartThingsClient(
      new BearerTokenAuthenticator(
        config.getOrThrow<string>('SMARTTHINGS_PAT'),
      ),
    );
  }

  async listDevices() {
    const devices = await this.client.devices.list({ capability: 'switch' });

    return devices.map((device) => ({
      id: device.deviceId,
      name: device.label ?? device.deviceId,
      type: this.inferDeviceType(
        device.components?.flatMap((component) => component.capabilities),
      ),
    }));
  }

  private inferDeviceType(capabilities: Array<{ id: string }> | undefined): DeviceType {
    const capabilityIds = capabilities?.map((capability) => capability.id) ?? [];

    if (capabilityIds.includes('audioVolume') || capabilityIds.includes('mediaInputSource')) {
      return 'TV';
    }

    if (capabilityIds.includes('airConditionerMode') || capabilityIds.includes('fanMode')) {
      return 'AC';
    }

    return 'TV';
  }

  async fetchState(externalId: string, deviceType: DeviceType): Promise<DeviceState> {
    const status = await this.client.devices.getStatus(externalId);
    const main = status.components?.[MAIN_COMPONENT] ?? {};

    if (deviceType === 'AC') {
      return this.fetchAcState(main);
    }

    return this.fetchTvState(main);
  }

  private fetchTvState(main: Record<string, any>): TVState {
    const power = main.switch?.switch?.value === 'on' ? 'on' : 'off';
    const volume =
      typeof main.audioVolume?.volume?.value === 'number'
        ? main.audioVolume.volume.value
        : null;
    const muted =
      main.audioMute?.mute?.value === 'muted'
        ? true
        : main.audioMute?.mute?.value === 'unmuted'
          ? false
          : null;
    const input =
      typeof main.mediaInputSource?.inputSource?.value === 'string'
        ? main.mediaInputSource.inputSource.value
        : null;

    return { power, volume, muted, input, app: null };
  }

  private fetchAcState(main: Record<string, any>): ACState {
    const power = main.switch?.switch?.value === 'on' ? 'on' : 'off';
    const mode = main.airConditionerMode?.airConditionerMode?.value
      ? (SAMSUNG_AC_MODE_REVERSE[main.airConditionerMode.airConditionerMode.value] ?? null)
      : null;
    const fanSpeed = main.airConditionerFanMode?.fanMode?.value
      ? (SAMSUNG_FAN_SPEED_REVERSE[main.airConditionerFanMode.fanMode.value] ?? null)
      : null;
    const targetTemperature =
      typeof main.thermostatCoolingSetpoint?.coolingSetpoint?.value === 'number'
        ? main.thermostatCoolingSetpoint.coolingSetpoint.value
        : null;
    const currentTemperature =
      typeof main.temperatureMeasurement?.temperature?.value === 'number'
        ? main.temperatureMeasurement.temperature.value
        : null;
    const swing =
      typeof main.fanOscillationMode?.fanOscillationMode?.value === 'string'
        ? (SAMSUNG_SWING_REVERSE[main.fanOscillationMode.fanOscillationMode.value] ?? null)
        : null;
    const specialMode = main['custom.airConditionerOptionalMode']?.acOptionalMode?.value
      ? (SAMSUNG_OPTIONAL_MODE_REVERSE[main['custom.airConditionerOptionalMode'].acOptionalMode.value] ?? null)
      : null;

    // Leitura best-effort — capabilities não confirmadas publicamente; se ausentes, cai em null
    // sem quebrar o restante do estado.
    const energyCtrl =
      main[ENERGY_SAVING_CAPABILITY]?.energySavingMode?.value === 'on'
        ? true
        : main[ENERGY_SAVING_CAPABILITY]?.energySavingMode?.value === 'off'
          ? false
          : null;
    const lightOff =
      main[AC_LIGHTING_CAPABILITY]?.lighting?.value === 'off'
        ? true
        : main[AC_LIGHTING_CAPABILITY]?.lighting?.value === 'on'
          ? false
          : null;

    return {
      power,
      targetTemperature,
      currentTemperature,
      mode,
      fanSpeed,
      swing,
      specialMode,
      energyCtrl,
      lightOff,
    };
  }

  async isOnline(externalId: string): Promise<boolean> {
    const health = await this.client.devices.getHealth(externalId);
    return health.state === DeviceHealthState.ONLINE;
  }

  async sendCommand(externalId: string, command: DeviceCommand): Promise<void> {
    switch (command.type) {
      case 'power':
        await this.client.devices.executeCommand(externalId, {
          capability: 'switch',
          command: command.value === 'on' ? 'on' : 'off',
        });
        return;
      case 'volume':
        await this.client.devices.executeCommand(externalId, {
          capability: 'audioVolume',
          command: 'setVolume',
          arguments: [command.value],
        });
        return;
      case 'mute':
        await this.client.devices.executeCommand(externalId, {
          capability: 'audioMute',
          command: command.value ? 'mute' : 'unmute',
        });
        return;
      case 'input':
        await this.client.devices.executeCommand(externalId, {
          capability: 'mediaInputSource',
          command: 'setInputSource',
          arguments: [command.value],
        });
        return;
      case 'launchApp':
        await this.client.devices.executeCommand(externalId, {
          capability: 'custom.launchapp',
          command: 'launchApp',
          arguments: [SAMSUNG_TV_APP_IDS[command.value]],
        });
        return;
      case 'temperature':
        await this.client.devices.executeCommand(externalId, {
          capability: 'thermostatCoolingSetpoint',
          command: 'setCoolingSetpoint',
          arguments: [command.value],
        });
        return;
      case 'mode':
        await this.client.devices.executeCommand(externalId, {
          capability: 'airConditionerMode',
          command: 'setAirConditionerMode',
          arguments: [SAMSUNG_AC_MODE[command.value]],
        });
        return;
      case 'fanSpeed':
        await this.client.devices.executeCommand(externalId, {
          capability: 'airConditionerFanMode',
          command: 'setFanMode',
          arguments: [SAMSUNG_FAN_SPEED[command.value]],
        });
        return;
      case 'swing':
        await this.client.devices.executeCommand(externalId, {
          capability: 'fanOscillationMode',
          command: 'setFanOscillationMode',
          arguments: [command.value ? 'all' : 'fixed'],
        });
        return;
      case 'specialMode':
        await this.client.devices.executeCommand(externalId, {
          capability: 'custom.airConditionerOptionalMode',
          command: 'setAcOptionalMode',
          arguments: [SAMSUNG_OPTIONAL_MODE[command.value]],
        });
        return;
      case 'energyCtrl':
        try {
          await this.client.devices.executeCommand(externalId, {
            capability: ENERGY_SAVING_CAPABILITY,
            command: 'setEnergySavingMode',
            arguments: [command.value ? 'on' : 'off'],
          });
        } catch (error) {
          throw new ProviderCommandError(
            this.providerType,
            `Falha ao definir Energy Ctrl — capability best-effort (${ENERGY_SAVING_CAPABILITY}) pode não existir neste modelo: ${(error as Error).message}`,
          );
        }
        return;
      case 'lightOff':
        try {
          await this.client.devices.executeCommand(externalId, {
            capability: AC_LIGHTING_CAPABILITY,
            command: 'setLighting',
            arguments: [command.value ? 'off' : 'on'],
          });
        } catch (error) {
          throw new ProviderCommandError(
            this.providerType,
            `Falha ao definir Light Off — capability best-effort (${AC_LIGHTING_CAPABILITY}) pode não existir neste modelo: ${(error as Error).message}`,
          );
        }
        return;
      default:
        throw new ProviderCommandError(
          this.providerType,
          `Comando "${(command as { type: string }).type}" não suportado pela integração SmartThings.`,
        );
    }
  }
}
