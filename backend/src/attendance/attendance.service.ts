import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Attendance, AttendanceStatus, Role } from '@prisma/client';
import { ChildrenService } from '../children/children.service';
import { CredentialResolverService } from '../common/credential/credential-resolver.service';
import { RequestUser } from '../common/interfaces/authenticated-request.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ScanAttendanceDto } from './dto/scan-attendance.dto';

export interface ScanAttendanceResult {
  attendance: Attendance;
  /** `true` si el registro se acaba de crear, `false` si ya existía. */
  created: boolean;
  child: { id: number; name: string; lastName: string };
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: CredentialResolverService,
    private readonly childrenService: ChildrenService,
  ) {}

  /**
   * Registra la presencia del día a partir de la credencial escaneada.
   *
   * Es idempotente por niño y fecha: `Attendance` tiene `@@unique([childId,
   * date])`, así que un segundo escaneo del mismo día actualiza la fila
   * existente en vez de duplicarla. `created` permite responder 201 la primera
   * vez y 200 en los reescaneos.
   */
  async scan(
    dto: ScanAttendanceDto,
    user: RequestUser,
  ): Promise<ScanAttendanceResult> {
    const childId = await this.resolver.resolveActiveChildId(dto.code);

    await this.assertSpecialistScope(childId, user);

    const date = startOfToday();
    const existing = await this.prisma.attendance.findUnique({
      where: { childId_date: { childId, date } },
      select: { id: true },
    });

    const attendance = await this.prisma.attendance.upsert({
      where: { childId_date: { childId, date } },
      create: {
        childId,
        date,
        status: AttendanceStatus.PRESENTE,
        registeredById: user.id,
      },
      update: {},
    });

    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      select: { id: true, name: true, lastName: true },
    });

    if (!child) {
      throw new NotFoundException('Niño no encontrado');
    }

    return { attendance, created: existing === null, child };
  }

  /**
   * Un ESPECIALISTA solo puede registrar sobre niños que tiene asignados.
   * ADMIN y PERSONAL_ADMINISTRATIVO pasan sin comprobación.
   */
  private async assertSpecialistScope(
    childId: number,
    user: RequestUser,
  ): Promise<void> {
    if (user.role !== Role.ESPECIALISTA) {
      return;
    }

    const specialistId = await this.childrenService.getSpecialistIdByUser(
      user.id,
    );
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      select: { specialistId: true },
    });

    if (
      !child ||
      child.specialistId === null ||
      child.specialistId !== specialistId
    ) {
      throw new ForbiddenException(
        'No puedes registrar la asistencia de un niño que no tienes asignado',
      );
    }
  }
}

/**
 * Fecha de hoy a medianoche en hora local. `Attendance.date` es `@db.Date`,
 * así que Prisma la guarda sin hora; el `@@unique([childId, date])` solo
 * agrupa si el valor coincide exactamente con el del registro anterior.
 */
function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
