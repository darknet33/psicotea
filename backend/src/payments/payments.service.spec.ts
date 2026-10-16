import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, EnrollmentType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';

function makePrisma(overrides: Record<string, unknown> = {}) {
  const prisma: any = {
    child: { findUnique: jest.fn() },
    enrollment: { findMany: jest.fn(), findFirst: jest.fn() },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    paymentAllocation: { deleteMany: jest.fn(), createMany: jest.fn() },
    ...overrides,
  };
  prisma.$transaction = jest.fn((cb: (tx: unknown) => unknown) => cb(prisma));
  return prisma;
}

function serviceWith(prisma: ReturnType<typeof makePrisma>) {
  return new PaymentsService(prisma as unknown as PrismaService);
}

function paymentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    childId: 1,
    enrollmentId: 1,
    amount: new Prisma.Decimal(600),
    paymentDate: new Date('2026-11-05T12:00:00.000Z'),
    method: 'EFECTIVO',
    reference: null,
    description: null,
    periodStart: new Date('2026-10-01T12:00:00.000Z'),
    periodEnd: new Date('2026-10-31T12:00:00.000Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
    child: { id: 1, name: 'Martina', lastName: 'Gómez' },
    allocations: [],
    ...overrides,
  };
}

function enrollmentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    type: EnrollmentType.MENSUAL,
    startDate: new Date('2026-10-01T12:00:00.000Z'),
    endDate: new Date('2026-10-31T12:00:00.000Z'),
    status: EnrollmentStatus.ACTIVO,
    amount: new Prisma.Decimal(500),
    allocations: [],
    ...overrides,
  };
}

const baseDto = {
  childId: 1,
  amount: 600,
  paymentDate: '2026-11-05',
  method: 'EFECTIVO' as const,
  periodStart: '2026-10-01',
  periodEnd: '2026-10-31',
};

