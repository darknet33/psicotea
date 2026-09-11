import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class QueryEnrollmentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  childId?: number;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}
