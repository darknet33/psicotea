import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';
import { PaymentAllocationDto } from './payment-allocation.dto';

export class CreatePaymentDto {
  @IsInt()
  @IsPositive()
  childId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  enrollmentId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentAllocationDto)
  allocations?: PaymentAllocationDto[];

  @IsNumber()
  @IsPositive({ message: 'El monto debe ser mayor a cero' })
  amount: number;

  @IsDateString()
  paymentDate: string;

  @IsEnum(PaymentMethod, {
    message: 'El método debe ser EFECTIVO, QR o TRANSFERENCIA',
  })
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}
