import { Matches } from 'class-validator';

export class UpdateUserPinDto {
  @Matches(/^\d{4}$/, { message: 'O PIN deve ter exatamente 4 dígitos numéricos.' })
  pin!: string;
}
