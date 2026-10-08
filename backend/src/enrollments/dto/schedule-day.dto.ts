import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { Shift } from '@prisma/client';

export class ScheduleDayDto {
  /** 1 = lunes ... 7 = domingo. */
  @IsInt()
  @Min(1, { message: 'El día de la semana debe estar entre 1 y 7' })
  @Max(7, { message: 'El día de la semana debe estar entre 1 y 7' })
  dayOfWeek: number;

  @IsEnum(Shift, {
    message: 'El turno debe ser TODO_DIA, MANANA o TARDE',
  })
  shift: Shift;
}
