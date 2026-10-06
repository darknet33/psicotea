import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { QueryAreasDto } from './dto/query-areas.dto';

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryAreasDto = {}) {
    return this.prisma.area.findMany({
      where: query.includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const area = await this.prisma.area.findUnique({ where: { id } });

    if (!area) {
      throw new NotFoundException('Área no encontrada');
    }

    return area;
  }

  async create(dto: CreateAreaDto) {
    try {
      return await this.prisma.area.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() ?? null,
        },
      });
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  async update(id: number, dto: UpdateAreaDto) {
    await this.findOne(id);

    try {
      return await this.prisma.area.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.description !== undefined && {
            description: dto.description.trim(),
          }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  private rethrowDuplicate(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(
        'Ya existe un área con ese nombre. Reactívala en lugar de duplicarla.',
      );
    }

    throw error;
  }
}
