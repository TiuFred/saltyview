import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThinQApi } from 'thinqconnect';
import type {
  ACState,
  DeviceCommand,
  DeviceProviderType,
  ProviderDeviceDto,
} from '@casa/shared-types';
import { DeviceProvider, ProviderCommandError } from '@casa/device-contracts';
import {
  LG_JOB_MODE,
  LG_JOB_MODE_REVERSE,
  LG_WIND_STRENGTH,
  LG_WIND_STRENGTH_REVERSE,
} from './thinq-mappings';

// Confirmado via chamada real a asyncGetDeviceStatus (RAC_056905_WW) — os nomes de campo do SDK
// (targetTemperatureC, rotateLeftRight) não batem com a resposta real da API; os corretos são
// temperature.targetTemperature (+ unit) e windDirection.rotateUpDown.
interface ThinqStatusBody {
  operation?: { airConOperationMode?: string };
  airConJobMode?: { currentJobMode?: string };
  temperature?: {
    currentTemperature?: number;
    targetTemperature?: number;
    unit?: string;
  };
  airFlow?: { windStrength?: string };
  windDirection?: { rotateUpDown?: boolean };
}

@Injectable()
export class LgThinqProvider implements DeviceProvider {
  readonly providerType: DeviceProviderType = 'LG_THINQ';

  private readonly api: ThinQApi;

  constructor(config: ConfigService) {
    this.api = new ThinQApi(
      config.getOrThrow<string>('LG_THINQ_PAT'),
      config.getOrThrow<string>('LG_THINQ_COUNTRY'),
      config.getOrThrow<string>('LG_THINQ_CLIENT_ID'),
    );
  }

  async fetchState(externalId: string): Promise<ACState> {
    const response = await this.api.asyncGetDeviceStatus(externalId);
    const body = (response.body ?? {}) as ThinqStatusBody;

    const power =
      body.operation?.airConOperationMode === 'POWER_ON' ? 'on' : 'off';
    const mode = body.airConJobMode?.currentJobMode
      ? (LG_JOB_MODE_REVERSE[body.airConJobMode.currentJobMode] ?? null)
      : null;
    const fanSpeed = body.airFlow?.windStrength
      ? (LG_WIND_STRENGTH_REVERSE[body.airFlow.windStrength] ?? null)
      : null;

    return {
      power,
      targetTemperature: body.temperature?.targetTemperature ?? null,
      currentTemperature: body.temperature?.currentTemperature ?? null,
      mode,
      fanSpeed,
      swing: body.windDirection?.rotateUpDown ?? null,
    };
  }

  async isOnline(externalId: string): Promise<boolean> {
    const response = await this.api.asyncGetDeviceStatus(externalId);
    return response.status === 200 && response.body !== null;
  }

  async listDevices(): Promise<ProviderDeviceDto[]> {
    const response = await this.api.asyncGetDeviceList();

    if (response.status !== 200 || !response.body) {
      throw new ProviderCommandError(this.providerType, 'Não foi possível listar os aparelhos da conta LG ThinQ.');
    }

    const body = response.body as unknown as Array<{
      deviceId?: string;
      deviceInfo?: {
        alias?: string;
        modelName?: string;
      };
    }>;

    return body
      .filter((item) => !!item.deviceId)
      .map((item) => ({
        id: String(item.deviceId),
        name: item.deviceInfo?.alias || item.deviceInfo?.modelName || 'Aparelho LG',
        type: 'AC' as const,
      }));
  }

  async sendCommand(externalId: string, command: DeviceCommand): Promise<void> {
    switch (command.type) {
      case 'power':
        await this.api.asyncPostDeviceControl(externalId, {
          operation: {
            airConOperationMode:
              command.value === 'on' ? 'POWER_ON' : 'POWER_OFF',
          },
        });
        return;
      case 'temperature':
        await this.api.asyncPostDeviceControl(externalId, {
          temperature: { targetTemperature: command.value, unit: 'C' },
        });
        return;
      case 'mode':
        await this.api.asyncPostDeviceControl(externalId, {
          airConJobMode: { currentJobMode: LG_JOB_MODE[command.value] },
        });
        return;
      case 'fanSpeed':
        await this.api.asyncPostDeviceControl(externalId, {
          airFlow: { windStrength: LG_WIND_STRENGTH[command.value] },
        });
        return;
      case 'swing':
        await this.api.asyncPostDeviceControl(externalId, {
          windDirection: { rotateUpDown: command.value },
        });
        return;
      default:
        throw new ProviderCommandError(
          this.providerType,
          `Comando "${(command as { type: string }).type}" não suportado pela integração LG ThinQ.`,
        );
    }
  }
}
