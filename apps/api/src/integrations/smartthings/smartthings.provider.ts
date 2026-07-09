import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BearerTokenAuthenticator,
  DeviceHealthState,
  SmartThingsClient,
} from '@smartthings/core-sdk';
import type {
  DeviceCommand,
  DeviceProviderType,
  DeviceType,
  TVState,
} from '@casa/shared-types';
import { DeviceProvider, ProviderCommandError } from '@casa/device-contracts';
import { SAMSUNG_TV_APP_IDS } from './samsung-tv-apps';

const MAIN_COMPONENT = 'main';

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
      type: this.inferDeviceType(device.capabilities) as DeviceType,
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

  async fetchState(externalId: string): Promise<TVState> {
    const status = await this.client.devices.getStatus(externalId);
    const main = status.components?.[MAIN_COMPONENT] ?? {};

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
      default:
        throw new ProviderCommandError(
          this.providerType,
          `Comando "${(command as { type: string }).type}" não suportado pela integração SmartThings.`,
        );
    }
  }
}
