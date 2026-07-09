import type { DeviceCommand, DeviceProviderType, DeviceState, DeviceType, ProviderDeviceDto } from '@casa/shared-types';

// Contrato que todo adapter de fabricante (SmartThings, LG ThinQ, futuros...) deve implementar.
// O domínio de devices depende só desta interface, nunca de um SDK de fabricante diretamente —
// isso permite trocar/substituir um provider sem tocar nos casos de uso.
export interface DeviceProvider {
  readonly providerType: DeviceProviderType;

  // deviceType é necessário porque um único provider (ex: SmartThings) pode servir tanto
  // TV quanto AC, e cada um monta um shape de estado diferente (TVState vs ACState).
  fetchState(externalId: string, deviceType: DeviceType): Promise<DeviceState>;

  sendCommand(externalId: string, command: DeviceCommand): Promise<void>;

  isOnline(externalId: string): Promise<boolean>;

  listDevices?(): Promise<ProviderDeviceDto[]>;
}

export class DeviceNotLinkedError extends Error {
  constructor(externalId: string) {
    super(`Dispositivo com externalId "${externalId}" não está vinculado/cadastrado no provider.`);
    this.name = 'DeviceNotLinkedError';
  }
}

export class ProviderCommandError extends Error {
  constructor(providerType: DeviceProviderType, message: string) {
    super(`[${providerType}] ${message}`);
    this.name = 'ProviderCommandError';
  }
}
