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
  ValidateNested,
} from 'class-validator';
import { EnrollmentStatus, EnrollmentType } from '@prisma/client';
import { ScheduleDayDto } from './schedule-day.dto';
import { InitialPaymentDto } from './initial-payment.dto';

export class CreateEnrollmentDto {
  @IsInt()
  @IsPositive()
  childId: number;

  @IsEnum(EnrollmentType, {
    message: 'El tipo debe ser MENSUAL, TRIMESTRAL, SEMESTRAL o ANUAL',
  })
  type: EnrollmentType;

  @IsDateString()
  startDate: string;

  @IsNumber()
  @IsPositive({ message: 'El monto de la inscripción debe ser mayor a cero' })
  @IsNotEmpty()
  amount: number;

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
  @ValidateNested()
  @Type(() => InitialPaymentDto)
  initialPayment?: InitialPaymentDto;

  @IsOptional()
  @IsString()
  notes?: string;
}
