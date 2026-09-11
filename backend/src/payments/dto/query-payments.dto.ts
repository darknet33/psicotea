import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class QueryPaymentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  childId?: number;

  @IsOptional()
  @Type(() => Date)
  periodStart?: Date;

  @IsOptional()
  @Type(() => Date)
  periodEnd?: Date;
}
