import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class InitialPaymentDto {
  @IsNumber()
  @IsPositive({ message: 'El monto del pago inicial debe ser mayor a cero' })
  amount: number;

  @IsEnum(PaymentMethod, {
    message: 'El método debe ser EFECTIVO, QR o TRANSFERENCIA',
  })
  method: PaymentMethod;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
