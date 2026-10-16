import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { parseDateOnly } from '../enrollments/enrollments.service';

const EXPENSE_INCLUDE = {
  category: true,
  createdBy: {
    select: { id: true, name: true, lastName: true },
  },
} satisfies Prisma.ExpenseInclude;

export interface ExpenseTotals {
  periodTotal: number;
  todayTotal: number;
  byCategory: Array<{
    categoryId: number;
    name: string;
    color: string | null;
    total: number;
  }>;
}

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Categorías ---

  async findAllCategories(query: QueryCategoriesDto = {}) {
    return this.prisma.category.findMany({
      where: query.includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() ?? null,
          color: dto.color?.trim() ?? null,
        },
      });
    } catch (error) {
      this.rethrowCategoryDuplicate(error);
    }
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    await this.ensureCategory(id);

    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.description !== undefined && {
            description: dto.description.trim(),
          }),
          ...(dto.color !== undefined && { color: dto.color.trim() }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });
    } catch (error) {
      this.rethrowCategoryDuplicate(error);
    }
  }

  // --- Gastos ---

  async findAll(query: QueryExpensesDto = {}) {
    return this.prisma.expense.findMany({
      where: this.buildWhere(query),
      include: EXPENSE_INCLUDE,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });
  }

  async findOne(id: number) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: EXPENSE_INCLUDE,
    });

    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }

    return expense;
  }

  async create(dto: CreateExpenseDto, createdById: number) {
    await this.ensureCategory(dto.categoryId);

    const created = await this.prisma.expense.create({
      data: {
        categoryId: dto.categoryId,
        amount: dto.amount,
        date: parseDateOnly(dto.date),
        description: dto.description?.trim() ?? null,
        receiptUrl: dto.receiptUrl?.trim() ?? null,
        createdById,
      },
    });

    return this.findOne(created.id);
  }

  async update(id: number, dto: UpdateExpenseDto) {
    await this.findOne(id);

    if (dto.categoryId !== undefined) {
      await this.ensureCategory(dto.categoryId);
    }

    await this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.date !== undefined && { date: parseDateOnly(dto.date) }),
        ...(dto.description !== undefined && {
          description: dto.description.trim(),
        }),
        ...(dto.receiptUrl !== undefined && {
          receiptUrl: dto.receiptUrl.trim(),
        }),
      },
    });

    return this.findOne(id);
  }

  async totals(query: QueryExpensesDto = {}): Promise<ExpenseTotals> {
    const where = this.buildWhere(query);

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(now.getDate()).padStart(2, '0')}`;

    const [periodAgg, todayAgg, grouped] = await Promise.all([
      this.prisma.expense.aggregate({ where, _sum: { amount: true } }),
      this.prisma.expense.aggregate({
        where: { date: parseDateOnly(today) },
        _sum: { amount: true },
      }),
      this.prisma.expense.groupBy({
        by: ['categoryId'],
        where,
        _sum: { amount: true },
      }),
    ]);

    const categoryIds = grouped.map((item) => item.categoryId);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true },
    });
    const categoryMap = new Map(categories.map((item) => [item.id, item]));

    const byCategory = grouped
      .map((item) => ({
        categoryId: item.categoryId,
        name: categoryMap.get(item.categoryId)?.name ?? 'Sin categoría',
        color: categoryMap.get(item.categoryId)?.color ?? null,
        total: Number(item._sum.amount ?? 0),
      }))
      .sort((a, b) => b.total - a.total);

    return {
      periodTotal: Number(periodAgg._sum.amount ?? 0),
      todayTotal: Number(todayAgg._sum.amount ?? 0),
      byCategory,
    };
  }

  private buildWhere(query: QueryExpensesDto): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = {};

    if (query.categoryId !== undefined) {
      where.categoryId = query.categoryId;
    }

    if (query.createdById !== undefined) {
      where.createdById = query.createdById;
    }

    if (query.from || query.to) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (query.from) dateFilter.gte = parseDateOnly(query.from);
      if (query.to) dateFilter.lte = parseDateOnly(query.to);
      where.date = dateFilter;
    }

    if (query.search) {
      where.description = { contains: query.search.trim() };
    }

    return where;
  }

  private async ensureCategory(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      throw new BadRequestException('La categoría indicada no existe');
    }

    return category;
  }

  private rethrowCategoryDuplicate(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(
        'Ya existe una categoría con ese nombre. Reactívala en lugar de duplicarla.',
      );
    }

    throw error;
  }
}
