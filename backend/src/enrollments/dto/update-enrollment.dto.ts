import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EnrollmentStatus, EnrollmentType } from '@prisma/client';
import { ScheduleDayDto } from './schedule-day.dto';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsEnum(EnrollmentType, {
    message: 'El tipo debe ser MENSUAL, TRIMESTRAL, SEMESTRAL o ANUAL',
  })
  type?: EnrollmentType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'El monto de la inscripción debe ser mayor a cero' })
  amount?: number;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDayDto)
  scheduleDays?: ScheduleDayDto[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  areaIds?: number[];

  @IsOptional()
  @IsString()
  notes?: string;
}
