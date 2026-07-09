import { IsDefined, IsIn } from 'class-validator';
import type { DeviceCommand } from '@casa/shared-types';

const COMMAND_TYPES: DeviceCommand['type'][] = [
  'power',
  'volume',
  'mute',
  'input',
  'launchApp',
  'temperature',
  'mode',
  'fanSpeed',
  'swing',
  'specialMode',
  'energyCtrl',
  'lightOff',
];

export class SendCommandDto {
  @IsIn(COMMAND_TYPES)
  type!: DeviceCommand['type'];

  // Sem decorator de tipo porque o formato varia por `type` (string, number ou boolean);
  // `@IsDefined` é só para sobreviver ao `whitelist: true` do ValidationPipe.
  @IsDefined()
  value: unknown;
}
