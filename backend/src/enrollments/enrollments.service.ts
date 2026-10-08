import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { QueryEnrollmentsDto } from './dto/query-enrollments.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

const LIST_INCLUDE = {
  child: {
    select: {
      id: true,
      name: true,
      lastName: true,
      photoUrl: true,
      isActive: true,
    },
  },
  scheduleDays: { orderBy: { dayOfWeek: 'asc' as const } },
  areas: { include: { area: true } },
  payments: { select: { amount: true } },
} satisfies Prisma.EnrollmentInclude;

const DETAIL_INCLUDE = {
  child: {
    select: {
      id: true,
      name: true,
      lastName: true,
      photoUrl: true,
      isActive: true,
    },
  },
  scheduleDays: { orderBy: { dayOfWeek: 'asc' as const } },
  areas: { include: { area: true } },
  payments: { orderBy: { paymentDate: 'desc' as const } },
} satisfies Prisma.EnrollmentInclude;

type EnrollmentWithList = Prisma.EnrollmentGetPayload<{
  include: typeof LIST_INCLUDE;
}>;

type EnrollmentWithDetail = Prisma.EnrollmentGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;

export interface Totals {
  facturado: number;
  pagado: number;
  saldo: number;
}

/**
 * Interpreta `YYYY-MM-DD` como mediodía UTC en lugar de medianoche. El
 * frontend manda solo la fecha; guardarla a medianoche UTC haría que al
 * mostrarla en America/La_Paz (UTC-4) aparezca el día anterior.
 */
