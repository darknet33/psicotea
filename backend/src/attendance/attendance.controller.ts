import {
  Body,
  Controller,
  HttpStatus,
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
}
