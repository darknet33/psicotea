import { Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

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
      include: {
        child: { select: { id: true, name: true, lastName: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        child: { select: { id: true, name: true, lastName: true } },
      },
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    return payment;
  }

  async findByChild(childId: number) {
    return this.prisma.payment.findMany({
      where: { childId },
      include: {
        child: { select: { id: true, name: true, lastName: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findByPeriod(start: string, end: string) {
    return this.prisma.payment.findMany({
      where: {
        periodStart: { lte: new Date(end) },
        periodEnd: { gte: new Date(start) },
      },
      include: {
        child: { select: { id: true, name: true, lastName: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async create(dto: CreatePaymentDto) {
    const child = await this.prisma.child.findUnique({
      where: { id: dto.childId },
    });

    if (!child) {
      throw new NotFoundException('Niño no encontrado');
    }

    if (dto.enrollmentId !== undefined) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: dto.enrollmentId },
      });
      if (!enrollment) {
        throw new NotFoundException('Inscripción no encontrada');
      }
    }

    return this.prisma.payment.create({
      data: {
        childId: dto.childId,
        enrollmentId: dto.enrollmentId,
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        method: dto.method,
        reference: dto.reference,
        description: dto.description,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
      },
      include: {
        child: { select: { id: true, name: true, lastName: true } },
      },
    });
  }

  async update(id: number, dto: UpdatePaymentDto) {
    await this.findOne(id);

    return this.prisma.payment.update({
      where: { id },
      data: {
        ...(dto.childId !== undefined && { childId: dto.childId }),
        ...(dto.enrollmentId !== undefined && {
          enrollmentId: dto.enrollmentId,
        }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.paymentDate !== undefined && {
          paymentDate: new Date(dto.paymentDate),
        }),
        ...(dto.method !== undefined && { method: dto.method }),
        ...(dto.reference !== undefined && { reference: dto.reference }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.periodStart !== undefined && {
          periodStart: new Date(dto.periodStart),
        }),
        ...(dto.periodEnd !== undefined && {
          periodEnd: new Date(dto.periodEnd),
        }),
      },
      include: {
        child: { select: { id: true, name: true, lastName: true } },
      },
    });
  }

  async getPendingPayments(childId?: number) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        status: EnrollmentStatus.ACTIVO,
        ...(childId !== undefined ? { childId } : {}),
      },
      include: {
        child: { select: { id: true, name: true, lastName: true } },
        payments: {
          select: { periodStart: true, periodEnd: true },
        },
      },
    });

    const today = new Date();
    const pendingByChild = new Map<
      number,
      {
        child: (typeof enrollments)[number]['child'];
        months: Date[];
        amountDue: number;
      }
    >();

    for (const enrollment of enrollments) {
      const cursor = new Date(
        enrollment.startDate.getFullYear(),
        enrollment.startDate.getMonth(),
        1,
      );

      while (cursor <= today) {
        const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const monthEnd = new Date(
          cursor.getFullYear(),
          cursor.getMonth() + 1,
          0,
          23,
          59,
          59,
        );

        const isCovered = enrollment.payments.some(
          (payment) =>
            payment.periodStart <= monthEnd && payment.periodEnd >= monthStart,
        );

        if (!isCovered) {
          const entry = pendingByChild.get(enrollment.childId) ?? {
            child: enrollment.child,
            months: [],
            amountDue: 0,
          };
          entry.months.push(monthStart);
          entry.amountDue += Number(enrollment.monthlyFee);
          pendingByChild.set(enrollment.childId, entry);
        }

        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    return Array.from(pendingByChild.values()).map((entry) => ({
      child: entry.child,
      periods: entry.months.map((month) => month.toISOString().slice(0, 7)),
      amountDue: entry.amountDue,
    }));
  }
}
