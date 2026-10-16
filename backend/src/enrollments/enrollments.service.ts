import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { EnrollmentStatus, EnrollmentType, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ROOM_BY_ROLE } from '../realtime/realtime.constants';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { QueryEnrollmentsDto } from './dto/query-enrollments.dto';
import { fromCents, toCents } from '../common/money';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Duración en días corridos por tipo de inscripción. El usuario elige el
 * tipo; el backend deriva la duración y la fecha de finalización.
 */
export const ENROLLMENT_DURATIONS: Record<EnrollmentType, number> = {
  MENSUAL: 30,
  TRIMESTRAL: 90,
  SEMESTRAL: 180,
  ANUAL: 360,
};

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
  allocations: { select: { amount: true } },
} satisfies Prisma.EnrollmentInclude;

const DETAIL_INCLUDE = {
  ...LIST_INCLUDE,
  payments: { orderBy: { paymentDate: 'desc' as const } },
} satisfies Prisma.EnrollmentInclude;

type EnrollmentWithList = Prisma.EnrollmentGetPayload<{
  include: typeof LIST_INCLUDE;
}>;

type EnrollmentWithDetail = Prisma.EnrollmentGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;

export interface Totals {
  total: number;
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

export function durationForType(type: EnrollmentType): number {
  const duration = ENROLLMENT_DURATIONS[type];
  if (!duration) {
    throw new BadRequestException(`Tipo de inscripción inválido: ${type}`);
  }
  return duration;
}

export function computeEndDate(startDate: Date, type: EnrollmentType): Date {
  return addDays(startDate, durationForType(type));
}

function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Una inscripción está vigente cuando su estado es `ACTIVO` y la fecha de hoy
 * cae dentro de `[startDate, endDate]`, ambas inclusive. La comparación se
 * hace por día calendario para no depender de la hora.
 */
export function isVigente(
  enrollment: {
    status: EnrollmentStatus;
    startDate: Date;
    endDate: Date | null;
  },
  now: Date = new Date(),
): boolean {
  if (enrollment.status !== EnrollmentStatus.ACTIVO) return false;
  if (!enrollment.endDate) return false;
  const today = utcDay(now);
  return (
    utcDay(enrollment.startDate) <= today && today <= utcDay(enrollment.endDate)
  );
}

/**
 * El total de una inscripción es su `amount` (monto del período completo).
 * El pagado es la suma de las allocations aplicadas a esa inscripción. El
 * saldo NO se multiplica por meses.
 */
export function computeTotals(enrollment: {
  amount: Prisma.Decimal;
  allocations: Array<{ amount: Prisma.Decimal }>;
}): Totals {
  const total = toCents(enrollment.amount);
  const pagado = enrollment.allocations.reduce(
    (sum, allocation) => sum + toCents(allocation.amount),
    0,
  );
  return {
    total: fromCents(total),
    pagado: fromCents(pagado),
    saldo: fromCents(total - pagado),
  };
}

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

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
        existing.totals.total += totals.total;
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
   * Resumen económico de un niño: sus inscripciones con totales, la vigente
   * identificada y las deudas anteriores separadas. Es la fuente que usa el
   * expediente para no duplicar la lógica de saldo en el cliente.
   */
  async getSummary(childId: number) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      select: { id: true },
    });

    if (!child) {
      throw new NotFoundException('Niño no encontrado');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { childId },
      include: LIST_INCLUDE,
      orderBy: { startDate: 'asc' },
    });

    const items = enrollments.map((enrollment) => this.toListItem(enrollment));
    const now = new Date();

    const active = items.find((item) => item.vigente) ?? null;

    const previousDebts = items.filter(
      (item) =>
        !item.vigente &&
        item.saldo > 0 &&
        item.startDate.getTime() <= now.getTime(),
    );

    return {
      childId,
      active,
      previousDebts,
      enrollments: items,
    };
  }

  /**
   * Sugerencias para reinscribir: la inscripción más reciente de un niño, con
   * su tipo, monto, áreas y agenda. La fecha sugerida es el día siguiente al
   * `endDate` anterior para no solapar. Son sugerencias editables y no
   * modifican la inscripción anterior.
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

    const baseDate = previous.endDate ?? previous.startDate;

    return {
      enrollmentId: previous.id,
      type: previous.type,
      amount: Number(previous.amount),
      startDate: addDays(baseDate, 1).toISOString().slice(0, 10),
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
    const durationDays = durationForType(dto.type);
    const endDate = computeEndDate(startDate, dto.type);
    const status = dto.status ?? EnrollmentStatus.ACTIVO;

    this.assertDateOrder(startDate, endDate);

    if (dto.initialPayment) {
      const periodStart = parseDateOnly(dto.initialPayment.periodStart);
      const periodEnd = parseDateOnly(dto.initialPayment.periodEnd);
      this.assertPeriodOrder(periodStart, periodEnd);

      if (toCents(dto.initialPayment.amount) > toCents(dto.amount)) {
        throw new BadRequestException(
          'El pago inicial no puede superar el monto de la inscripción',
        );
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      await this.assertNoOverlap(tx, dto.childId, startDate, endDate);

      const enrollment = await tx.enrollment.create({
        data: {
          childId: dto.childId,
          type: dto.type,
          startDate,
          endDate,
          durationDays,
          status,
          amount: dto.amount,
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
            paymentDate: parseDateOnly(dto.initialPayment.paymentDate),
            method: dto.initialPayment.method,
            periodStart: parseDateOnly(dto.initialPayment.periodStart),
            periodEnd: parseDateOnly(dto.initialPayment.periodEnd),
            reference: dto.initialPayment.reference,
            description: dto.initialPayment.description,
            allocations: {
              create: [
                {
                  enrollmentId: enrollment.id,
                  amount: dto.initialPayment.amount,
                },
              ],
            },
          },
        });
      }

      return enrollment;
    });

    const enrollment = await this.getById(created.id);

    this.realtime?.emitToRooms(
      [ROOM_BY_ROLE[Role.ADMIN], ROOM_BY_ROLE[Role.PERSONAL_ADMINISTRATIVO]],
      'enrollment:update',
      { childId: dto.childId, enrollment },
    );

    return enrollment;
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

    const type = dto.type !== undefined ? dto.type : current.type;
    const datesTouched = dto.type !== undefined || dto.startDate !== undefined;

    let durationDays = current.durationDays;
    let endDate = current.endDate;

    if (datesTouched) {
      if (type) {
        durationDays = durationForType(type);
        endDate = computeEndDate(startDate, type);
      } else if (dto.startDate !== undefined && current.durationDays != null) {
        // Inscripción heredada sin tipo: se conserva su duración conocida.
        durationDays = current.durationDays;
        endDate = addDays(startDate, current.durationDays);
      }
    }

    const status = dto.status ?? current.status;
    const leavesActive =
      dto.status !== undefined && dto.status !== EnrollmentStatus.ACTIVO;

    if (leavesActive && !datesTouched) {
      endDate = new Date();
    }

    this.assertDateOrder(startDate, endDate);

    await this.prisma.$transaction(async (tx) => {
      if (datesTouched) {
        await this.assertNoOverlap(tx, current.childId, startDate, endDate, id);
      }

      await tx.enrollment.update({
        where: { id },
        data: {
          startDate,
          endDate,
          ...(type !== current.type && { type }),
          durationDays,
          status,
          ...(dto.amount !== undefined && { amount: dto.amount }),
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
    const { allocations, areas, ...rest } = enrollment;
    void allocations;
    return {
      ...rest,
      areas: areas.map((link) => link.area),
      ...computeTotals(enrollment),
      vigente: isVigente(enrollment),
    };
  }

  private toDetail(enrollment: EnrollmentWithDetail) {
    const { allocations, areas, payments, ...rest } = enrollment;
    void allocations;
    return {
      ...rest,
      areas: areas.map((link) => link.area),
      payments,
      ...computeTotals(enrollment),
      vigente: isVigente(enrollment),
    };
  }

  private assertDateOrder(startDate: Date, endDate: Date | null) {
    if (endDate && startDate > endDate) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser posterior a la de fin',
      );
    }
  }

  private assertPeriodOrder(periodStart: Date, periodEnd: Date) {
    if (periodStart > periodEnd) {
      throw new BadRequestException('El período del pago no es válido');
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

  /**
   * No se permite crear ni editar una inscripción cuyas fechas se solapen con
   * otra del mismo niño, sin importar el estado. Dos rangos se solapan cuando
   * `a.start <= b.end && b.start <= a.end`.
   */
  private async assertNoOverlap(
    client: Prisma.TransactionClient,
    childId: number,
    startDate: Date,
    endDate: Date | null,
    excludeId?: number,
  ) {
    const overlapping = await client.enrollment.findFirst({
      where: {
        childId,
        ...(excludeId !== undefined && { id: { not: excludeId } }),
        startDate: { lte: endDate ?? undefined },
        OR: [{ endDate: { gte: startDate } }, { endDate: null }],
      },
      select: { id: true },
    });

    if (overlapping) {
      throw new BadRequestException(
        'Las fechas de la inscripción se solapan con otra inscripción del niño',
      );
    }
  }
}
