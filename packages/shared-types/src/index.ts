// Tipos compartilhados entre apps/api e apps/web.
// Mantém o contrato de API e os eventos WebSocket sincronizados nos dois lados.

export type DeviceType = 'TV' | 'AC';

export type DeviceProviderType = 'SMARTTHINGS' | 'LG_THINQ';

export interface TVState {
  power: 'on' | 'off';
  volume: number | null;
  muted: boolean | null;
  input: string | null;
  app: string | null;
}

export type ACMode = 'cool' | 'heat' | 'fan' | 'dry' | 'auto';
export type ACFanSpeed = 'low' | 'medium' | 'high' | 'auto';

export interface ACState {
  power: 'on' | 'off';
  targetTemperature: number | null;
  currentTemperature: number | null;
  mode: ACMode | null;
  fanSpeed: ACFanSpeed | null;
  swing: boolean | null;
}

export type DeviceState = TVState | ACState;

export interface DeviceDto {
  id: string;
  name: string;
  type: DeviceType;
  provider: DeviceProviderType;
  externalId: string | null;
  linked: boolean;
  online: boolean;
  state: DeviceState | null;
  updatedAt: string;
}

export interface CreateDeviceDto {
  name: string;
  type: DeviceType;
  provider: DeviceProviderType;
  externalId?: string | null;
}

export interface UpdateDeviceNameDto {
  name: string;
}

export interface ProviderDeviceDto {
  id: string;
  name: string;
  type: DeviceType;
}

export type TVCommand =
  | { type: 'power'; value: 'on' | 'off' }
  | { type: 'volume'; value: number }
  | { type: 'mute'; value: boolean }
  | { type: 'input'; value: string }
  | { type: 'launchApp'; value: 'netflix' | 'youtube' | 'primevideo' | 'disneyplus' };

export type ACCommand =
  | { type: 'power'; value: 'on' | 'off' }
  | { type: 'temperature'; value: number }
  | { type: 'mode'; value: ACMode }
  | { type: 'fanSpeed'; value: ACFanSpeed }
  | { type: 'swing'; value: boolean };

export type DeviceCommand = TVCommand | ACCommand;

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface PinLoginRequestDto {
  name: string;
  pin: string;
}

export interface UserSummaryDto {
  id: string;
  name: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUserDto {
  id: string;
  name: string;
  email: string;
}

export interface DeviceLogDto {
  id: string;
  deviceId: string;
  userId: string;
  action: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export const WS_EVENTS = {
  DEVICE_STATE_UPDATED: 'device.state.updated',
} as const;

export interface DeviceStateUpdatedEvent {
  deviceId: string;
  state: DeviceState;
  online: boolean;
  updatedAt: string;
}
