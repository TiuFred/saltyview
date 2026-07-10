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
export type ACSpecialMode = 'none' | 'windFree' | 'turbo';

export interface ACState {
  power: 'on' | 'off';
  targetTemperature: number | null;
  currentTemperature: number | null;
  mode: ACMode | null;
  fanSpeed: ACFanSpeed | null;
  swing: boolean | null;
  // Comfort Air (windFree) e Jet Mode (turbo) são mutuamente exclusivos no hardware Samsung
  // (mesmo atributo físico) — não modelar como dois booleans independentes. Sempre null na LG.
  specialMode: ACSpecialMode | null;
  // Best-effort: Samsung não documenta publicamente uma capability estável para isso; requer
  // calibração contra um AC real antes de confiar no valor. Sempre null na LG.
  energyCtrl: boolean | null;
  lightOff: boolean | null;
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
  icon: string | null;
  tags: TagDto[];
  turnedOnBy: string | null;
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

export const DEVICE_ICON_OPTIONS = [
  '❄️', '🌬️', '📺', '💡', '🛋️', '🛏️', '🚪', '🪟', '🔌', '⚡', '🌡️', '🎮',
] as const;

export interface UpdateDeviceIconDto {
  icon: string;
}

export interface TagDto {
  id: string;
  name: string;
  createdAt: string;
}

export interface CreateTagDto {
  name: string;
}

export interface UpdateTagDto {
  name: string;
}

export interface AssignDeviceTagsDto {
  tagIds: string[];
}

export interface UpdateUserPinDto {
  pin: string;
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
  | { type: 'launchApp'; value: 'netflix' | 'youtube' | 'primevideo' | 'disneyplus' | 'globoplay' };

export type ACCommand =
  | { type: 'power'; value: 'on' | 'off' }
  | { type: 'temperature'; value: number }
  | { type: 'mode'; value: ACMode }
  | { type: 'fanSpeed'; value: ACFanSpeed }
  | { type: 'swing'; value: boolean }
  | { type: 'specialMode'; value: ACSpecialMode }
  | { type: 'energyCtrl'; value: boolean }
  | { type: 'lightOff'; value: boolean };

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
