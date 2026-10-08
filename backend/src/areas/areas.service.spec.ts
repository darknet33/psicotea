import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AreasService } from './areas.service';

type AreaRecord = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const baseArea = (overrides: Partial<AreaRecord> = {}): AreaRecord => ({
  id: 1,
  name: 'Lenguaje',
  description: null,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

function createService(overrides: {
  findMany?: jest.Mock;
  findUnique?: jest.Mock;
  create?: jest.Mock;
  update?: jest.Mock;
}): { service: AreasService; prisma: any } {
  const prisma = {
    area: {
      findMany: overrides.findMany ?? jest.fn(),
      findUnique: overrides.findUnique ?? jest.fn(),
      create: overrides.create ?? jest.fn(),
      update: overrides.update ?? jest.fn(),
    },
  };

  return {
    service: new AreasService(prisma as unknown as PrismaService),
    prisma,
  };
}

describe('AreasService', () => {
  describe('findAll', () => {
    it('filtra por isActive cuando no se piden inactivas', async () => {
      const findMany = jest.fn().mockResolvedValue([baseArea()]);
      const { service } = createService({ findMany });

      await service.findAll();

      expect(findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    });

    it('incluye inactivas cuando includeInactive es true', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const { service } = createService({ findMany });

      await service.findAll({ includeInactive: true });

      expect(findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('devuelve el área cuando existe', async () => {
      const findUnique = jest.fn().mockResolvedValue(baseArea({ id: 5 }));
      const { service } = createService({ findUnique });

      await expect(service.findOne(5)).resolves.toMatchObject({ id: 5 });
    });

    it('lanza 404 cuando el área no existe', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const { service } = createService({ findUnique });

      await expect(service.findOne(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('recorta el nombre y la descripción', async () => {
      const create = jest
        .fn()
        .mockImplementation(({ data }: { data: AreaRecord }) =>
          Promise.resolve(baseArea(data)),
        );
      const { service } = createService({ create });

      await service.create({ name: '  Lenguaje  ', description: '  oral  ' });

      expect(create).toHaveBeenCalledWith({
        data: { name: 'Lenguaje', description: 'oral' },
      });
    });

    it('traduce el nombre duplicado a un 400 con mensaje claro', async () => {
      const create = jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique', {
          code: 'P2002',
          clientVersion: '5.22.0',
          meta: { target: ['name'] },
        }),
      );
      const { service } = createService({ create });

      await expect(service.create({ name: 'Lenguaje' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('desactiva un área', async () => {
      const findUnique = jest
        .fn()
        .mockResolvedValue(baseArea({ isActive: true }));
      const update = jest.fn().mockResolvedValue(baseArea({ isActive: false }));
      const { service } = createService({ findUnique, update });

      const result = await service.update(1, { isActive: false });

      expect(update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });

    it('reactiva un área', async () => {
      const findUnique = jest
        .fn()
        .mockResolvedValue(baseArea({ isActive: false }));
      const update = jest.fn().mockResolvedValue(baseArea({ isActive: true }));
      const { service } = createService({ findUnique, update });

      const result = await service.update(1, { isActive: true });

      expect(update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: true },
      });
      expect(result.isActive).toBe(true);
    });

    it('lanza 404 si el área no existe', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const update = jest.fn();
      const { service } = createService({ findUnique, update });

      await expect(service.update(99, { name: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(update).not.toHaveBeenCalled();
    });

    it('traduce un nombre duplicado al editar a un 400', async () => {
      const findUnique = jest.fn().mockResolvedValue(baseArea());
      const update = jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique', {
          code: 'P2002',
          clientVersion: '5.22.0',
          meta: { target: ['name'] },
        }),
      );
      const { service } = createService({ findUnique, update });

      await expect(
        service.update(1, { name: 'Conducta' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
