import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, Prisma, Shift } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  addDays,
  countBilledMonths,
  EnrollmentsService,
  parseDateOnly,
} from './enrollments.service';

function makePrisma(overrides: Record<string, unknown> = {}) {
  const prisma: any = {
    child: { findUnique: jest.fn() },
    area: { count: jest.fn().mockResolvedValue(0) },
    enrollment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    enrollmentScheduleDay: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    enrollmentArea: { createMany: jest.fn(), deleteMany: jest.fn() },
    payment: { create: jest.fn() },
    ...overrides,
  };
  prisma.$transaction = jest.fn((cb: (tx: unknown) => unknown) => cb(prisma));
  return prisma;
}

function serviceWith(prisma: ReturnType<typeof makePrisma>) {
  return new EnrollmentsService(prisma as unknown as PrismaService);
}

function enrollmentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    childId: 1,
    startDate: new Date('2026-01-15T12:00:00.000Z'),
    endDate: new Date('2026-04-15T12:00:00.000Z'),
    durationDays: 90,
    status: EnrollmentStatus.ACTIVO,
    monthlyFee: new Prisma.Decimal(1000),
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    child: {
      id: 1,
      name: 'Martina',
      lastName: 'Gómez',
      photoUrl: null,
      isActive: true,
    },
    scheduleDays: [],
    areas: [],
    payments: [],
    ...overrides,
  };
}

describe('helpers de fecha', () => {
  it('parseDateOnly interpreta YYYY-MM-DD a mediodía UTC', () => {
    expect(parseDateOnly('2026-10-03').toISOString()).toBe(
      '2026-10-03T12:00:00.000Z',
    );
  });

  it('addDays suma días calendario', () => {
    expect(addDays(parseDateOnly('2026-01-15'), 90).toISOString()).toBe(
      '2026-04-15T12:00:00.000Z',
    );
  });
});

describe('countBilledMonths', () => {
  it('cuenta meses completos inclusive', () => {
    expect(
      countBilledMonths(
        new Date('2026-01-01T12:00:00Z'),
        new Date('2026-03-31T12:00:00Z'),
      ),
    ).toBe(3);
  });

  it('un rango dentro del mismo mes cuenta como uno', () => {
    expect(
      countBilledMonths(
        new Date('2026-01-15T12:00:00Z'),
        new Date('2026-01-20T12:00:00Z'),
      ),
    ).toBe(1);
  });

  it('sin endDate cuenta hasta hoy', () => {
    expect(
      countBilledMonths(
        new Date('2026-01-15T12:00:00Z'),
        null,
        new Date('2026-03-10T12:00:00Z'),
      ),
    ).toBe(3);
  });
});

