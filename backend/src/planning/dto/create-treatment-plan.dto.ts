import { PlanFrequency } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTreatmentPlanDto {
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
  areaId?: number;

  @IsOptional()
  @IsEnum(PlanFrequency, { message: 'La frecuencia debe ser DAILY o WEEKLY' })
  frequency?: PlanFrequency;

  @IsDateString({}, { message: 'La fecha de inicio es obligatoria' })
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'Las notas no pueden superar los 2000 caracteres',
  })
  notes?: string;
}
