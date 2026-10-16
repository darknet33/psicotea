import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SpecialistsService } from './specialists.service';

function makePrisma(overrides: Record<string, unknown> = {}) {
  const prisma: any = {
    user: { findUnique: jest.fn() },
    child: { findMany: jest.fn(), updateMany: jest.fn() },
    area: { findMany: jest.fn() },
    specialist: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    specialistSchedule: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    specialistArea: { deleteMany: jest.fn(), createMany: jest.fn() },
    specialistPayment: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    ...overrides,
  };
  prisma.$transaction = jest.fn((arg: unknown) =>
    Array.isArray(arg)
      ? Promise.all(arg)
      : (arg as (tx: unknown) => unknown)(prisma),
  );
  return prisma;
}

function serviceWith(prisma: ReturnType<typeof makePrisma>) {
  return new SpecialistsService(prisma as unknown as PrismaService);
}

const baseDto = {
  userId: 7,
  professionalId: 'PSI-001',
  specialty: 'Psicología',
  entryDate: '2026-01-15',
  monthlySalary: 3000,
};

describe('SpecialistsService', () => {
  describe('create', () => {
    it('rechaza un usuario que no tiene rol ESPECIALISTA', async () => {
      const prisma = makePrisma();
      prisma.user.findUnique.mockResolvedValue({ id: 7, role: Role.ADMIN });
      const service = serviceWith(prisma);

      await expect(service.create(baseDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rechaza un usuario que ya tiene perfil de especialista', async () => {
      const prisma = makePrisma();
      prisma.user.findUnique.mockResolvedValue({
        id: 7,
        role: Role.ESPECIALISTA,
      });
      prisma.specialist.findUnique.mockResolvedValue({ id: 1 });
      const service = serviceWith(prisma);

      await expect(service.create(baseDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('crea el especialista con la fecha de ingreso parseada', async () => {
      const prisma = makePrisma();
      prisma.user.findUnique.mockResolvedValue({
        id: 7,
        role: Role.ESPECIALISTA,
      });
      prisma.specialist.findUnique
        .mockResolvedValueOnce(null) // verificación de duplicado
        .mockResolvedValueOnce({ id: 1, professionalId: 'PSI-001' }); // findOne
      prisma.specialist.create.mockResolvedValue({ id: 1 });
      const service = serviceWith(prisma);

      await service.create(baseDto);

      expect(prisma.specialist.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 7,
            professionalId: 'PSI-001',
            monthlySalary: 3000,
            entryDate: new Date('2026-01-15T12:00:00.000Z'),
          }),
        }),
      );
    });
  });

  describe('replaceSchedule', () => {
    it('rechaza un día sin turno ni horas', async () => {
      const prisma = makePrisma();
      prisma.specialist.findUnique.mockResolvedValue({ id: 1 });
      const service = serviceWith(prisma);

      await expect(
        service.replaceSchedule(1, [{ dayOfWeek: 1 }]),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza turno y horas a la vez', async () => {
      const prisma = makePrisma();
      prisma.specialist.findUnique.mockResolvedValue({ id: 1 });
      const service = serviceWith(prisma);

      await expect(
        service.replaceSchedule(1, [
          {
            dayOfWeek: 1,
            shift: 'MANANA',
            startTime: '09:00',
            endTime: '10:00',
          },
        ]),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza horas invertidas', async () => {
      const prisma = makePrisma();
      prisma.specialist.findUnique.mockResolvedValue({ id: 1 });
      const service = serviceWith(prisma);

      await expect(
        service.replaceSchedule(1, [
          { dayOfWeek: 1, startTime: '12:00', endTime: '09:00' },
        ]),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('reemplaza el horario con un turno válido', async () => {
      const prisma = makePrisma();
      prisma.specialist.findUnique.mockResolvedValue({ id: 1 });
      prisma.specialistSchedule.deleteMany.mockResolvedValue({ count: 0 });
      prisma.specialistSchedule.createMany.mockResolvedValue({ count: 1 });
      prisma.specialistSchedule.findMany.mockResolvedValue([]);
      const service = serviceWith(prisma);

      await service.replaceSchedule(1, [{ dayOfWeek: 1, shift: 'TARDE' }]);

      expect(prisma.specialistSchedule.createMany).toHaveBeenCalledWith({
        data: [
          {
            specialistId: 1,
            dayOfWeek: 1,
            shift: 'TARDE',
            startTime: null,
            endTime: null,
          },
        ],
      });
    });
  });

  describe('replaceAreas', () => {
    it('rechaza un área inexistente', async () => {
      const prisma = makePrisma();
      prisma.specialist.findUnique.mockResolvedValue({ id: 1 });
      prisma.area.findMany.mockResolvedValue([{ id: 1 }]);
      const service = serviceWith(prisma);

      await expect(service.replaceAreas(1, [1, 2])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('replaceChildren', () => {
    it('desasigna los niños que salen de la lista', async () => {
      const prisma = makePrisma();
      prisma.specialist.findUnique
        .mockResolvedValueOnce({ id: 1 }) // ensureExists
        .mockResolvedValueOnce({ id: 1 }); // findOne
      prisma.child.findMany.mockResolvedValue([{ id: 10 }]);
      prisma.child.updateMany.mockResolvedValue({ count: 1 });
      prisma.specialistSchedule.findMany.mockResolvedValue([]);
      const service = serviceWith(prisma);

      await service.replaceChildren(1, [10]);

      expect(prisma.child.updateMany).toHaveBeenCalledWith({
        where: { specialistId: 1, id: { notIn: [10] } },
        data: { specialistId: null },
      });
    });
  });

  describe('createPayment', () => {
    it('rechaza un período invertido', async () => {
      const prisma = makePrisma();
      prisma.specialist.findUnique.mockResolvedValue({ id: 1 });
      const service = serviceWith(prisma);

      await expect(
        service.createPayment(
          1,
          {
            amount: 100,
            periodStart: '2026-03-31',
            periodEnd: '2026-03-01',
            paymentDate: '2026-03-31',
            method: 'EFECTIVO',
          },
          99,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('registra el pago con el creador correcto', async () => {
      const prisma = makePrisma();
      prisma.specialist.findUnique.mockResolvedValue({ id: 1 });
      prisma.specialistPayment.create.mockResolvedValue({ id: 5 });
      const service = serviceWith(prisma);

      await service.createPayment(
        1,
        {
          amount: 3000,
          periodStart: '2026-03-01',
          periodEnd: '2026-03-31',
          paymentDate: '2026-03-31',
          method: 'TRANSFERENCIA',
        },
        99,
      );

      expect(prisma.specialistPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          specialistId: 1,
          amount: 3000,
          method: 'TRANSFERENCIA',
          createdById: 99,
        }),
      });
    });
  });

  describe('getPaymentPeriods', () => {
    it('genera un período por mes desde la fecha de ingreso', async () => {
      const prisma = makePrisma();
      const currentYear = new Date().getUTCFullYear();
      prisma.specialist.findUnique.mockResolvedValue({
        id: 1,
        entryDate: new Date(Date.UTC(currentYear, 0, 15)),
        monthlySalary: new Prisma.Decimal(3000),
      });
      prisma.specialistPayment.findMany.mockResolvedValue([]);
      const service = serviceWith(prisma);

      const periods = await service.getPaymentPeriods(1);

      expect(periods.length).toBeGreaterThanOrEqual(1);
      expect(periods[0].label).toContain(String(currentYear));
      expect(periods[0].isPaid).toBe(false);
    });
  });

  describe('deletePayment', () => {
    it('responde 404 si el pago no pertenece al especialista', async () => {
      const prisma = makePrisma();
      prisma.specialist.findUnique.mockResolvedValue({ id: 1 });
      prisma.specialistPayment.findFirst.mockResolvedValue(null);
      const service = serviceWith(prisma);

      await expect(service.deletePayment(1, 5)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
