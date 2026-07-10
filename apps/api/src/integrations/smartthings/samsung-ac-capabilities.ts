import type { ACFanSpeed, ACMode, ACSpecialMode } from '@casa/shared-types';

// Capabilities confirmadas em 2026-07-09 contra um AC Samsung real (DA-AC-RAC-01011) via
// client.devices.get()/getStatus() — airConditionerMode.supportedAcModes retornou
// ['auto','cool','dry','fan','heat'], airConditionerFanMode.supportedAcFanModes retornou
// ['auto','low','medium','high','turbo'], custom.airConditionerOptionalMode.supportedAcOptionalMode
// retornou ['off','sleep','quiet','smart','speed','windFree','windFreeSleep']. Outras linhas Samsung
// podem variar; reconfirme se surgir um novo erro "UnexpectedError" da API do SmartThings.
export const SAMSUNG_AC_MODE: Record<ACMode, string> = {
  cool: 'cool',
  heat: 'heat',
  fan: 'fan',
  dry: 'dry',
  auto: 'auto',
};

export const SAMSUNG_AC_MODE_REVERSE: Record<string, ACMode> = Object.fromEntries(
  Object.entries(SAMSUNG_AC_MODE).map(([mode, stMode]) => [stMode, mode as ACMode]),
);

export const SAMSUNG_FAN_SPEED: Record<ACFanSpeed, string> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  auto: 'auto',
};

export const SAMSUNG_FAN_SPEED_REVERSE: Record<string, ACFanSpeed> = Object.fromEntries(
  Object.entries(SAMSUNG_FAN_SPEED).map(([speed, stSpeed]) => [stSpeed, speed as ACFanSpeed]),
);

export const SAMSUNG_SWING_REVERSE: Record<string, boolean> = {
  all: true,
  vertical: true,
  horizontal: true,
  fixed: false,
};

// Comfort Air (windFree) e Jet Mode (turbo) são dois valores do MESMO atributo físico no
// hardware Samsung (custom.airConditionerOptionalMode) — mutuamente exclusivos, nunca ativos
// ao mesmo tempo.
export const SAMSUNG_OPTIONAL_MODE: Record<ACSpecialMode, string> = {
  none: 'off',
  windFree: 'windFree',
  turbo: 'speed',
};

export const SAMSUNG_OPTIONAL_MODE_REVERSE: Record<string, ACSpecialMode> = Object.fromEntries(
  Object.entries(SAMSUNG_OPTIONAL_MODE).map(([mode, stMode]) => [stMode, mode as ACSpecialMode]),
);
