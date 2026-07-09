import type { ACFanSpeed, ACMode } from '@casa/shared-types';

// Nomes de resource/valores conforme AIR_CONDITIONER_RESOURCE_MAP / AIR_CONDITIONER_PROFILE_MAP do SDK `thinqconnect`.
// Confirme contra o dispositivo real (via asyncGetDeviceStatus) na primeira integração, pois a LG pode
// ajustar valores por linha de produto.
export const LG_JOB_MODE: Record<ACMode, string> = {
  cool: 'COOL',
  heat: 'HEAT',
  fan: 'FAN',
  dry: 'AIR_DRY',
  auto: 'AUTO',
};

export const LG_JOB_MODE_REVERSE: Record<string, ACMode> = Object.fromEntries(
  Object.entries(LG_JOB_MODE).map(([mode, lgMode]) => [lgMode, mode as ACMode]),
);

export const LG_WIND_STRENGTH: Record<ACFanSpeed, string> = {
  low: 'LOW',
  medium: 'MID',
  high: 'HIGH',
  auto: 'AUTO',
};

export const LG_WIND_STRENGTH_REVERSE: Record<string, ACFanSpeed> =
  Object.fromEntries(
    Object.entries(LG_WIND_STRENGTH).map(([speed, lgSpeed]) => [
      lgSpeed,
      speed as ACFanSpeed,
    ]),
  );
