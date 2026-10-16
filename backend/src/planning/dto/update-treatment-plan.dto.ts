import { PlanFrequency } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateTreatmentPlanDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  areaId?: number;

  @IsOptional()
  @IsEnum(PlanFrequency, { message: 'La frecuencia debe ser DAILY o WEEKLY' })
  frequency?: PlanFrequency;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'Las notas no pueden superar los 2000 caracteres',
  })
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
