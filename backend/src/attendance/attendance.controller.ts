import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { AttendanceService } from './attendance.service';
import { ScanAttendanceDto } from './dto/scan-attendance.dto';

const SCAN_ROLES = [
  Role.ADMIN,
  Role.PERSONAL_ADMINISTRATIVO,
  Role.ESPECIALISTA,
];

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * Registra la presencia del día a partir de la credencial escaneada.
   * Responde 201 si se creó el registro y 200 si ya había asistencia de hoy,
   * para que el cliente distinga "nuevo" de "ya registrado".
   */
  @Post('scan')
  @Roles(...SCAN_ROLES)
  async scan(
    @Body() dto: ScanAttendanceDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.attendanceService.scan(dto, req.user);

    res.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return result;
  }

  /**
   * Lista las asistencias registradas en una fecha concreta `AAAA-MM-DD`.
   */
  @Get('by-date/:date')
  @Roles(...SCAN_ROLES)
  async findByDate(
    @Param('date') date: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const parsed = parseDateOnly(date);
    if (!parsed) {
      throw new BadRequestException(
        'Fecha inválida. Usa el formato AAAA-MM-DD.',
      );
    }

    return this.attendanceService.findByDate(parsed, req.user);
  }

  /**
   * Lista los días de un mes (`AAAA` y `MM` por separado) que tienen al menos
   * una asistencia, para que el calendario marque esos días.
   */
  @Get('days/:year/:month')
  @Roles(...SCAN_ROLES)
  async daysInMonth(
    @Param('year') year: string,
    @Param('month') month: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const parsedYear = Number(year);
    const parsedMonth = Number(month);

    if (
      !Number.isInteger(parsedYear) ||
      !Number.isInteger(parsedMonth) ||
      parsedMonth < 1 ||
      parsedMonth > 12
    ) {
      throw new BadRequestException('Mes inválido. Usa el formato AAAA/MM.');
    }

    return this.attendanceService.daysInMonth(
      parsedYear,
      parsedMonth,
      req.user,
    );
  }
}

/**
 * Convierte `AAAA-MM-DD` en un `Date` a medianoche en hora UTC. `Attendance.date`
 * es `@db.Date` y Prisma/MySQL comparan esos valores como timestamps UTC, así
 * que la clave de búsqueda debe empezar en `00:00:00` UTC para que el `gte/lt`
 * del rango del día encuentre las filas guardadas.
 */
function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return valid ? date : null;
}
