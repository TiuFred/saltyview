import { IsEmail, IsString, Length, MinLength } from 'class-validator';
import type { LoginRequestDto } from '@casa/shared-types';

export class LoginDto implements LoginRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class PinLoginDto {
  @IsString()
  name!: string;

  @IsString()
  @Length(4, 4)
  pin!: string;
}
