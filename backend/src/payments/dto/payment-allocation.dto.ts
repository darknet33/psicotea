import { IsInt, IsNumber, IsPositive } from 'class-validator';

export class PaymentAllocationDto {
  @IsInt()
  @IsPositive()
  enrollmentId: number;

  @IsNumber()
  @IsPositive({ message: 'El monto de la aplicación debe ser mayor a cero' })
  amount: number;
}
