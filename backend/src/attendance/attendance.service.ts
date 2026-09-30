import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Attendance, AttendanceStatus, Role } from '@prisma/client';
import { ChildrenService } from '../children/children.service';
import {
  CredentialResolverService,
  CREDENTIAL_NOT_FOUND,
} from '../common/credential/credential-resolver.service';
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
   * Acepta el `credentialCode` que devuelve el QR o el `carnet` del niño, que
   * es lo que el operador escribe a mano (un QR dañado o sin cámara no debería
   * obligar a copiar el token largo).
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
    const childId = await this.resolveActiveChildId(dto.code);

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

  /**
   * Resuelve el id del niño activo, primero como `credentialCode` (lo que
   * escanea el QR) y, si no es un token válido, como `carnet` exacto.
   */
  private async resolveActiveChildId(input: string): Promise<number> {
    try {
      return await this.resolver.resolveActiveChildId(input);
    } catch (error) {
      // Si no es un credentialCode válido, puede ser el carnet escrito a mano.
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    const carnet = input.trim();
    if (!carnet) {
      throw new NotFoundException(CREDENTIAL_NOT_FOUND);
    }

    const child = await this.prisma.child.findFirst({
      where: { carnet, isActive: true },
      select: { id: true },
    });

    if (!child) {
      throw new NotFoundException(CREDENTIAL_NOT_FOUND);
    }

    return child.id;
  }

  /**
   * Lista las asistencias registradas en una fecha, ordenadas por apellido y
   * nombre del niño. Un ESPECIALISTA solo ve los niños que tiene asignados.
   */
  async findByDate(date: Date, user: RequestUser) {
    const childOf =
      user.role === Role.ESPECIALISTA
        ? {
            specialistId: await this.childrenService.getSpecialistIdByUser(
              user.id,
            ),
          }
        : undefined;

    if (childOf && childOf.specialistId === null) {
      return [];
    }

    return this.prisma.attendance.findMany({
      where: { date, ...(childOf ? { child: childOf } : {}) },
      select: {
        id: true,
        date: true,
        status: true,
        notes: true,
        child: {
          select: { id: true, name: true, lastName: true, carnet: true },
        },
        registeredBy: {
          select: { id: true, name: true, lastName: true },
        },
      },
      orderBy: [{ child: { lastName: 'asc' } }, { child: { name: 'asc' } }],
    });
  }

  /** Devuelve el id del niño activo, o lanza 404. */

  /**
   * Lista las fechas de un mes que tienen al menos una asistencia, como
   * cadenas `AAAA-MM-DD`. Lo usa el calendario para marcar los días. Un
   * ESPECIALISTA solo ve los días con asistencias de sus niños asignados.
   */
  async daysInMonth(
    year: number,
    month: number,
    user: RequestUser,
  ): Promise<string[]> {
    const childOf =
      user.role === Role.ESPECIALISTA
        ? {
            specialistId: await this.childrenService.getSpecialistIdByUser(
              user.id,
            ),
          }
        : undefined;

    if (childOf && childOf.specialistId === null) {
      return [];
    }

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const rows = await this.prisma.attendance.findMany({
      where: {
        date: { gte: start, lt: end },
        ...(childOf ? { child: childOf } : {}),
      },
      select: { date: true },
      distinct: ['date'],
    });

    // `@db.Date` se lee como medianoche UTC, así que el día cae bien en el ISO.
    return rows.map((row) => row.date.toISOString().slice(0, 10));
  }

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
 * Fecha de hoy a medianoche en hora UTC. `Attendance.date` es `@db.Date` y
 * MySQL guarda solo la fecha; Prisma compara esos valores como timestamps en
 * UTC, así que una medianoche local (`new Date(y, m, d)`) NO vuelve a
 * encontrar la fila guardada: el `@@unique([childId, date])` no coincide y un
 * reescaneo del mismo día intenta un `create` que choca con P2002.
 *
 * Con una medianoche en UTC el DATE guardado (`2026-09-29`) y la clave de
 * búsqueda se serializan igual y el upsert actualiza en vez de re-crear.
 */
function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}
