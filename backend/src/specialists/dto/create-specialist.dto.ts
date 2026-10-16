import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSpecialistDto {
  /** Usuario existente con rol ESPECIALISTA al que se asocia el perfil. */
  @IsInt({ message: 'El usuario es obligatorio' })
  @IsPositive({ message: 'El usuario es obligatorio' })
  userId: number;

  @IsString()
  @MaxLength(50, {
    message: 'El carnet profesional no puede superar los 50 caracteres',
  })
  professionalId: string;

  @IsString()
  @MaxLength(100, {
    message: 'La especialidad no puede superar los 100 caracteres',
  })
  specialty: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'La matrícula no puede superar los 50 caracteres' })
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'El teléfono no puede superar los 30 caracteres' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191, {
    message: 'La dirección no puede superar los 191 caracteres',
  })
  address?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de ingreso debe ser una fecha válida' },
  )
  entryDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El sueldo mensual debe ser un número' })
  @Min(0, { message: 'El sueldo mensual no puede ser negativo' })
  monthlySalary?: number;
}
