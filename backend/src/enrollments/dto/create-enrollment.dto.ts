import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';
import { ScheduleDayDto } from './schedule-day.dto';
import { InitialPaymentDto } from './initial-payment.dto';

export class CreateEnrollmentDto {
  @IsInt()
  @IsPositive()
  childId: number;

  @IsDateString()
  startDate: string;

  @IsInt()
  @Min(1, { message: 'La duración debe ser mayor a cero' })
  durationDays: number;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @IsNumber()
  @IsPositive({ message: 'La matrícula mensual debe ser mayor a cero' })
  @IsNotEmpty()
  monthlyFee: number;

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
  @ValidateNested()
  @Type(() => InitialPaymentDto)
  initialPayment?: InitialPaymentDto;

  @IsOptional()
  @IsString()
  notes?: string;
}
