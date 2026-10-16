import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ROOM_BY_ROLE } from '../realtime/realtime.constants';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { PaymentAllocationDto } from './dto/payment-allocation.dto';
import { fromCents, toCents } from '../common/money';
import {
  computeTotals,
  isVigente,
  parseDateOnly,
} from '../enrollments/enrollments.service';

const PAYMENT_INCLUDE = {
  child: { select: { id: true, name: true, lastName: true } },
  allocations: {
    include: {
      enrollment: {
        select: {
          id: true,
          type: true,
          startDate: true,
          endDate: true,
          status: true,
          amount: true,
        },
      },
    },
  },
} satisfies Prisma.PaymentInclude;

type AllocationTarget = { enrollmentId: number; amount: number };

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  async findAll(query: QueryPaymentsDto) {
    const where: Prisma.PaymentWhereInput = {};

    if (query.childId !== undefined) {
      where.childId = query.childId;
    }

    if (query.periodStart && query.periodEnd) {
      where.periodStart = { lte: new Date(query.periodEnd) };
      where.periodEnd = { gte: new Date(query.periodStart) };
    }

    return this.prisma.payment.findMany({
      where,
      include: PAYMENT_INCLUDE,
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: PAYMENT_INCLUDE,
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    return payment;
  }

  async findByChild(childId: number) {
    return this.prisma.payment.findMany({
      where: { childId },
      include: PAYMENT_INCLUDE,
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findByPeriod(start: string, end: string) {
    return this.prisma.payment.findMany({
      where: {
        periodStart: { lte: new Date(end) },
        periodEnd: { gte: new Date(start) },
      },
      include: PAYMENT_INCLUDE,
      orderBy: { paymentDate: 'desc' },
    });
  }

  async create(dto: CreatePaymentDto) {
    const child = await this.prisma.child.findUnique({
      where: { id: dto.childId },
      select: { id: true },
    });

    if (!child) {
      throw new NotFoundException('Niño no encontrado');
    }

    const amountCents = toCents(dto.amount);
    const periodStart = parseDateOnly(dto.periodStart);
    const periodEnd = parseDateOnly(dto.periodEnd);

    if (periodStart > periodEnd) {
      throw new BadRequestException('El período del pago no es válido');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const allocations = await this.resolveAllocations(
        tx,
        dto.childId,
        amountCents,
        { allocations: dto.allocations, enrollmentId: dto.enrollmentId },
      );

      return tx.payment.create({
        data: {
          childId: dto.childId,
          enrollmentId: allocations[0].enrollmentId,
          amount: dto.amount,
          paymentDate: parseDateOnly(dto.paymentDate),
          method: dto.method,
          reference: dto.reference,
          description: dto.description,
          periodStart,
          periodEnd,
          allocations: {
            create: allocations.map((allocation) => ({
              enrollmentId: allocation.enrollmentId,
              amount: fromCents(allocation.amount),
            })),
          },
        },
      });
    });

    const payment = await this.findOne(created.id);

    this.realtime?.emitToRooms(
      [ROOM_BY_ROLE[Role.ADMIN], ROOM_BY_ROLE[Role.PERSONAL_ADMINISTRATIVO]],
      'payment:new',
      { childId: dto.childId, payment },
    );

    return payment;
  }

  async update(id: number, dto: UpdatePaymentDto) {
    const current = await this.prisma.payment.findUnique({ where: { id } });

    if (!current) {
      throw new NotFoundException('Pago no encontrado');
    }

    const childId = dto.childId ?? current.childId;
    const amountCents = toCents(dto.amount ?? current.amount);
    const recompute =
      dto.allocations !== undefined ||
      dto.enrollmentId !== undefined ||
      dto.amount !== undefined ||
      dto.childId !== undefined;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id },
        data: {
          ...(dto.childId !== undefined && { childId }),
          ...(dto.amount !== undefined && { amount: dto.amount }),
          ...(dto.paymentDate !== undefined && {
            paymentDate: parseDateOnly(dto.paymentDate),
          }),
          ...(dto.method !== undefined && { method: dto.method }),
          ...(dto.reference !== undefined && { reference: dto.reference }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.periodStart !== undefined && {
            periodStart: parseDateOnly(dto.periodStart),
          }),
          ...(dto.periodEnd !== undefined && {
            periodEnd: parseDateOnly(dto.periodEnd),
          }),
        },
      });

      if (recompute) {
        await tx.paymentAllocation.deleteMany({ where: { paymentId: id } });
        const allocations = await this.resolveAllocations(
          tx,
          childId,
          amountCents,
          { allocations: dto.allocations, enrollmentId: dto.enrollmentId },
        );
        await tx.paymentAllocation.createMany({
          data: allocations.map((allocation) => ({
            paymentId: id,
            enrollmentId: allocation.enrollmentId,
            amount: fromCents(allocation.amount),
          })),
        });
        await tx.payment.update({
          where: { id },
          data: { enrollmentId: allocations[0].enrollmentId },
        });
      }
    });

    return this.findOne(id);
  }

  /**
   * Deudas de un niño separando la inscripción vigente de las anteriores.
   * Se calculan con el `amount` real y las allocations, sin multiplicar por
   * meses.
   */
  async getPendingPayments(childId?: number) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: childId !== undefined ? { childId } : {},
      include: {
        child: { select: { id: true, name: true, lastName: true } },
        allocations: { select: { amount: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    const now = new Date();
    const byChild = new Map<
      number,
      {
        child: (typeof enrollments)[number]['child'];
        active: Record<string, unknown> | null;
        previousDebts: Array<Record<string, unknown>>;
        totalDue: number;
      }
    >();

    for (const enrollment of enrollments) {
      const totals = computeTotals(enrollment);
      if (totals.saldo <= 0) continue;

      const item = {
        enrollmentId: enrollment.id,
        type: enrollment.type,
        startDate: enrollment.startDate,
        endDate: enrollment.endDate,
        status: enrollment.status,
        amount: totals.total,
        pagado: totals.pagado,
        saldo: totals.saldo,
        vigente: isVigente(enrollment, now),
      };

      const entry = byChild.get(enrollment.childId) ?? {
        child: enrollment.child,
        active: null,
        previousDebts: [],
        totalDue: 0,
      };

      if (item.vigente) {
        entry.active = item;
      } else {
        entry.previousDebts.push(item);
      }
      entry.totalDue += totals.saldo;
      byChild.set(enrollment.childId, entry);
    }

    return Array.from(byChild.values());
  }

  /**
   * Resuelve a qué inscripción(es) se aplica el pago. Orden de prioridad:
   * allocations explícitas, una inscripción destino, o reparto automático de
   * la deuda más antigua a la más reciente. El excedente se aplica a la
   * inscripción más reciente como saldo a favor.
   */
  private async resolveAllocations(
    tx: Prisma.TransactionClient,
    childId: number,
    amountCents: number,
    target: { allocations?: PaymentAllocationDto[]; enrollmentId?: number },
  ): Promise<AllocationTarget[]> {
    if (target.allocations?.length) {
      const ids = target.allocations.map(
        (allocation) => allocation.enrollmentId,
      );
      const unique = new Set(ids);

      if (unique.size !== ids.length) {
        throw new BadRequestException(
          'No se puede aplicar el pago dos veces a la misma inscripción',
        );
      }

      const owned = await tx.enrollment.findMany({
        where: { id: { in: [...unique] }, childId },
        select: { id: true },
      });

      if (owned.length !== unique.size) {
        throw new BadRequestException(
          'La inscripción destino no pertenece al niño del pago',
        );
      }

      let sum = 0;
      const result = target.allocations.map((allocation) => {
        const cents = toCents(allocation.amount);
        if (cents <= 0) {
          throw new BadRequestException(
            'El monto de la aplicación debe ser mayor a cero',
          );
        }
        sum += cents;
        return { enrollmentId: allocation.enrollmentId, amount: cents };
      });

      if (sum !== amountCents) {
        throw new BadRequestException(
          'La suma de las aplicaciones debe ser igual al monto del pago',
        );
      }

      return result;
    }

    if (target.enrollmentId !== undefined) {
      const owned = await tx.enrollment.findFirst({
        where: { id: target.enrollmentId, childId },
        select: { id: true },
      });

      if (!owned) {
        throw new BadRequestException(
          'La inscripción destino no pertenece al niño del pago',
        );
      }

      return [{ enrollmentId: owned.id, amount: amountCents }];
    }

    return this.distributeByOldestDebt(tx, childId, amountCents);
  }

  private async distributeByOldestDebt(
    tx: Prisma.TransactionClient,
    childId: number,
    amountCents: number,
  ): Promise<AllocationTarget[]> {
    const enrollments = await tx.enrollment.findMany({
      where: { childId },
      include: { allocations: { select: { amount: true } } },
      orderBy: { startDate: 'asc' },
    });

    if (!enrollments.length) {
      throw new BadRequestException(
        'El niño no tiene inscripciones a las que aplicar el pago',
      );
    }

    let remaining = amountCents;
    const result: AllocationTarget[] = [];

    for (const enrollment of enrollments) {
      if (remaining <= 0) break;

      const paid = enrollment.allocations.reduce(
        (sum, allocation) => sum + toCents(allocation.amount),
        0,
      );
      const saldo = toCents(enrollment.amount) - paid;

      if (saldo > 0) {
        const apply = Math.min(saldo, remaining);
        result.push({ enrollmentId: enrollment.id, amount: apply });
        remaining -= apply;
      }
    }

    if (remaining > 0) {
      const mostRecent = enrollments[enrollments.length - 1];
      const existing = result.find(
        (allocation) => allocation.enrollmentId === mostRecent.id,
      );
      if (existing) {
        existing.amount += remaining;
      } else {
        result.push({ enrollmentId: mostRecent.id, amount: remaining });
      }
    }

    return result;
  }
}