describe('PaymentsService', () => {
  describe('create', () => {
    it('aplica el pago a una sola inscripción indicada', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.enrollment.findFirst.mockResolvedValue({ id: 1 });
      prisma.payment.create.mockResolvedValue({ id: 1 });
      prisma.payment.findUnique.mockResolvedValue(paymentRow());

      const service = serviceWith(prisma);
      await service.create({ ...baseDto, enrollmentId: 1 });

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            childId: 1,
            enrollmentId: 1,
            allocations: {
              create: [{ enrollmentId: 1, amount: 600 }],
            },
          }),
        }),
      );
    });

    it('reparte automáticamente de la deuda más antigua a la más reciente', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.enrollment.findMany.mockResolvedValue([
        enrollmentRow({
          id: 1,
          startDate: new Date('2026-08-01T12:00:00Z'),
          amount: new Prisma.Decimal(500),
          allocations: [],
        }),
        enrollmentRow({
          id: 2,
          startDate: new Date('2026-10-01T12:00:00Z'),
          amount: new Prisma.Decimal(800),
          allocations: [{ amount: new Prisma.Decimal(300) }],
        }),
      ]);
      prisma.payment.create.mockResolvedValue({ id: 1 });
      prisma.payment.findUnique.mockResolvedValue(paymentRow());

      const service = serviceWith(prisma);
      await service.create(baseDto);

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            enrollmentId: 1,
            allocations: {
              create: [
                { enrollmentId: 1, amount: 500 },
                { enrollmentId: 2, amount: 100 },
              ],
            },
          }),
        }),
      );
    });

    it('aplica un pago menor solo a la deuda más antigua', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.enrollment.findMany.mockResolvedValue([
        enrollmentRow({
          id: 1,
          amount: new Prisma.Decimal(500),
          allocations: [],
        }),
      ]);
      prisma.payment.create.mockResolvedValue({ id: 1 });
      prisma.payment.findUnique.mockResolvedValue(paymentRow());

      const service = serviceWith(prisma);
      await service.create({ ...baseDto, amount: 300 });

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            allocations: { create: [{ enrollmentId: 1, amount: 300 }] },
          }),
        }),
      );
    });

    it('aplica el excedente como saldo a favor en la inscripción más reciente', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.enrollment.findMany.mockResolvedValue([
        enrollmentRow({
          id: 1,
          amount: new Prisma.Decimal(500),
          allocations: [],
        }),
      ]);
      prisma.payment.create.mockResolvedValue({ id: 1 });
      prisma.payment.findUnique.mockResolvedValue(paymentRow());

      const service = serviceWith(prisma);
      await service.create({ ...baseDto, amount: 700 });

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            allocations: { create: [{ enrollmentId: 1, amount: 700 }] },
          }),
        }),
      );
    });

    it('rechaza allocations cuya suma no coincide con el pago', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.enrollment.findMany.mockResolvedValue([{ id: 1 }]);

      const service = serviceWith(prisma);

      await expect(
        service.create({
          ...baseDto,
          allocations: [{ enrollmentId: 1, amount: 300 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('rechaza una inscripción destino de otro niño', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.enrollment.findMany.mockResolvedValue([]);

      const service = serviceWith(prisma);

      await expect(
        service.create({
          ...baseDto,
          allocations: [{ enrollmentId: 9, amount: 600 }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('mantiene separadas la fecha de pago y el período cubierto', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.enrollment.findFirst.mockResolvedValue({ id: 1 });
      prisma.payment.create.mockResolvedValue({ id: 1 });
      prisma.payment.findUnique.mockResolvedValue(paymentRow());

      const service = serviceWith(prisma);
      await service.create({
        childId: 1,
        amount: 600,
        paymentDate: '2026-11-05',
        method: 'EFECTIVO',
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        enrollmentId: 1,
      });

      const data = prisma.payment.create.mock.calls[0][0].data;
      expect((data.paymentDate as Date).toISOString().slice(0, 10)).toBe(
        '2026-11-05',
      );
      expect((data.periodStart as Date).toISOString().slice(0, 10)).toBe(
        '2026-10-01',
      );
      expect((data.periodEnd as Date).toISOString().slice(0, 10)).toBe(
        '2026-10-31',
      );
    });

    it('lanza 404 si el niño no existe', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue(null);

      const service = serviceWith(prisma);

      await expect(service.create(baseDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rechaza un período inválido', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });

      const service = serviceWith(prisma);

      await expect(
        service.create({
          ...baseDto,
          periodStart: '2026-10-31',
          periodEnd: '2026-10-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getPendingPayments', () => {
    it('separa la deuda vigente de las anteriores y calcula con allocations', async () => {
      const prisma = makePrisma();
      prisma.enrollment.findMany.mockResolvedValue([
        {
          ...enrollmentRow({
            id: 1,
            startDate: new Date('2020-01-01T12:00:00Z'),
            endDate: new Date('2020-01-31T12:00:00Z'),
            status: EnrollmentStatus.RETIRADO,
            amount: new Prisma.Decimal(500),
            allocations: [],
          }),
          child: { id: 1, name: 'Martina', lastName: 'Gómez' },
        },
        {
          ...enrollmentRow({
            id: 2,
            startDate: new Date('2000-01-01T12:00:00Z'),
            endDate: new Date('2999-12-31T12:00:00Z'),
            status: EnrollmentStatus.ACTIVO,
            amount: new Prisma.Decimal(800),
            allocations: [{ amount: new Prisma.Decimal(300) }],
          }),
          child: { id: 1, name: 'Martina', lastName: 'Gómez' },
        },
      ]);

      const service = serviceWith(prisma);
      const result = await service.getPendingPayments();

      expect(result).toHaveLength(1);
      expect(result[0].active).toMatchObject({ saldo: 500 });
      expect(result[0].previousDebts).toHaveLength(1);
      expect(result[0].previousDebts[0]).toMatchObject({ saldo: 500 });
      expect(result[0].totalDue).toBe(1000);
    });

    it('no reporta inscripciones sin saldo', async () => {
      const prisma = makePrisma();
      prisma.enrollment.findMany.mockResolvedValue([
        {
          ...enrollmentRow({
            amount: new Prisma.Decimal(500),
            allocations: [{ amount: new Prisma.Decimal(500) }],
          }),
          child: { id: 1, name: 'Martina', lastName: 'Gómez' },
        },
      ]);

      const service = serviceWith(prisma);
      const result = await service.getPendingPayments();

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('recalcula las allocations al cambiar el monto', async () => {
      const prisma = makePrisma();
      prisma.payment.findUnique
        .mockResolvedValueOnce(paymentRow({ amount: new Prisma.Decimal(600) }))
        .mockResolvedValueOnce(paymentRow({ amount: new Prisma.Decimal(700) }));
      prisma.enrollment.findMany.mockResolvedValue([
        enrollmentRow({
          id: 1,
          amount: new Prisma.Decimal(800),
          allocations: [],
        }),
      ]);
      prisma.payment.update.mockResolvedValue(paymentRow());

      const service = serviceWith(prisma);
      await service.update(1, { amount: 700 });

      expect(prisma.paymentAllocation.deleteMany).toHaveBeenCalledWith({
        where: { paymentId: 1 },
      });
      expect(prisma.paymentAllocation.createMany).toHaveBeenCalledWith({
        data: [{ paymentId: 1, enrollmentId: 1, amount: 700 }],
      });
    });

    it('lanza 404 si el pago no existe', async () => {
      const prisma = makePrisma();
      prisma.payment.findUnique.mockResolvedValue(null);

      const service = serviceWith(prisma);

      await expect(service.update(99, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
