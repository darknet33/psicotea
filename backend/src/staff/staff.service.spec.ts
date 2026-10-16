import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StaffService } from './staff.service';

type StaffRecord = {
  id: number;
  userId: number;
  employeeId: string;
  position: string;
  department: string | null;
  hireDate: Date;
  salary: unknown;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  user: {
    id: number;
    name: string;
    lastName: string;
    email: string;
    role: Role;
    isActive: boolean;
  };
};

const baseStaff = (overrides: Partial<StaffRecord> = {}): StaffRecord => ({
  id: 1,
  userId: 10,
  employeeId: 'EMP-001',
  position: 'Recepcionista',
  department: null,
  hireDate: new Date('2026-01-15'),
  salary: null,
  phone: null,
  address: null,
  isActive: true,
  user: {
    id: 10,
    name: 'Ana',
    lastName: 'Pérez',
    email: 'ana@psicotea.com',
    role: Role.PERSONAL_ADMINISTRATIVO,
    isActive: true,
  },
  ...overrides,
});

interface SetupOptions {
  user?: { role: Role; specialist: unknown } | null;
  staffFound?: StaffRecord | null;
  create?: jest.Mock;
}

function setup(options: SetupOptions = {}) {
  const user =
    options.user === undefined
      ? { role: Role.PERSONAL_ADMINISTRATIVO, specialist: null }
      : options.user;

  const create = options.create ?? jest.fn().mockResolvedValue(baseStaff());

  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(user) },
    staff: {
      findMany: jest.fn().mockResolvedValue([baseStaff()]),
      findUnique: jest.fn(),
      create,
      update: jest.fn().mockResolvedValue(baseStaff()),
    },
  };

  prisma.staff.findUnique
    .mockResolvedValueOnce(options.staffFound ?? null)
    .mockResolvedValue(baseStaff());

  return {
    service: new StaffService(prisma as unknown as PrismaService),
    prisma,
  };
}

describe('StaffService', () => {
  it('lista solo activos por defecto', async () => {
    const { service, prisma } = setup();

    await service.findAll();

    expect(prisma.staff.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });

  it('incluye inactivos con includeInactive', async () => {
    const { service, prisma } = setup();

    await service.findAll({ includeInactive: true });

    expect(prisma.staff.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('lanza 400 si el usuario no existe', async () => {
    const { service } = setup({ user: null });

    await expect(
      service.create({
        userId: 99,
        employeeId: 'EMP-9',
        position: 'Recepcionista',
        hireDate: '2026-01-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza 400 si el usuario no tiene rol permitido', async () => {
    const { service } = setup({
      user: { role: Role.ESPECIALISTA, specialist: null },
    });

    await expect(
      service.create({
        userId: 10,
        employeeId: 'EMP-9',
        position: 'Recepcionista',
        hireDate: '2026-01-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza 400 si el usuario ya es especialista', async () => {
    const { service } = setup({
      user: { role: Role.ADMIN, specialist: { id: 3 } },
    });

    await expect(
      service.create({
        userId: 10,
        employeeId: 'EMP-9',
        position: 'Recepcionista',
        hireDate: '2026-01-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza 400 si el usuario ya tiene ficha de personal', async () => {
    const { service } = setup({
      user: { role: Role.ADMIN, specialist: null },
      staffFound: baseStaff({ id: 4 }),
    });

    await expect(
      service.create({
        userId: 10,
        employeeId: 'EMP-9',
        position: 'Recepcionista',
        hireDate: '2026-01-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('crea el registro recortando el texto', async () => {
    const create = jest.fn().mockResolvedValue(baseStaff());
    const { service } = setup({ create });

    await service.create({
      userId: 10,
      employeeId: '  EMP-001  ',
      position: '  Recepcionista  ',
      hireDate: '2026-01-15',
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        employeeId: 'EMP-001',
        position: 'Recepcionista',
      }),
    });
  });

  it('lanza 404 al editar un miembro inexistente', async () => {
    const prisma = {
      user: { findUnique: jest.fn() },
      staff: {
        findMany: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    const service = new StaffService(prisma as unknown as PrismaService);

    await expect(service.update(99, { position: 'x' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
