import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateActivityDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El niño debe ser un número' })
  childId?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha no es válida' })
  date?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El título no puede estar vacío' })
  @MaxLength(120, { message: 'El título no puede superar los 120 caracteres' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191, {
    message: 'La descripción no puede superar los 191 caracteres',
  })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La duración debe expresarse en minutos enteros' })
  @Min(1, { message: 'La duración debe ser mayor a cero' })
  duration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El responsable debe ser un número' })
  specialistId?: number;
}
