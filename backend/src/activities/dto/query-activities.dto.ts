import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class QueryActivitiesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El niño debe ser un número' })
  childId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El responsable debe ser un número' })
  specialistId?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha inicial no es válida' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha final no es válida' })
  to?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  mine?: boolean;
}
