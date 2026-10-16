import { ReportPeriod, ReportType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'El título no puede superar los 200 caracteres' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000, {
    message: 'El contenido no puede superar los 20000 caracteres',
  })
  content?: string;

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

  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @IsOptional()
  @IsBoolean()
  visibilityToParents?: boolean;
}