describe('EnrollmentsService', () => {
  describe('create', () => {
    it('crea la inscripción con agenda, áreas y pago inicial en transacción', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.area.count.mockResolvedValue(1);
      prisma.enrollment.findFirst.mockResolvedValue(null);
      prisma.enrollment.create.mockResolvedValue({ id: 10 });
      prisma.payment.create.mockResolvedValue({ id: 1 });
      prisma.enrollment.findUnique.mockResolvedValue(
        enrollmentRow({ id: 10, payments: [] }),
      );

      const service = serviceWith(prisma);
      const result = await service.create({
        childId: 1,
        startDate: '2026-01-15',
        durationDays: 90,
        monthlyFee: 1000,
        areaIds: [1],
        scheduleDays: [{ dayOfWeek: 1, shift: Shift.MANANA }],
        initialPayment: {
          amount: 1000,
          method: 'EFECTIVO',
          periodStart: '2026-01-01',
          periodEnd: '2026-01-31',
        },
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.enrollment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            endDate: expect.any(Date),
            durationDays: 90,
          }),
        }),
      );
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ enrollmentId: 10, childId: 1 }),
        }),
      );
      expect(result).toMatchObject({ id: 10, facturado: 4000, pagado: 0 });
    });

    it('rechaza días repetidos antes de tocar la base', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });

      const service = serviceWith(prisma);

      await expect(
        service.create({
          childId: 1,
          startDate: '2026-01-15',
          durationDays: 90,
          monthlyFee: 1000,
          scheduleDays: [
            { dayOfWeek: 1, shift: Shift.MANANA },
            { dayOfWeek: 1, shift: Shift.TARDE },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.enrollment.create).not.toHaveBeenCalled();
    });

    it('rechaza si el niño ya tiene una inscripción activa', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.enrollment.findFirst.mockResolvedValue({ id: 99 });

      const service = serviceWith(prisma);

      await expect(
        service.create({
          childId: 1,
          startDate: '2026-01-15',
          durationDays: 90,
          monthlyFee: 1000,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza un área inexistente', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.area.count.mockResolvedValue(0);

      const service = serviceWith(prisma);

      await expect(
        service.create({
          childId: 1,
          startDate: '2026-01-15',
          durationDays: 90,
          monthlyFee: 1000,
          areaIds: [42],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza 404 si el niño no existe', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue(null);

      const service = serviceWith(prisma);

      await expect(
        service.create({
          childId: 404,
          startDate: '2026-01-15',
          durationDays: 90,
          monthlyFee: 1000,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('propaga el fallo del pago inicial sin dejar la inscripción', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.enrollment.findFirst.mockResolvedValue(null);
      prisma.enrollment.create.mockResolvedValue({ id: 11 });
      prisma.payment.create.mockRejectedValue(new Error('boom'));

      const service = serviceWith(prisma);

      await expect(
        service.create({
          childId: 1,
          startDate: '2026-01-15',
          durationDays: 90,
          monthlyFee: 1000,
          initialPayment: {
            amount: 1000,
            method: 'EFECTIVO',
            periodStart: '2026-01-01',
            periodEnd: '2026-01-31',
          },
        }),
      ).rejects.toThrow('boom');
    });
  });

  describe('findAll', () => {
    it('agrupa por niño y suma los totales de la cabecera', async () => {
      const prisma = makePrisma();
      prisma.enrollment.findMany.mockResolvedValue([
        enrollmentRow({
          id: 1,
          payments: [{ amount: new Prisma.Decimal(500) }],
        }),
        enrollmentRow({
          id: 2,
          startDate: new Date('2025-01-10T12:00:00Z'),
          endDate: new Date('2025-02-10T12:00:00Z'),
          payments: [],
        }),
      ]);

      const service = serviceWith(prisma);
      const result = await service.findAll({} as never);

      expect(result.groups).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.groups[0].totals).toMatchObject({
        facturado: 6000,
        pagado: 500,
        saldo: 5500,
      });
      expect(result.groups[0].enrollments).toHaveLength(2);
    });

    it('pagina por niños y aplica búsqueda al where', async () => {
      const prisma = makePrisma();
      prisma.enrollment.findMany.mockResolvedValue([]);

      const service = serviceWith(prisma);
      const result = await service.findAll({
        search: 'Gómez',
        status: EnrollmentStatus.RETIRADO,
        page: 2,
        limit: 10,
      });

      expect(prisma.enrollment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: EnrollmentStatus.RETIRADO,
            child: {
              OR: [
                { name: { contains: 'Gómez' } },
                { lastName: { contains: 'Gómez' } },
              ],
            },
          }),
        }),
      );
      expect(result.meta).toMatchObject({ page: 2, limit: 10, total: 0 });
      expect(result.groups).toEqual([]);
    });
  });

  describe('getPrefill', () => {
    it('propone el endDate anterior como fecha de la nueva inscripción', async () => {
      const prisma = makePrisma();
      prisma.enrollment.findFirst.mockResolvedValue(
        enrollmentRow({
          endDate: new Date('2026-04-15T12:00:00Z'),
          areas: [{ areaId: 3 }],
          scheduleDays: [{ dayOfWeek: 2, shift: Shift.TARDE }],
        }),
      );

      const service = serviceWith(prisma);
      const result = await service.getPrefill(1);

      expect(result).toMatchObject({
        monthlyFee: 1000,
        startDate: '2026-04-15',
        areaIds: [3],
        scheduleDays: [{ dayOfWeek: 2, shift: Shift.TARDE }],
      });
    });

    it('lanza 404 si el niño no tiene inscripciones', async () => {
      const prisma = makePrisma();
      prisma.enrollment.findFirst.mockResolvedValue(null);

      const service = serviceWith(prisma);

      await expect(service.getPrefill(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('reemplaza la agenda y las áreas al recibirlas', async () => {
      const prisma = makePrisma();
      prisma.enrollment.findUnique
        .mockResolvedValueOnce(enrollmentRow())
        .mockResolvedValueOnce(enrollmentRow());
      prisma.area.count.mockResolvedValue(1);
      prisma.enrollment.update.mockResolvedValue(enrollmentRow());

      const service = serviceWith(prisma);
      await service.update(1, {
        areaIds: [2],
        scheduleDays: [{ dayOfWeek: 3, shift: Shift.TODO_DIA }],
      });

      expect(prisma.enrollmentScheduleDay.deleteMany).toHaveBeenCalledWith({
        where: { enrollmentId: 1 },
      });
      expect(prisma.enrollmentArea.deleteMany).toHaveBeenCalledWith({
        where: { enrollmentId: 1 },
      });
      expect(prisma.enrollmentArea.createMany).toHaveBeenCalledWith({
        data: [{ enrollmentId: 1, areaId: 2 }],
      });
    });

    it('lanza 404 si la inscripción no existe', async () => {
      const prisma = makePrisma();
      prisma.enrollment.findUnique.mockResolvedValue(null);

      const service = serviceWith(prisma);

      await expect(service.update(99, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
