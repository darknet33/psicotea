import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El email debe ser un email válido' })
  email: string;

  @IsString()
  password: string;
}
