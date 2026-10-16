import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PlanFrequency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlanningService } from './planning.service';

function makePrisma(overrides: Record<string, unknown> = {}) {
  const prisma: any = {
    child: { findUnique: jest.fn() },
    area: { findUnique: jest.fn() },
    specialist: { findUnique: jest.fn() },
    treatmentPlan: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    treatmentPlanItem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    evolutionNote: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    ...overrides,
  };
  return prisma;
}

function serviceWith(prisma: ReturnType<typeof makePrisma>) {
  return new PlanningService(prisma as unknown as PrismaService);
}

describe('PlanningService', () => {
  describe('createPlan', () => {
    it('rechaza un niño no asignado al especialista', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1, specialistId: 99 });
      const service = serviceWith(prisma);

      await expect(
        service.createPlan(
          { childId: 1, startDate: '2026-10-01' },
          5, // scope del especialista 5
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('crea el plan con el especialista del scope', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1, specialistId: 5 });
      prisma.treatmentPlan.create.mockResolvedValue({ id: 3 });
      prisma.treatmentPlan.findUnique.mockResolvedValue({
        id: 3,
        specialistId: 5,
        items: [],
      });
      const service = serviceWith(prisma);

      await service.createPlan({ childId: 1, startDate: '2026-10-01' }, 5);

      expect(prisma.treatmentPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          childId: 1,
          specialistId: 5,
          frequency: PlanFrequency.WEEKLY,
          startDate: new Date('2026-10-01T12:00:00.000Z'),
        }),
      });
    });

    it('exige el especialista cuando actúa un ADMIN', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1, specialistId: null });
      const service = serviceWith(prisma);

      await expect(
        service.createPlan({ childId: 1, startDate: '2026-10-01' }, undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getAgenda', () => {
    it('incluye los ítems del día y marca los ya registrados', async () => {
      const prisma = makePrisma();
      const day = new Date('2026-10-13T12:00:00.000Z'); // martes
      prisma.treatmentPlan.findMany.mockResolvedValue([
        {
          id: 1,
          childId: 1,
          areaId: null,
          frequency: PlanFrequency.WEEKLY,
          startDate: new Date('2026-10-01T12:00:00.000Z'),
          endDate: null,
          child: { id: 1, name: 'Ana', lastName: 'Pérez', isActive: true },
          area: null,
          specialist: { id: 5, user: { id: 9, name: 'Luz', lastName: 'Ríos' } },
          items: [
            {
              id: 10,
              title: 'Vocales',
              description: null,
              dayOfWeek: 2,
              order: 0,
            },
          ],
        },
      ]);
      prisma.evolutionNote.findMany.mockResolvedValue([
        { planItemId: 10, date: day },
      ]);
      const service = serviceWith(prisma);

      const agenda = await service.getAgenda({ date: '2026-10-13' }, 5);

      expect(agenda).toHaveLength(1);
      expect(agenda[0].title).toBe('Vocales');
      expect(agenda[0].completed).toBe(true);
    });

    it('excluye los ítems de otro día de la semana', async () => {
      const prisma = makePrisma();
      prisma.treatmentPlan.findMany.mockResolvedValue([
        {
          id: 1,
          childId: 1,
          areaId: null,
          frequency: PlanFrequency.WEEKLY,
          startDate: new Date('2026-10-01T12:00:00.000Z'),
          endDate: null,
          child: { id: 1, name: 'Ana', lastName: 'Pérez', isActive: true },
          area: null,
          specialist: { id: 5, user: { id: 9, name: 'Luz', lastName: 'Ríos' } },
          items: [
            {
              id: 10,
              title: 'Vocales',
              description: null,
              dayOfWeek: 4, // jueves, no el martes consultado
              order: 0,
            },
          ],
        },
      ]);
      prisma.evolutionNote.findMany.mockResolvedValue([]);
      const service = serviceWith(prisma);

      const agenda = await service.getAgenda({ date: '2026-10-13' }, 5);

      expect(agenda).toHaveLength(0);
    });
  });

  describe('createEvolution', () => {
    it('rechaza contenido vacío', async () => {
      const prisma = makePrisma();
      const service = serviceWith(prisma);

      await expect(
        service.createEvolution(
          { childId: 1, date: '2026-10-13', content: '   ' },
          5,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('guarda la nota del especialista del scope', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1, specialistId: 5 });
      prisma.evolutionNote.create.mockResolvedValue({ id: 2 });
      prisma.evolutionNote.findUnique.mockResolvedValue({
        id: 2,
        specialistId: 5,
      });
      const service = serviceWith(prisma);

      await service.createEvolution(
        { childId: 1, date: '2026-10-13', content: 'Avanzó en vocales' },
        5,
      );

      expect(prisma.evolutionNote.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          childId: 1,
          specialistId: 5,
          content: 'Avanzó en vocales',
        }),
      });
    });
  });

  describe('getSpecialistIdByUser', () => {
    it('devuelve null si el usuario no tiene perfil', async () => {
      const prisma = makePrisma();
      prisma.specialist.findUnique.mockResolvedValue(null);
      const service = serviceWith(prisma);

      await expect(service.getSpecialistIdByUser(9)).resolves.toBeNull();
    });
  });

  describe('removePlan', () => {
    it('desactiva en lugar de borrar', async () => {
      const prisma = makePrisma();
      prisma.treatmentPlan.findUnique.mockResolvedValue({
        id: 1,
        specialistId: 5,
      });
      prisma.treatmentPlan.update.mockResolvedValue({ id: 1 });
      const service = serviceWith(prisma);

      await service.removePlan(1, 5);

      expect(prisma.treatmentPlan.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false },
      });
    });
  });
});
