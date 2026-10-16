import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class QueryExpensesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La categoría debe ser un número' })
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El responsable debe ser un número' })
  createdById?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha inicial no es válida' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha final no es válida' })
  to?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
