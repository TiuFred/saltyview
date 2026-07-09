import { IsIn } from 'class-validator';
import { DEVICE_ICON_OPTIONS } from '@casa/shared-types';

export class UpdateDeviceIconDto {
  @IsIn(DEVICE_ICON_OPTIONS)
  icon!: string;
}
