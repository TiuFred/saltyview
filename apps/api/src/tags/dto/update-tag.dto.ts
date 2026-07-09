import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name!: string;
}
