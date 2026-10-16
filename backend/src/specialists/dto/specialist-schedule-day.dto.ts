import { SpecialistShift } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class SpecialistScheduleDayDto {
  /** 0 = domingo ... 6 = sábado (igual que `Date.getDay()`). */
  @IsInt()
  @Min(0, { message: 'El día debe estar entre 0 y 6' })
  @Max(6, { message: 'El día debe estar entre 0 y 6' })
  dayOfWeek: number;

  @IsOptional()
  @IsEnum(SpecialistShift, {
    message: 'El turno debe ser MANANA, TARDE o AMBOS',
  })
  shift?: SpecialistShift;

  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'La hora de inicio debe ser HH:MM' })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, { message: 'La hora de fin debe ser HH:MM' })
  endTime?: string;
}
