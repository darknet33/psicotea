import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  EnrollmentStatus,
  EnrollmentType,
  Prisma,
  Shift,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  addDays,
  computeEndDate,
  durationForType,
  EnrollmentsService,
  isVigente,
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
    type: EnrollmentType.TRIMESTRAL,
    startDate: new Date('2026-01-15T12:00:00.000Z'),
    endDate: new Date('2026-04-15T12:00:00.000Z'),
    durationDays: 90,
    status: EnrollmentStatus.ACTIVO,
    amount: new Prisma.Decimal(2400),
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
    allocations: [],
    payments: [],
    ...overrides,
  };
}

describe('helpers de fecha y tipo', () => {
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

  it.each<[EnrollmentType, number]>([
    [EnrollmentType.MENSUAL, 30],
    [EnrollmentType.TRIMESTRAL, 90],
    [EnrollmentType.SEMESTRAL, 180],
    [EnrollmentType.ANUAL, 360],
  ])('durationForType(%s) = %i', (type, days) => {
    expect(durationForType(type)).toBe(days);
  });

  it('computeEndDate deriva la fecha de fin del tipo', () => {
    expect(
      computeEndDate(
        parseDateOnly('2026-01-15'),
        EnrollmentType.MENSUAL,
      ).toISOString(),
    ).toBe('2026-02-14T12:00:00.000Z');
  });
});

describe('isVigente', () => {
  const base = {
    status: EnrollmentStatus.ACTIVO,
    startDate: new Date('2026-01-15T12:00:00.000Z'),
    endDate: new Date('2026-04-15T12:00:00.000Z'),
  };

  it('vigente dentro del rango (inclusive)', () => {
    expect(isVigente(base, new Date('2026-02-20T12:00:00.000Z'))).toBe(true);
    expect(isVigente(base, base.startDate)).toBe(true);
    expect(isVigente(base, base.endDate)).toBe(true);
  });

  it('no vigente después del endDate', () => {
    expect(isVigente(base, new Date('2026-04-16T12:00:00.000Z'))).toBe(false);
  });

  it('no vigente antes del startDate', () => {
    expect(isVigente(base, new Date('2026-01-01T12:00:00.000Z'))).toBe(false);
  });

  it('no vigente si el estado no es ACTIVO', () => {
    expect(
      isVigente(
        { ...base, status: EnrollmentStatus.RETIRADO },
        new Date('2026-02-20T12:00:00.000Z'),
      ),
    ).toBe(false);
  });
});

