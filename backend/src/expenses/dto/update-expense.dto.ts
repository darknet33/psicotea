import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateExpenseDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La categoría debe ser un número' })
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0.01, { message: 'El monto debe ser mayor a cero' })
  amount?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha no es válida' })
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(191, {
    message: 'La descripción no puede superar los 191 caracteres',
  })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'La URL del comprobante no puede superar los 255 caracteres',
  })
  receiptUrl?: string;
}
