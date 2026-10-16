import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateActivityDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'El niño es obligatorio' })
  childId: number;

  @IsDateString({}, { message: 'La fecha de la actividad no es válida' })
  date: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre de la actividad es obligatorio' })
  @MaxLength(120, { message: 'El título no puede superar los 120 caracteres' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'La descripción no puede superar los 2000 caracteres',
  })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La duración debe ser un número' })
  @IsInt({ message: 'La duración debe expresarse en minutos enteros' })
  duration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El responsable debe ser un número' })
  specialistId?: number;
}