describe('EnrollmentsService', () => {
  describe('create', () => {
    it('crea trimestral con monto personalizado sin multiplicar por meses', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.enrollment.findFirst.mockResolvedValue(null);
      prisma.enrollment.create.mockResolvedValue({ id: 10 });
      prisma.enrollment.findUnique.mockResolvedValue(
        enrollmentRow({
          id: 10,
          type: EnrollmentType.TRIMESTRAL,
          amount: new Prisma.Decimal(2400),
          allocations: [],
        }),
      );

      const service = serviceWith(prisma);
      const result = await service.create({
        childId: 1,
        type: EnrollmentType.TRIMESTRAL,
        startDate: '2026-01-15',
        amount: 2400,
      });

      expect(prisma.enrollment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: EnrollmentType.TRIMESTRAL,
            amount: 2400,
            durationDays: 90,
            endDate: expect.any(Date),
          }),
        }),
      );
      expect(result).toMatchObject({ total: 2400, pagado: 0, saldo: 2400 });
    });

    it('deriva la duración del tipo ignorando cualquier día del cliente', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.enrollment.findFirst.mockResolvedValue(null);
      prisma.enrollment.create.mockResolvedValue({ id: 11 });
      prisma.enrollment.findUnique.mockResolvedValue(
        enrollmentRow({
          id: 11,
          type: EnrollmentType.MENSUAL,
          durationDays: 30,
        }),
      );

      const service = serviceWith(prisma);
      await service.create({
        childId: 1,
        type: EnrollmentType.MENSUAL,
        startDate: '2026-01-15',
        amount: 750,
        // @ts-expect-error el cliente no debería enviar días
        durationDays: 999,
      });

      expect(prisma.enrollment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ durationDays: 30 }),
        }),
      );
    });

    it('crea la inscripción con agenda, áreas y pago inicial en transacción', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.area.count.mockResolvedValue(1);
      prisma.enrollment.findFirst.mockResolvedValue(null);
      prisma.enrollment.create.mockResolvedValue({ id: 10 });
      prisma.payment.create.mockResolvedValue({ id: 1 });
      prisma.enrollment.findUnique.mockResolvedValue(
        enrollmentRow({ id: 10, allocations: [] }),
      );

      const service = serviceWith(prisma);
      await service.create({
        childId: 1,
        type: EnrollmentType.TRIMESTRAL,
        startDate: '2026-01-15',
        amount: 2400,
        areaIds: [1],
        scheduleDays: [{ dayOfWeek: 1, shift: Shift.MANANA }],
        initialPayment: {
          amount: 2400,
          paymentDate: '2026-01-15',
          method: 'EFECTIVO',
          periodStart: '2026-01-15',
          periodEnd: '2026-04-15',
        },
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            enrollmentId: 10,
            childId: 1,
            paymentDate: expect.any(Date),
            allocations: {
              create: [{ enrollmentId: 10, amount: 2400 }],
            },
          }),
        }),
      );
    });

    it('rechaza un pago inicial mayor al monto de la inscripción', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });

      const service = serviceWith(prisma);

      await expect(
        service.create({
          childId: 1,
          type: EnrollmentType.MENSUAL,
          startDate: '2026-01-15',
          amount: 750,
          initialPayment: {
            amount: 800,
            paymentDate: '2026-01-15',
            method: 'EFECTIVO',
            periodStart: '2026-01-15',
            periodEnd: '2026-02-14',
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza el solapamiento con otra inscripción del niño', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.enrollment.findFirst.mockResolvedValue({ id: 99 });

      const service = serviceWith(prisma);

      await expect(
        service.create({
          childId: 1,
          type: EnrollmentType.MENSUAL,
          startDate: '2026-01-15',
          amount: 750,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.enrollment.create).not.toHaveBeenCalled();
    });

    it('permite la reinscripción continua el día siguiente al fin', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.enrollment.findFirst.mockResolvedValue(null);
      prisma.enrollment.create.mockResolvedValue({ id: 12 });
      prisma.enrollment.findUnique.mockResolvedValue(
        enrollmentRow({ id: 12, startDate: new Date('2026-04-16T12:00:00Z') }),
      );

      const service = serviceWith(prisma);
      const result = await service.create({
        childId: 1,
        type: EnrollmentType.MENSUAL,
        startDate: '2026-04-16',
        amount: 800,
      });

      expect(result).toMatchObject({ id: 12 });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('rechaza días repetidos antes de tocar la base', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });

      const service = serviceWith(prisma);

      await expect(
        service.create({
          childId: 1,
          type: EnrollmentType.TRIMESTRAL,
          startDate: '2026-01-15',
          amount: 1000,
          scheduleDays: [
            { dayOfWeek: 1, shift: Shift.MANANA },
            { dayOfWeek: 1, shift: Shift.TARDE },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.enrollment.create).not.toHaveBeenCalled();
    });

    it('rechaza un área inexistente', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.area.count.mockResolvedValue(0);

      const service = serviceWith(prisma);

      await expect(
        service.create({
          childId: 1,
          type: EnrollmentType.TRIMESTRAL,
          startDate: '2026-01-15',
          amount: 1000,
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
          type: EnrollmentType.MENSUAL,
          startDate: '2026-01-15',
          amount: 750,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('propaga el fallo del pago inicial (todo o nada)', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.enrollment.findFirst.mockResolvedValue(null);
      prisma.enrollment.create.mockResolvedValue({ id: 11 });
      prisma.payment.create.mockRejectedValue(new Error('boom'));

      const service = serviceWith(prisma);

      await expect(
        service.create({
          childId: 1,
          type: EnrollmentType.TRIMESTRAL,
          startDate: '2026-01-15',
          amount: 2400,
          initialPayment: {
            amount: 1000,
            paymentDate: '2026-01-15',
            method: 'EFECTIVO',
            periodStart: '2026-01-15',
            periodEnd: '2026-01-31',
          },
        }),
      ).rejects.toThrow('boom');
    });
  });

  describe('findAll', () => {
    it('suma amount sin multiplicar por meses', async () => {
      const prisma = makePrisma();
      prisma.enrollment.findMany.mockResolvedValue([
        enrollmentRow({
          id: 1,
          amount: new Prisma.Decimal(2400),
          allocations: [{ amount: new Prisma.Decimal(500) }],
        }),
        enrollmentRow({
          id: 2,
          type: EnrollmentType.MENSUAL,
          amount: new Prisma.Decimal(750),
          allocations: [],
        }),
      ]);

      const service = serviceWith(prisma);
      const result = await service.findAll({} as never);

      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].totals).toMatchObject({
        total: 3150,
        pagado: 500,
        saldo: 2650,
      });
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
    it('propone el día siguiente al endDate anterior y conserva monto histórico', async () => {
      const prisma = makePrisma();
      prisma.enrollment.findFirst.mockResolvedValue(
        enrollmentRow({
          type: EnrollmentType.TRIMESTRAL,
          amount: new Prisma.Decimal(2400),
          endDate: new Date('2026-04-15T12:00:00Z'),
          areas: [{ areaId: 3 }],
          scheduleDays: [{ dayOfWeek: 2, shift: Shift.TARDE }],
        }),
      );

      const service = serviceWith(prisma);
      const result = await service.getPrefill(1);

      expect(result).toMatchObject({
        type: EnrollmentType.TRIMESTRAL,
        amount: 2400,
        startDate: '2026-04-16',
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

  describe('getSummary', () => {
    it('identifica la vigente y separa las deudas anteriores', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1 });
      prisma.enrollment.findMany.mockResolvedValue([
        enrollmentRow({
          id: 1,
          type: EnrollmentType.MENSUAL,
          status: EnrollmentStatus.RETIRADO,
          startDate: new Date('2025-01-01T12:00:00Z'),
          endDate: new Date('2025-01-31T12:00:00Z'),
          amount: new Prisma.Decimal(500),
          allocations: [{ amount: new Prisma.Decimal(200) }],
        }),
        enrollmentRow({
          id: 2,
          startDate: new Date('2000-01-15T12:00:00Z'),
          endDate: new Date('2999-04-15T12:00:00Z'),
          amount: new Prisma.Decimal(900),
          allocations: [],
        }),
      ]);

      const service = serviceWith(prisma);
      const result = await service.getSummary(1);

      expect(result.active).toBeTruthy();
      expect(result.active?.saldo).toBe(900);
      expect(result.previousDebts).toHaveLength(1);
      expect(result.previousDebts[0]).toMatchObject({ saldo: 300 });
    });
  });

  describe('update', () => {
    it('recalcula la duración y el fin al cambiar el tipo', async () => {
      const prisma = makePrisma();
      prisma.enrollment.findUnique
        .mockResolvedValueOnce(enrollmentRow())
        .mockResolvedValueOnce(enrollmentRow());
      prisma.enrollment.update.mockResolvedValue(enrollmentRow());

      const service = serviceWith(prisma);
      await service.update(1, { type: EnrollmentType.SEMESTRAL });

      expect(prisma.enrollment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: EnrollmentType.SEMESTRAL,
            durationDays: 180,
          }),
        }),
      );
    });

    it('rechaza una edición que genera solapamiento', async () => {
      const prisma = makePrisma();
      prisma.enrollment.findUnique.mockResolvedValueOnce(enrollmentRow());
      prisma.enrollment.findFirst.mockResolvedValue({ id: 77 });

      const service = serviceWith(prisma);

      await expect(
        service.update(1, { startDate: '2026-02-01' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

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
