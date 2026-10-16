import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlanFrequency, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { parseDateOnly } from '../enrollments/enrollments.service';
import { CreateTreatmentPlanDto } from './dto/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dto/update-treatment-plan.dto';
import {
  CreateTreatmentPlanItemDto,
  QueryAgendaDto,
  QueryEvolutionDto,
  QueryPlansDto,
  UpdateTreatmentPlanItemDto,
} from './dto/treatment-plan-item.dto';
import {
  CreateEvolutionNoteDto,
  UpdateEvolutionNoteDto,
} from './dto/evolution-note.dto';

const PLAN_INCLUDE = {
  child: { select: { id: true, name: true, lastName: true, isActive: true } },
  area: true,
  specialist: {
    select: {
      id: true,
      user: { select: { id: true, name: true, lastName: true } },
    },
  },
  items: { orderBy: [{ order: 'asc' as const }, { id: 'asc' as const }] },
} satisfies Prisma.TreatmentPlanInclude;

const EVOLUTION_INCLUDE = {
  child: { select: { id: true, name: true, lastName: true } },
  planItem: { select: { id: true, title: true } },
  specialist: {
    select: {
      id: true,
      user: { select: { id: true, name: true, lastName: true } },
    },
  },
} satisfies Prisma.EvolutionNoteInclude;

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async getSpecialistIdByUser(userId: number): Promise<number | null> {
    const specialist = await this.prisma.specialist.findUnique({
      where: { userId },
      select: { id: true },
    });
    return specialist?.id ?? null;
  }

  private scopeFilter(
    scopeSpecialistId?: number,
  ): Prisma.TreatmentPlanWhereInput {
    return scopeSpecialistId === undefined
      ? {}
      : { specialistId: scopeSpecialistId };
  }

  /** Resuelve a qué especialista pertenece un plan o nota nueva. */
  private async resolveSpecialistId(
    dtoSpecialistId: number | undefined,
    scopeSpecialistId: number | undefined,
  ): Promise<number> {
    if (scopeSpecialistId !== undefined) {
      if (scopeSpecialistId < 0) {
        throw new ForbiddenException('No tienes un perfil de especialista');
      }
      return scopeSpecialistId;
    }

    if (dtoSpecialistId === undefined) {
      throw new BadRequestException('Debe indicar el especialista responsable');
    }

    const specialist = await this.prisma.specialist.findUnique({
      where: { id: dtoSpecialistId },
      select: { id: true },
    });

    if (!specialist) {
      throw new BadRequestException('El especialista indicado no existe');
    }

    return specialist.id;
  }

  private async assertChildAssigned(childId: number, specialistId: number) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      select: { id: true, specialistId: true },
    });

    if (!child) {
      throw new NotFoundException('Niño no encontrado');
    }

    if (child.specialistId !== specialistId) {
      throw new ForbiddenException(
        'El niño no está asignado a este especialista',
      );
    }
  }

  // ---------------------------------------------------------------- Planes

  async findAllPlans(query: QueryPlansDto, scopeSpecialistId?: number) {
    const where = this.scopeFilter(scopeSpecialistId);

    if (query.childId !== undefined) where.childId = query.childId;
    if (query.specialistId !== undefined && scopeSpecialistId === undefined) {
      where.specialistId = query.specialistId;
    }
    if (!query.includeInactive) where.isActive = true;

    return this.prisma.treatmentPlan.findMany({
      where,
      include: PLAN_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOnePlan(id: number, scopeSpecialistId?: number) {
    const plan = await this.prisma.treatmentPlan.findUnique({
      where: { id },
      include: PLAN_INCLUDE,
    });

    if (!plan) {
      throw new NotFoundException('Plan de tratamiento no encontrado');
    }

    if (
      scopeSpecialistId !== undefined &&
      plan.specialistId !== scopeSpecialistId
    ) {
      throw new NotFoundException('Plan de tratamiento no encontrado');
    }

    return plan;
  }

  async createPlan(dto: CreateTreatmentPlanDto, scopeSpecialistId?: number) {
    const specialistId = await this.resolveSpecialistId(
      dto.specialistId,
      scopeSpecialistId,
    );

    if (scopeSpecialistId !== undefined) {
      await this.assertChildAssigned(dto.childId, specialistId);
    } else {
      const child = await this.prisma.child.findUnique({
        where: { id: dto.childId },
        select: { id: true },
      });
      if (!child) {
        throw new NotFoundException('Niño no encontrado');
      }
    }

    if (dto.areaId !== undefined) {
      const area = await this.prisma.area.findUnique({
        where: { id: dto.areaId },
        select: { id: true },
      });
      if (!area) {
        throw new BadRequestException('El área indicada no existe');
      }
    }

    const startDate = parseDateOnly(dto.startDate);
    const endDate = dto.endDate ? parseDateOnly(dto.endDate) : null;

    if (endDate && startDate > endDate) {
      throw new BadRequestException('El período del plan no es válido');
    }

    const created = await this.prisma.treatmentPlan.create({
      data: {
        childId: dto.childId,
        specialistId,
        areaId: dto.areaId ?? null,
        frequency: dto.frequency ?? PlanFrequency.WEEKLY,
        startDate,
        endDate,
        notes: dto.notes?.trim() ?? null,
      },
    });

    return this.findOnePlan(created.id, scopeSpecialistId);
  }

  async updatePlan(
    id: number,
    dto: UpdateTreatmentPlanDto,
    scopeSpecialistId?: number,
  ) {
    await this.findOnePlan(id, scopeSpecialistId);

    if (dto.areaId !== undefined) {
      const area = await this.prisma.area.findUnique({
        where: { id: dto.areaId },
        select: { id: true },
      });
      if (!area) {
        throw new BadRequestException('El área indicada no existe');
      }
    }

    await this.prisma.treatmentPlan.update({
      where: { id },
      data: {
        ...(dto.areaId !== undefined && { areaId: dto.areaId }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.startDate !== undefined && {
          startDate: parseDateOnly(dto.startDate),
        }),
        ...(dto.endDate !== undefined && {
          endDate: dto.endDate ? parseDateOnly(dto.endDate) : null,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes.trim() }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.findOnePlan(id, scopeSpecialistId);
  }

  async removePlan(id: number, scopeSpecialistId?: number) {
    await this.findOnePlan(id, scopeSpecialistId);
    await this.prisma.treatmentPlan.update({
      where: { id },
      data: { isActive: false },
    });
    return { id, isActive: false };
  }

  // ---------------------------------------------------------------- Ítems

  async listItems(planId: number, scopeSpecialistId?: number) {
    await this.findOnePlan(planId, scopeSpecialistId);
    return this.prisma.treatmentPlanItem.findMany({
      where: { planId },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });
  }

  async createItem(
    planId: number,
    dto: CreateTreatmentPlanItemDto,
    scopeSpecialistId?: number,
  ) {
    await this.findOnePlan(planId, scopeSpecialistId);

    return this.prisma.treatmentPlanItem.create({
      data: {
        planId,
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        dayOfWeek: dto.dayOfWeek ?? null,
        order: dto.order ?? 0,
      },
    });
  }

  async updateItem(
    planId: number,
    itemId: number,
    dto: UpdateTreatmentPlanItemDto,
    scopeSpecialistId?: number,
  ) {
    await this.findOnePlan(planId, scopeSpecialistId);
    await this.ensureItem(planId, itemId);

    return this.prisma.treatmentPlanItem.update({
      where: { id: itemId },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description.trim(),
        }),
        ...(dto.dayOfWeek !== undefined && { dayOfWeek: dto.dayOfWeek }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });
  }

  async deleteItem(planId: number, itemId: number, scopeSpecialistId?: number) {
    await this.findOnePlan(planId, scopeSpecialistId);
    await this.ensureItem(planId, itemId);
    await this.prisma.treatmentPlanItem.delete({ where: { id: itemId } });
    return { id: itemId, deleted: true };
  }

  private async ensureItem(planId: number, itemId: number) {
    const item = await this.prisma.treatmentPlanItem.findFirst({
      where: { id: itemId, planId },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException('Ítem del plan no encontrado');
    }
  }

  // --------------------------------------------------------------- Agenda

  /**
   * Planificación por día o rango. Devuelve una entrada por ítem aplicable a
   * cada fecha, marcando si ya existe una nota de evolución de ese ítem en esa
   * fecha.
   */
  async getAgenda(query: QueryAgendaDto, scopeSpecialistId?: number) {
    const { from, to } = this.resolveRange(query);

    const where = this.scopeFilter(scopeSpecialistId);
    if (query.specialistId !== undefined && scopeSpecialistId === undefined) {
      where.specialistId = query.specialistId;
    }
    where.isActive = true;

    const plans = await this.prisma.treatmentPlan.findMany({
      where,
      include: PLAN_INCLUDE,
    });

    const notes = await this.prisma.evolutionNote.findMany({
      where: {
        ...(scopeSpecialistId !== undefined && {
          specialistId: scopeSpecialistId,
        }),
        date: { gte: from, lte: to },
        planItemId: { not: null },
      },
      select: { planItemId: true, date: true },
    });

    const completed = new Set(
      notes.map((note) => `${note.planItemId}:${this.dateKey(note.date)}`),
    );

    const agenda: Array<{
      date: string;
      planId: number;
      childId: number;
      childName: string;
      areaId: number | null;
      areaName: string | null;
      itemId: number;
      title: string;
      description: string | null;
      completed: boolean;
    }> = [];

    for (const date of this.iterateDays(from, to)) {
      const dayOfWeek = date.getUTCDay();
      const key = this.dateKey(date);

      for (const plan of plans) {
        if (date < this.startOfDay(plan.startDate)) continue;
        if (plan.endDate && date > this.startOfDay(plan.endDate)) continue;

        for (const item of plan.items) {
          const applies =
            plan.frequency === PlanFrequency.DAILY ||
            item.dayOfWeek === null ||
            item.dayOfWeek === dayOfWeek;

          if (!applies) continue;

          agenda.push({
            date: key,
            planId: plan.id,
            childId: plan.childId,
            childName: `${plan.child.name} ${plan.child.lastName}`,
            areaId: plan.areaId,
            areaName: plan.area?.name ?? null,
            itemId: item.id,
            title: item.title,
            description: item.description,
            completed: completed.has(`${item.id}:${key}`),
          });
        }
      }
    }

    return agenda;
  }

  private resolveRange(query: QueryAgendaDto): { from: Date; to: Date } {
    if (query.from && query.to) {
      const from = this.startOfDay(parseDateOnly(query.from));
      const to = this.startOfDay(parseDateOnly(query.to));
      if (from > to) {
        throw new BadRequestException('El rango de fechas no es válido');
      }
      return { from, to };
    }

    if (query.date) {
      const day = this.startOfDay(parseDateOnly(query.date));
      return { from: day, to: day };
    }

    const today = this.startOfDay(new Date());
    return { from: today, to: today };
  }

  private iterateDays(from: Date, to: Date): Date[] {
    const days: Date[] = [];
    let cursor = from.getTime();
    // Guarda contra rangos absurdamente largos (por ejemplo, un año).
    let guard = 0;
    while (cursor <= to.getTime() && guard < 366) {
      days.push(new Date(cursor));
      cursor += DAY_MS;
      guard += 1;
    }
    return days;
  }

  private startOfDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private dateKey(date: Date): string {
    return this.startOfDay(date).toISOString().slice(0, 10);
  }

  // ---------------------------------------------------- Notas de evolución

  async listEvolution(query: QueryEvolutionDto, scopeSpecialistId?: number) {
    const where: Prisma.EvolutionNoteWhereInput =
      scopeSpecialistId === undefined
        ? {}
        : { specialistId: scopeSpecialistId };

    if (query.childId !== undefined) where.childId = query.childId;
    if (query.specialistId !== undefined && scopeSpecialistId === undefined) {
      where.specialistId = query.specialistId;
    }
    if (query.from || query.to) {
      where.date = {
        ...(query.from && { gte: parseDateOnly(query.from) }),
        ...(query.to && { lte: parseDateOnly(query.to) }),
      };
    }

    return this.prisma.evolutionNote.findMany({
      where,
      include: EVOLUTION_INCLUDE,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });
  }

  async createEvolution(
    dto: CreateEvolutionNoteDto,
    scopeSpecialistId?: number,
  ) {
    const specialistId = await this.resolveSpecialistId(
      dto.specialistId,
      scopeSpecialistId,
    );

    if (!dto.content || !dto.content.trim()) {
      throw new BadRequestException('El contenido de la nota es obligatorio');
    }

    if (scopeSpecialistId !== undefined) {
      await this.assertChildAssigned(dto.childId, specialistId);
    } else {
      const child = await this.prisma.child.findUnique({
        where: { id: dto.childId },
        select: { id: true },
      });
      if (!child) {
        throw new NotFoundException('Niño no encontrado');
      }
    }

    if (dto.planId !== undefined) {
      const plan = await this.prisma.treatmentPlan.findFirst({
        where: { id: dto.planId, childId: dto.childId },
        select: { id: true },
      });
      if (!plan) {
        throw new BadRequestException(
          'El plan indicado no pertenece a este niño',
        );
      }
    }

    if (dto.planItemId !== undefined) {
      const item = await this.prisma.treatmentPlanItem.findFirst({
        where: { id: dto.planItemId, plan: { childId: dto.childId } },
        select: { id: true },
      });
      if (!item) {
        throw new BadRequestException(
          'El ítem indicado no pertenece a un plan de este niño',
        );
      }
    }

    const created = await this.prisma.evolutionNote.create({
      data: {
        childId: dto.childId,
        specialistId,
        planId: dto.planId ?? null,
        planItemId: dto.planItemId ?? null,
        date: parseDateOnly(dto.date),
        content: dto.content.trim(),
        observation: dto.observation?.trim() ?? null,
      },
    });

    return this.findEvolution(created.id, scopeSpecialistId);
  }

  async findEvolution(id: number, scopeSpecialistId?: number) {
    const note = await this.prisma.evolutionNote.findUnique({
      where: { id },
      include: EVOLUTION_INCLUDE,
    });

    if (!note) {
      throw new NotFoundException('Nota de evolución no encontrada');
    }

    if (
      scopeSpecialistId !== undefined &&
      note.specialistId !== scopeSpecialistId
    ) {
      throw new NotFoundException('Nota de evolución no encontrada');
    }

    return note;
  }

  async updateEvolution(
    id: number,
    dto: UpdateEvolutionNoteDto,
    scopeSpecialistId?: number,
  ) {
    await this.findEvolution(id, scopeSpecialistId);

    return this.prisma.evolutionNote.update({
      where: { id },
      data: {
        ...(dto.date !== undefined && { date: parseDateOnly(dto.date) }),
        ...(dto.content !== undefined && { content: dto.content.trim() }),
        ...(dto.observation !== undefined && {
          observation: dto.observation.trim(),
        }),
        ...(dto.planItemId !== undefined && { planItemId: dto.planItemId }),
      },
    });
  }

  async deleteEvolution(id: number, scopeSpecialistId?: number) {
    await this.findEvolution(id, scopeSpecialistId);
    await this.prisma.evolutionNote.delete({ where: { id } });
    return { id, deleted: true };
  }
}
