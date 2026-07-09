import { IsArray, IsString } from 'class-validator';

export class AssignDeviceTagsDto {
  @IsArray()
  @IsString({ each: true })
  tagIds!: string[];
}
