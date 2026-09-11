import { Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { QueryEnrollmentsDto } from './dto/query-enrollments.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryEnrollmentsDto) {
    const where: Prisma.EnrollmentWhereInput = {};

    if (query.childId !== undefined) {
      where.childId = query.childId;
    }

    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.enrollment.findMany({
      where,
      include: {
        child: {
          select: {
            id: true,
            name: true,
            lastName: true,
            isActive: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            lastName: true,
            isActive: true,
          },
        },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    return enrollment;
  }

  async findByChild(childId: number) {
    return this.prisma.enrollment.findMany({
      where: { childId },
      orderBy: { startDate: 'desc' },
    });
  }

  async create(dto: CreateEnrollmentDto) {
    const child = await this.prisma.child.findUnique({
      where: { id: dto.childId },
    });

    if (!child) {
      throw new NotFoundException('Niño no encontrado');
    }

    return this.prisma.enrollment.create({
      data: {
        childId: dto.childId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status ?? EnrollmentStatus.ACTIVO,
        monthlyFee: dto.monthlyFee,
        notes: dto.notes,
      },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateEnrollmentDto) {
    await this.findOne(id);

    const leavesActive =
      dto.status !== undefined && dto.status !== EnrollmentStatus.ACTIVO;

    return this.prisma.enrollment.update({
      where: { id },
      data: {
        ...(dto.childId !== undefined && { childId: dto.childId }),
        ...(dto.startDate !== undefined && {
          startDate: new Date(dto.startDate),
        }),
        ...(dto.endDate !== undefined && {
          endDate: dto.endDate ? new Date(dto.endDate) : null,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(leavesActive &&
          dto.endDate === undefined && { endDate: new Date() }),
        ...(dto.monthlyFee !== undefined && { monthlyFee: dto.monthlyFee }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    });
  }
}
