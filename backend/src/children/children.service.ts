import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { QueryChildrenDto } from './dto/query-children.dto';

@Injectable()
export class ChildrenService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryChildrenDto, specialistId?: number) {
    const where: Prisma.ChildWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { lastName: { contains: query.search } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (specialistId !== undefined) {
      where.specialistId = specialistId < 0 ? -1 : specialistId;
    }

    return this.prisma.child.findMany({
      where,
      include: {
        specialist: {
          include: {
            user: { select: { id: true, name: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, specialistId?: number) {
    const child = await this.prisma.child.findFirst({
      where: {
        id,
        ...(specialistId !== undefined ? { specialistId } : {}),
      },
      include: {
        specialist: {
          include: {
            user: { select: { id: true, name: true, lastName: true } },
          },
        },
        enrollments: { orderBy: { startDate: 'desc' } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!child) {
      throw new NotFoundException('Niño no encontrado');
    }

    return child;
  }

  async getSpecialistIdByUser(userId: number): Promise<number | null> {
    const specialist = await this.prisma.specialist.findUnique({
      where: { userId },
      select: { id: true },
    });

    return specialist?.id ?? null;
  }

  async create(dto: CreateChildDto) {
    return this.prisma.child.create({
      data: {
        name: dto.name,
        lastName: dto.lastName,
        dateOfBirth: new Date(dto.dateOfBirth),
        sex: dto.sex,
        photo: dto.photo,
        enrollmentDate: new Date(dto.enrollmentDate),
        isActive: dto.isActive ?? true,
        parentName: dto.parentName,
        parentLastName: dto.parentLastName,
        parentRelationship: dto.parentRelationship,
        parentPhone: dto.parentPhone,
        parentEmail: dto.parentEmail,
        parentCarnet: dto.parentCarnet,
        specialistId: dto.specialistId,
      },
      include: {
        specialist: {
          include: {
            user: { select: { id: true, name: true, lastName: true } },
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateChildDto) {
    await this.findOne(id);

    return this.prisma.child.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.dateOfBirth !== undefined && {
          dateOfBirth: new Date(dto.dateOfBirth),
        }),
        ...(dto.sex !== undefined && { sex: dto.sex }),
        ...(dto.photo !== undefined && { photo: dto.photo }),
        ...(dto.enrollmentDate !== undefined && {
          enrollmentDate: new Date(dto.enrollmentDate),
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.parentName !== undefined && { parentName: dto.parentName }),
        ...(dto.parentLastName !== undefined && {
          parentLastName: dto.parentLastName,
        }),
        ...(dto.parentRelationship !== undefined && {
          parentRelationship: dto.parentRelationship,
        }),
        ...(dto.parentPhone !== undefined && { parentPhone: dto.parentPhone }),
        ...(dto.parentEmail !== undefined && { parentEmail: dto.parentEmail }),
        ...(dto.parentCarnet !== undefined && {
          parentCarnet: dto.parentCarnet,
        }),
        ...(dto.specialistId !== undefined && {
          specialistId: dto.specialistId,
        }),
      },
      include: {
        specialist: {
          include: {
            user: { select: { id: true, name: true, lastName: true } },
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.child.delete({ where: { id } });
  }
}
