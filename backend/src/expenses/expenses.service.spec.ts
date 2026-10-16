import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ExpensesService } from './expenses.service';

const baseExpense = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  categoryId: 2,
  amount: new Prisma.Decimal(150),
  date: new Date('2026-03-10'),
  description: 'Materiales',
  receiptUrl: null,
  createdById: 7,
  category: { id: 2, name: 'Materiales', color: '#22c55e', isActive: true },
  createdBy: { id: 7, name: 'Ana', lastName: 'Pérez' },
  ...overrides,
});

interface SetupOptions {
  categoryFindUnique?: jest.Mock;
  categoryCreate?: jest.Mock;
  expenseCreate?: jest.Mock;
  expenseFindUnique?: jest.Mock;
  expenseFindMany?: jest.Mock;
  aggregate?: jest.Mock;
  groupBy?: jest.Mock;
  categoryFindMany?: jest.Mock;
}

function setup(options: SetupOptions = {}) {
  const prisma = {
    category: {
      findMany:
        options.categoryFindMany ??
        jest.fn().mockResolvedValue([baseExpense().category]),
      findUnique:
        options.categoryFindUnique ?? jest.fn().mockResolvedValue({ id: 2 }),
      create: options.categoryCreate ?? jest.fn(),
      update: jest.fn(),
    },
    expense: {
      findMany: options.expenseFindMany ?? jest.fn().mockResolvedValue([]),
      findUnique:
        options.expenseFindUnique ?? jest.fn().mockResolvedValue(baseExpense()),
      create:
        options.expenseCreate ?? jest.fn().mockResolvedValue(baseExpense()),
      update: jest.fn(),
      aggregate: options.aggregate ?? jest.fn(),
      groupBy: options.groupBy ?? jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn(),
  };

  return {
    service: new ExpensesService(prisma as unknown as PrismaService),
    prisma,
  };
}

describe('ExpensesService', () => {
  describe('categorías', () => {
    it('traduce el nombre duplicado a 400', async () => {
      const categoryCreate = jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique', {
          code: 'P2002',
          clientVersion: '5.22.0',
          meta: { target: ['name'] },
        }),
      );
      const { service } = setup({ categoryCreate });

      await expect(
        service.createCategory({ name: 'Materiales' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('gastos', () => {
    it('lanza 400 si la categoría no existe', async () => {
      const { service } = setup({
        categoryFindUnique: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.create({ categoryId: 99, amount: 100, date: '2026-03-10' }, 7),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('registra el gasto con el usuario creador', async () => {
      const expenseCreate = jest.fn().mockResolvedValue(baseExpense({ id: 5 }));
      const { service } = setup({ expenseCreate });

      await service.create(
        { categoryId: 2, amount: 100, date: '2026-03-10' },
        7,
      );

      expect(expenseCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ categoryId: 2, createdById: 7 }),
      });
    });

    it('filtra por rango de fechas y categoría', async () => {
      const expenseFindMany = jest.fn().mockResolvedValue([]);
      const { service } = setup({ expenseFindMany });

      await service.findAll({
        categoryId: 2,
        from: '2026-01-01',
        to: '2026-01-31',
      });

      const call = expenseFindMany.mock.calls[0][0] as {
        where: { categoryId: number; date: unknown };
      };
      expect(call.where.categoryId).toBe(2);
      expect(call.where.date).toBeDefined();
    });

    it('lanza 404 al buscar un gasto inexistente', async () => {
      const { service } = setup({
        expenseFindUnique: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(404)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('calcula los totales del período, del día y por categoría', async () => {
      const aggregate = jest
        .fn()
        .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal(1000) } })
        .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal(250) } });
      const groupBy = jest.fn().mockResolvedValue([
        { categoryId: 2, _sum: { amount: new Prisma.Decimal(700) } },
        { categoryId: 3, _sum: { amount: new Prisma.Decimal(300) } },
      ]);
      const categoryFindMany = jest.fn().mockResolvedValue([
        { id: 2, name: 'Materiales', color: '#22c55e' },
        { id: 3, name: 'Servicios', color: null },
      ]);
      const { service } = setup({ aggregate, groupBy, categoryFindMany });

      const totals = await service.totals({ from: '2026-01-01' });

      expect(totals.periodTotal).toBe(1000);
      expect(totals.todayTotal).toBe(250);
      expect(totals.byCategory).toHaveLength(2);
      expect(totals.byCategory[0]).toMatchObject({ categoryId: 2, total: 700 });
    });
  });
});
