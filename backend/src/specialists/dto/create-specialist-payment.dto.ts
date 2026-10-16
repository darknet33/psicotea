import { PaymentMethod } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSpecialistPaymentDto {
  @IsNumber()
  @IsPositive({ message: 'El monto debe ser mayor a cero' })
  amount: number;

  @IsDateString({}, { message: 'El inicio del período es obligatorio' })
  periodStart: string;

  @IsDateString({}, { message: 'El fin del período es obligatorio' })
  periodEnd: string;

  @IsDateString({}, { message: 'La fecha de pago es obligatoria' })
  paymentDate: string;

  @IsEnum(PaymentMethod, {
    message: 'El método debe ser EFECTIVO, QR o TRANSFERENCIA',
  })
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(191, { message: 'La nota no puede superar los 191 caracteres' })
  notes?: string;
}
