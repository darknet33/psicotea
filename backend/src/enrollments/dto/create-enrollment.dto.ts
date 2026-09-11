import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class CreateEnrollmentDto {
  @IsInt()
  @IsPositive()
  childId: number;

  @IsDateString()
  startDate: string;

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
  @IsString()
  notes?: string;
}
