import { ReportType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class QueryReportsDto {
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
  @IsEnum(ReportType)
  type?: ReportType;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDrafts?: boolean;
}

export class EvolutionDraftQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  childId: number;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
