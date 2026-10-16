import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEvolutionNoteDto {
  @IsInt()
  @IsPositive({ message: 'El niño es obligatorio' })
  childId: number;

  /** Solo lo usa el ADMIN; el ESPECIALISTA se autoasigna el suyo. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  specialistId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  planId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  planItemId?: number;

  @IsDateString({}, { message: 'La fecha es obligatoria' })
  date: string;

  @IsString()
  @MaxLength(5000, {
    message: 'El contenido no puede superar los 5000 caracteres',
  })
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'La observación no puede superar los 2000 caracteres',
  })
  observation?: string;
}

export class UpdateEvolutionNoteDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, {
    message: 'El contenido no puede superar los 5000 caracteres',
  })
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'La observación no puede superar los 2000 caracteres',
  })
  observation?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  planItemId?: number;
}
