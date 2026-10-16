import { ReportPeriod, ReportType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateReportDto {
  @IsInt()
  @IsPositive({ message: 'El niño es obligatorio' })
  childId: number;

  /** Solo lo usa el ADMIN; el ESPECIALISTA se autoasigna el suyo. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  specialistId?: number;

  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(200, { message: 'El título no puede superar los 200 caracteres' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'El contenido del informe es obligatorio' })
  @MaxLength(20000, {
    message: 'El contenido no puede superar los 20000 caracteres',
  })
  content: string;

  @IsOptional()
  @IsEnum(ReportType, {
    message: 'El tipo debe ser EVALUACION, EVOLUTIVO o PERIODICO',
  })
  type?: ReportType;

  @IsOptional()
  @IsEnum(ReportPeriod, {
    message: 'El período debe ser INICIO, MEDIADOS, FIN o NINGUNO',
  })
  reportPeriod?: ReportPeriod;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'El resumen no puede superar los 2000 caracteres',
  })
  summary?: string;

  @IsDateString({}, { message: 'El inicio del período es obligatorio' })
  periodStart: string;

  @IsDateString({}, { message: 'El fin del período es obligatorio' })
  periodEnd: string;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @IsOptional()
  @IsBoolean()
  visibilityToParents?: boolean;
}
