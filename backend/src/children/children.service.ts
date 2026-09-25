import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { QueryChildrenDto } from './dto/query-children.dto';
import { ChildTutorDto } from './dto/child-tutor.dto';

@Injectable()
export class ChildrenService {
  constructor(private readonly prisma: PrismaService) {}

  private serializeTutors(
    child: {
      tutors?: Array<{
        tutor: {
          id: number;
          name: string;
          lastName: string;
          phone: string;
          email: string | null;
          carnet: string;
        };
        relationship: string;
        isPrimary: boolean;
      }>;
    },
  ) {
    return (child.tutors ?? []).map((ct) => ({
      id: ct.tutor.id,
      name: ct.tutor.name,
      lastName: ct.tutor.lastName,
      relationship: ct.relationship,
      phone: ct.tutor.phone,
      email: ct.tutor.email,
      carnet: ct.tutor.carnet,
      isPrimary: ct.isPrimary,
    }));
  }

  private validatePrimary(tutors: ChildTutorDto[]) {
    const primaryCount = tutors.filter((t) => t.isPrimary).length;
    if (primaryCount !== 1) {
      throw new BadRequestException(
        'Debe haber exactamente un tutor principal (isPrimary)',
      );
    }
  }

  private async upsertTutors(
    tx: Prisma.TransactionClient,
    childId: number,
    tutors: ChildTutorDto[],
  ) {
    await tx.childTutor.deleteMany({ where: { childId } });

    for (const t of tutors) {
      const tutor = await tx.tutor.upsert({
        where: { carnet: t.carnet },
        update: {
          name: t.name,
          lastName: t.lastName,
          phone: t.phone,
          email: t.email,
        },
        create: {
          name: t.name,
          lastName: t.lastName,
          phone: t.phone,
          email: t.email,
          carnet: t.carnet,
        },
      });

      await tx.childTutor.create({
        data: {
          childId,
          tutorId: tutor.id,
          relationship: t.relationship,
          isPrimary: t.isPrimary,
        },
      });
    }
  }

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

    const children = await this.prisma.child.findMany({
      where,
      include: {
        specialist: {
          include: {
            user: { select: { id: true, name: true, lastName: true } },
          },
        },
        tutors: {
          orderBy: [{ isPrimary: 'desc' }, { relationship: 'asc' }],
          include: {
            tutor: {
              select: {
                id: true,
                name: true,
                lastName: true,
                phone: true,
                email: true,
                carnet: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return children.map((child) => ({
      ...child,
      tutors: this.serializeTutors(child),
    }));
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
        tutors: {
          orderBy: [{ isPrimary: 'desc' }, { relationship: 'asc' }],
          include: {
            tutor: {
              select: {
                id: true,
                name: true,
                lastName: true,
                phone: true,
                email: true,
                carnet: true,
              },
            },
          },
        },
        enrollments: { orderBy: { startDate: 'desc' } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!child) {
      throw new NotFoundException('Niño no encontrado');
    }

    return {
      ...child,
      tutors: this.serializeTutors(child),
    };
  }

  async getSpecialistIdByUser(userId: number): Promise<number | null> {
    const specialist = await this.prisma.specialist.findUnique({
      where: { userId },
      select: { id: true },
    });

    return specialist?.id ?? null;
  }

  async create(dto: CreateChildDto) {
    this.validatePrimary(dto.tutors);

    const childId = await this.prisma.$transaction(async (tx) => {
      const child = await tx.child.create({
        data: {
          name: dto.name,
          lastName: dto.lastName,
          dateOfBirth: new Date(dto.dateOfBirth),
          sex: dto.sex,
          photo: dto.photo,
          enrollmentDate: new Date(dto.enrollmentDate),
          isActive: dto.isActive ?? true,
          specialistId: dto.specialistId,
        },
      });

      await this.upsertTutors(tx, child.id, dto.tutors);
      return child.id;
    });

    return this.findOne(childId);
  }

  async update(id: number, dto: UpdateChildDto) {
    await this.findOne(id);

    if (dto.tutors) {
      this.validatePrimary(dto.tutors);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.child.update({
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
          ...(dto.specialistId !== undefined && {
            specialistId: dto.specialistId,
          }),
        },
      });

      if (dto.tutors) {
        await this.upsertTutors(tx, id, dto.tutors);
      }
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.child.delete({ where: { id } });
  }
}