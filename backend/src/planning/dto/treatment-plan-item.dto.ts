import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  IsBoolean,
  IsDateString,
  Max,
} from 'class-validator';

export class CreateTreatmentPlanItemDto {
  @IsString()
  @MaxLength(200, { message: 'El título no puede superar los 200 caracteres' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'La descripción no puede superar los 2000 caracteres',
  })
  description?: string;

  /** 0 = domingo ... 6 = sábado. Si no se indica, aplica todos los días. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class UpdateTreatmentPlanItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'El título no puede superar los 200 caracteres' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'La descripción no puede superar los 2000 caracteres',
  })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class QueryPlansDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  childId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  specialistId?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeInactive?: boolean;
}

export class QueryAgendaDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  specialistId?: number;
}

export class QueryEvolutionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  childId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  specialistId?: number;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