export function parseDateOnly(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00.000Z`);
  }
  return new Date(value);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/**
 * Cuenta cuántos meses calendario se solapan con `[startDate, endDate]`,
 * ambos inclusive. Si no hay `endDate`, se cuenta hasta hoy.
 */
export function countBilledMonths(
  startDate: Date,
  endDate: Date | null,
  now: Date = new Date(),
): number {
  const end = endDate ?? now;
  const months =
    (end.getFullYear() - startDate.getFullYear()) * 12 +
    (end.getMonth() - startDate.getMonth()) +
    1;
  return Math.max(1, months);
}

function computeTotals(enrollment: {
  monthlyFee: Prisma.Decimal;
  startDate: Date;
  endDate: Date | null;
  payments: Array<{ amount: Prisma.Decimal }>;
}): Totals {
  const facturado =
    Number(enrollment.monthlyFee) *
    countBilledMonths(enrollment.startDate, enrollment.endDate);
  const pagado = enrollment.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  return { facturado, pagado, saldo: facturado - pagado };
}

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryEnrollmentsDto) {
    const where: Prisma.EnrollmentWhereInput = {};

    if (query.childId !== undefined) {
      where.childId = query.childId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const search = query.search?.trim();
    if (search) {
      where.child = {
        OR: [
          { name: { contains: search } },
          { lastName: { contains: search } },
        ],
      };
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where,
      include: LIST_INCLUDE,
      orderBy: { startDate: 'desc' },
    });

    const groupsByChild = new Map<
      number,
      {
        child: EnrollmentWithList['child'];
        enrollments: EnrollmentWithList[];
        totals: Totals;
      }
    >();

    for (const enrollment of enrollments) {
      const existing = groupsByChild.get(enrollment.childId);
      const totals = computeTotals(enrollment);

      if (existing) {
        existing.enrollments.push(enrollment);
        existing.totals.facturado += totals.facturado;
        existing.totals.pagado += totals.pagado;
        existing.totals.saldo += totals.saldo;
      } else {
        groupsByChild.set(enrollment.childId, {
          child: enrollment.child,
          enrollments: [enrollment],
          totals: { ...totals },
        });
      }
    }

    const groups = Array.from(groupsByChild.values()).sort((a, b) => {
      const byLastName = a.child.lastName.localeCompare(b.child.lastName);
      if (byLastName !== 0) return byLastName;
      return a.child.name.localeCompare(b.child.name);
    });

    const total = groups.length;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;
    const pageGroups = groups.slice(start, start + limit);

    return {
      groups: pageGroups.map((group) => ({
        child: group.child,
        totals: group.totals,
        enrollments: group.enrollments.map((enrollment) =>
          this.toListItem(enrollment),
        ),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: number) {
    return this.getById(id);
  }

  async findByChild(childId: number) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { childId },
      include: LIST_INCLUDE,
      orderBy: { startDate: 'desc' },
    });

    return enrollments.map((enrollment) => this.toListItem(enrollment));
  }

  /**
   * Sugerencias para reinscribir: la inscripción más reciente de un niño, con
   * su monto, sus áreas y su agenda. La fecha sugerida es su `endDate`, para
   * que la nueva inscripción continúe desde donde terminó la anterior.
   */
  async getPrefill(childId: number) {
    const previous = await this.prisma.enrollment.findFirst({
      where: { childId },
      include: {
        scheduleDays: { orderBy: { dayOfWeek: 'asc' } },
        areas: { select: { areaId: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    if (!previous) {
      throw new NotFoundException('El niño no tiene inscripciones previas');
    }

    return {
      enrollmentId: previous.id,
      monthlyFee: Number(previous.monthlyFee),
      startDate: (previous.endDate ?? previous.startDate)
        .toISOString()
        .slice(0, 10),
      areaIds: previous.areas.map((area) => area.areaId),
      scheduleDays: previous.scheduleDays.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        shift: day.shift,
      })),
    };
  }

  async create(dto: CreateEnrollmentDto) {
    const child = await this.prisma.child.findUnique({
      where: { id: dto.childId },
    });

    if (!child) {
      throw new NotFoundException('Niño no encontrado');
    }

    await this.assertAreasExist(dto.areaIds);
    this.assertScheduleUnique(dto.scheduleDays);

    const startDate = parseDateOnly(dto.startDate);
    const endDate = addDays(startDate, dto.durationDays);
    const status = dto.status ?? EnrollmentStatus.ACTIVO;

    this.assertDateOrder(startDate, endDate);

    if (status === EnrollmentStatus.ACTIVO) {
      await this.assertNoActiveEnrollment(dto.childId);
    }

    if (dto.initialPayment) {
      this.assertPayment(
        dto.initialPayment.periodStart,
        dto.initialPayment.periodEnd,
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data: {
          childId: dto.childId,
          startDate,
          endDate,
          durationDays: dto.durationDays,
          status,
          monthlyFee: dto.monthlyFee,
          notes: dto.notes,
          ...(dto.scheduleDays?.length && {
            scheduleDays: {
              create: dto.scheduleDays.map((day) => ({
                dayOfWeek: day.dayOfWeek,
                shift: day.shift,
              })),
            },
          }),
          ...(dto.areaIds?.length && {
            areas: {
              create: dto.areaIds.map((areaId) => ({ areaId })),
            },
          }),
        },
      });

      if (dto.initialPayment) {
        await tx.payment.create({
          data: {
            childId: dto.childId,
            enrollmentId: enrollment.id,
            amount: dto.initialPayment.amount,
            paymentDate: new Date(),
            method: dto.initialPayment.method,
            periodStart: parseDateOnly(dto.initialPayment.periodStart),
            periodEnd: parseDateOnly(dto.initialPayment.periodEnd),
            reference: dto.initialPayment.reference,
            description: dto.initialPayment.description,
          },
        });
      }

      return enrollment;
    });

    return this.getById(created.id);
  }

  async update(id: number, dto: UpdateEnrollmentDto) {
    const current = await this.prisma.enrollment.findUnique({ where: { id } });

    if (!current) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    await this.assertAreasExist(dto.areaIds);
    this.assertScheduleUnique(dto.scheduleDays);

    const startDate =
      dto.startDate !== undefined
        ? parseDateOnly(dto.startDate)
        : current.startDate;

    let endDate = current.endDate;
    if (dto.durationDays !== undefined) {
      endDate = addDays(startDate, dto.durationDays);
    } else if (dto.endDate !== undefined) {
      endDate = dto.endDate ? parseDateOnly(dto.endDate) : null;
    } else if (dto.startDate !== undefined && current.durationDays != null) {
      endDate = addDays(startDate, current.durationDays);
    }

    const status = dto.status ?? current.status;
    const leavesActive =
      dto.status !== undefined && dto.status !== EnrollmentStatus.ACTIVO;

    if (
      leavesActive &&
      dto.endDate === undefined &&
      dto.durationDays === undefined
    ) {
      endDate = new Date();
    }

    this.assertDateOrder(startDate, endDate);

    if (
      status === EnrollmentStatus.ACTIVO &&
      current.status !== EnrollmentStatus.ACTIVO
    ) {
      await this.assertNoActiveEnrollment(current.childId, id);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: { id },
        data: {
          startDate,
          endDate,
          durationDays: dto.durationDays ?? current.durationDays,
          status,
          ...(dto.monthlyFee !== undefined && { monthlyFee: dto.monthlyFee }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
      });

      if (dto.scheduleDays !== undefined) {
        await tx.enrollmentScheduleDay.deleteMany({
          where: { enrollmentId: id },
        });
        if (dto.scheduleDays.length) {
          await tx.enrollmentScheduleDay.createMany({
            data: dto.scheduleDays.map((day) => ({
              enrollmentId: id,
              dayOfWeek: day.dayOfWeek,
              shift: day.shift,
            })),
          });
        }
      }

      if (dto.areaIds !== undefined) {
        await tx.enrollmentArea.deleteMany({ where: { enrollmentId: id } });
        if (dto.areaIds.length) {
          await tx.enrollmentArea.createMany({
            data: dto.areaIds.map((areaId) => ({ enrollmentId: id, areaId })),
          });
        }
      }
    });

    return this.getById(id);
  }

  private async getById(id: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });

    if (!enrollment) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    return this.toDetail(enrollment);
  }

  private toListItem(enrollment: EnrollmentWithList) {
    const { payments, areas, ...rest } = enrollment;
    return {
      ...rest,
      areas: areas.map((link) => link.area),
      ...computeTotals({ ...enrollment, payments }),
    };
  }

  private toDetail(enrollment: EnrollmentWithDetail) {
    const { payments, areas, ...rest } = enrollment;
    return {
      ...rest,
      areas: areas.map((link) => link.area),
      payments,
      ...computeTotals(enrollment),
    };
  }

  private assertDateOrder(startDate: Date, endDate: Date | null) {
    if (endDate && startDate > endDate) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser posterior a la de fin',
      );
    }
  }

  private assertScheduleUnique(scheduleDays?: Array<{ dayOfWeek: number }>) {
    if (!scheduleDays?.length) return;

    const seen = new Set<number>();
    for (const day of scheduleDays) {
      if (seen.has(day.dayOfWeek)) {
        throw new BadRequestException(
          'No se puede marcar el mismo día dos veces en la agenda',
        );
      }
      seen.add(day.dayOfWeek);
    }
  }

  private assertPayment(periodStart: string, periodEnd: string) {
    if (parseDateOnly(periodStart) > parseDateOnly(periodEnd)) {
      throw new BadRequestException('El período del pago inicial no es válido');
    }
  }

  private async assertAreasExist(areaIds?: number[]) {
    if (!areaIds?.length) return;

    const unique = Array.from(new Set(areaIds));
    const count = await this.prisma.area.count({
      where: { id: { in: unique } },
    });

    if (count !== unique.length) {
      throw new BadRequestException('Una o más áreas no existen');
    }
  }

  private async assertNoActiveEnrollment(childId: number, excludeId?: number) {
    const active = await this.prisma.enrollment.findFirst({
      where: {
        childId,
        status: EnrollmentStatus.ACTIVO,
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
      select: { id: true },
    });

    if (active) {
      throw new BadRequestException(
        'El niño ya tiene una inscripción activa. Retírala o desactívala antes de crear otra.',
      );
    }
  }
}
