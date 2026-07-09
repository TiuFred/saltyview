import type { ACFanSpeed, ACMode, ACSpecialMode } from '@casa/shared-types';

// Capabilities padrão do ecossistema SmartThings para AC Samsung. Confirme contra o dispositivo
// real (via getStatus) na primeira integração — assim como a LG, a Samsung pode variar valores
// por linha de produto.
export const SAMSUNG_AC_MODE: Record<ACMode, string> = {
  cool: 'cool',
  heat: 'heat',
  fan: 'wind', // SmartThings usa "wind", não "fan", para o modo ventilar
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
