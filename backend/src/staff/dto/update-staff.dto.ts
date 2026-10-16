import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El código de empleado no puede estar vacío' })
  @MaxLength(40, { message: 'El código no puede superar los 40 caracteres' })
  employeeId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El cargo no puede estar vacío' })
  @MaxLength(80, { message: 'El cargo no puede superar los 80 caracteres' })
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80, {
    message: 'El departamento no puede superar los 80 caracteres',
  })
  department?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de ingreso no es válida' })
  hireDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El salario debe ser un número' })
  @Min(0, { message: 'El salario no puede ser negativo' })
  salary?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40, { message: 'El teléfono no puede superar los 40 caracteres' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191, {
    message: 'La dirección no puede superar los 191 caracteres',
  })
  address?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
