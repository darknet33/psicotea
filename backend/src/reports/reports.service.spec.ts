import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReportPeriod, ReportType, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService, type ReportActor } from './reports.service';

function makePrisma(overrides: Record<string, unknown> = {}) {
  const prisma: any = {
    child: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    specialist: { findUnique: jest.fn() },
    report: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reportAttachment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    evolutionNote: { findMany: jest.fn() },
    ...overrides,
  };
  return prisma;
}

function serviceWith(prisma: ReturnType<typeof makePrisma>) {
  return new ReportsService(prisma as unknown as PrismaService);
}

const admin: ReportActor = { userId: 1, role: Role.ADMIN };
const specialist: ReportActor = {
  userId: 9,
  role: Role.ESPECIALISTA,
  specialistProfileId: 5,
};

function reportRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    childId: 1,
    specialistId: 9,
    title: 'Informe',
    content: 'Contenido',
    type: ReportType.EVOLUTIVO,
    reportPeriod: ReportPeriod.NINGUNO,
    summary: null,
    periodStart: new Date('2026-10-01T12:00:00.000Z'),
    periodEnd: new Date('2026-10-31T12:00:00.000Z'),
    isDraft: false,
    visibilityToParents: true,
    child: {
      id: 1,
      name: 'Ana',
      lastName: 'Pérez',
      carnet: '1',
      dateOfBirth: new Date(),
    },
    specialist: { id: 9, name: 'Luz', lastName: 'Ríos', email: 'luz@x.com' },
    attachments: [],
    ...overrides,
  };
}

describe('ReportsService', () => {
  describe('create', () => {
    it('rechaza un niño no asignado al especialista', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1, specialistId: 99 });
      const service = serviceWith(prisma);

      await expect(
        service.create(
          {
            childId: 1,
            title: 'Informe',
            content: 'x',
            periodStart: '2026-10-01',
            periodEnd: '2026-10-31',
          },
          specialist,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('asigna como especialista al usuario del especialista', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1, specialistId: 5 });
      prisma.report.create.mockResolvedValue({ id: 1 });
      prisma.report.findUnique.mockResolvedValue(reportRow());
      const service = serviceWith(prisma);

      await service.create(
        {
          childId: 1,
          title: 'Informe',
          content: 'x',
          periodStart: '2026-10-01',
          periodEnd: '2026-10-31',
        },
        specialist,
      );

      expect(prisma.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ specialistId: 9, childId: 1 }),
      });
    });

    it('rechaza un período invertido', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1, specialistId: null });
      const service = serviceWith(prisma);

      await expect(
        service.create(
          {
            childId: 1,
            title: 'Informe',
            content: 'x',
            specialistId: 9,
            periodStart: '2026-10-31',
            periodEnd: '2026-10-01',
          },
          admin,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('evolutionDraft', () => {
    it('consolida las notas de evolución del rango', async () => {
      const prisma = makePrisma();
      prisma.child.findUnique.mockResolvedValue({ id: 1, specialistId: null });
      prisma.evolutionNote.findMany.mockResolvedValue([
        {
          id: 1,
          date: new Date('2026-10-05T12:00:00.000Z'),
          content: 'Avanzó en vocales',
          observation: null,
          planItem: { title: 'Vocales' },
          specialist: { user: { name: 'Luz', lastName: 'Ríos' } },
        },
      ]);
      const service = serviceWith(prisma);

      const draft = await service.evolutionDraft(
        { childId: 1, from: '2026-10-01', to: '2026-10-31' },
        admin,
      );

      expect(draft.count).toBe(1);
      expect(draft.content).toContain('Avanzó en vocales');
      expect(draft.content).toContain('Vocales');
    });
  });

  describe('findAll', () => {
    it('filtra por especialista cuando el actor es especialista', async () => {
      const prisma = makePrisma();
      prisma.report.findMany.mockResolvedValue([]);
      const service = serviceWith(prisma);

      await service.findAll({}, specialist);

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ specialistId: 9, isDraft: false }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('oculta un informe de otro especialista', async () => {
      const prisma = makePrisma();
      prisma.report.findUnique.mockResolvedValue(
        reportRow({ specialistId: 77 }),
      );
      const service = serviceWith(prisma);

      await expect(service.findOne(1, specialist)).rejects.toThrow();
    });
  });

  describe('buildPdf', () => {
    it('genera un PDF con encabezado válido', async () => {
      const prisma = makePrisma();
      prisma.report.findUnique.mockResolvedValue(reportRow());
      const service = serviceWith(prisma);

      const { buffer, filename } = await service.buildPdf(1, specialist);

      expect(buffer.slice(0, 5).toString()).toBe('%PDF-');
      expect(filename).toMatch(/\.pdf$/);
    });
  });
});
