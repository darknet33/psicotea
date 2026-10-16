import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ROOM_BY_ROLE } from '../realtime/realtime.constants';
import { RequestUser } from '../common/interfaces/authenticated-request.interface';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { parseDateOnly } from '../enrollments/enrollments.service';

const ACTIVITY_INCLUDE = {
  child: { select: { id: true, name: true, lastName: true } },
  specialist: { select: { id: true, name: true, lastName: true } },
} satisfies Prisma.ActivityInclude;

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  async findAll(query: QueryActivitiesDto = {}, actor?: RequestUser) {
    return this.prisma.activity.findMany({
      where: this.buildWhere(query, actor),
      include: ACTIVITY_INCLUDE,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });
  }

  async findOne(id: number) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: ACTIVITY_INCLUDE,
    });

    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }

    return activity;
  }

  async create(dto: CreateActivityDto, actor: RequestUser) {
    const child = await this.prisma.child.findUnique({
      where: { id: dto.childId },
      select: { id: true, specialist: { select: { userId: true } } },
    });

    if (!child) {
      throw new BadRequestException('El niño indicado no existe');
    }

    const specialistId = await this.resolveSpecialistId(
      dto.specialistId,
      actor,
    );

    const created = await this.prisma.activity.create({
      data: {
        childId: dto.childId,
        specialistId,
        date: parseDateOnly(dto.date),
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        duration: dto.duration ?? null,
      },
    });

    const activity = await this.findOne(created.id);

    const rooms = [
      ROOM_BY_ROLE[Role.ADMIN],
      ROOM_BY_ROLE[Role.PERSONAL_ADMINISTRATIVO],
    ];
    if (child.specialist) {
      rooms.push(`user:${child.specialist.userId}`);
    }
    this.realtime?.emitToRooms([...new Set(rooms)], 'activity:new', {
      childId: dto.childId,
      activity,
    });

    return activity;
  }

  async update(id: number, dto: UpdateActivityDto, actor: RequestUser) {
    const current = await this.prisma.activity.findUnique({
      where: { id },
      select: { id: true, specialistId: true },
    });

    if (!current) {
      throw new NotFoundException('Actividad no encontrada');
    }

    this.assertCanModify(current.specialistId, actor);

    if (dto.childId !== undefined) {
      const child = await this.prisma.child.findUnique({
        where: { id: dto.childId },
        select: { id: true },
      });
      if (!child) {
        throw new BadRequestException('El niño indicado no existe');
      }
    }

    const specialistId =
      dto.specialistId !== undefined
        ? await this.resolveSpecialistId(dto.specialistId, actor)
        : undefined;

    await this.prisma.activity.update({
      where: { id },
      data: {
        ...(dto.childId !== undefined && { childId: dto.childId }),
        ...(specialistId !== undefined && { specialistId }),
        ...(dto.date !== undefined && { date: parseDateOnly(dto.date) }),
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description.trim(),
        }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
      },
    });

    return this.findOne(id);
  }

  async remove(id: number, actor: RequestUser) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      select: { id: true, specialistId: true },
    });

    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }

    this.assertCanModify(activity.specialistId, actor);

    await this.prisma.activity.delete({ where: { id } });

    return { id, deleted: true };
  }

  private async resolveSpecialistId(
    requested: number | undefined,
    actor: RequestUser,
  ): Promise<number> {
    if (actor.role === Role.ESPECIALISTA) {
      return actor.id;
    }

    const specialistId = requested ?? actor.id;

    const user = await this.prisma.user.findUnique({
      where: { id: specialistId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== Role.ESPECIALISTA) {
      throw new BadRequestException(
        'El responsable debe ser un usuario con rol ESPECIALISTA',
      );
    }

    return specialistId;
  }

  private assertCanModify(ownerId: number, actor: RequestUser) {
    if (actor.role === Role.ESPECIALISTA && actor.id !== ownerId) {
      throw new ForbiddenException(
        'Solo puedes modificar las actividades que registraste',
      );
    }
  }

  private buildWhere(
    query: QueryActivitiesDto,
    actor?: RequestUser,
  ): Prisma.ActivityWhereInput {
    const where: Prisma.ActivityWhereInput = {};

    if (query.childId !== undefined) {
      where.childId = query.childId;
    }

    if (query.mine && actor) {
      where.specialistId = actor.id;
    } else if (query.specialistId !== undefined) {
      where.specialistId = query.specialistId;
    }

    if (query.from || query.to) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (query.from) dateFilter.gte = parseDateOnly(query.from);
      if (query.to) dateFilter.lte = parseDateOnly(query.to);
      where.date = dateFilter;
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term } },
        { description: { contains: term } },
      ];
    }

    return where;
  }
}
