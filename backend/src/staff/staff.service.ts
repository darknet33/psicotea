import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import { parseDateOnly } from '../enrollments/enrollments.service';

const STAFF_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
    },
  },
} satisfies Prisma.StaffInclude;

const ALLOWED_ROLES: Role[] = [Role.PERSONAL_ADMINISTRATIVO, Role.ADMIN];

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryStaffDto = {}) {
    const where: Prisma.StaffWhereInput = {};

    if (!query.includeInactive) {
      where.isActive = true;
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { employeeId: { contains: term } },
        { position: { contains: term } },
        { department: { contains: term } },
        { user: { is: { name: { contains: term } } } },
        { user: { is: { lastName: { contains: term } } } },
      ];
    }

    return this.prisma.staff.findMany({
      where,
      include: STAFF_INCLUDE,
      orderBy: { user: { name: 'asc' } },
    });
  }

  async findOne(id: number) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: STAFF_INCLUDE,
    });

    if (!staff) {
      throw new NotFoundException('Miembro del personal no encontrado');
    }

    return staff;
  }

  async create(dto: CreateStaffDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, role: true, specialist: { select: { id: true } } },
    });

    if (!user) {
      throw new BadRequestException('El usuario indicado no existe');
    }

    if (!ALLOWED_ROLES.includes(user.role)) {
      throw new BadRequestException(
        'El usuario debe tener rol ADMIN o PERSONAL_ADMINISTRATIVO para ser dado de alta como personal',
      );
    }

    if (user.specialist) {
      throw new BadRequestException(
        'Ese usuario ya tiene un perfil de especialista y no puede figurar como personal',
      );
    }

    const existing = await this.prisma.staff.findUnique({
      where: { userId: dto.userId },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        'Ese usuario ya tiene un registro de personal asociado',
      );
    }

    try {
      const created = await this.prisma.staff.create({
        data: {
          userId: dto.userId,
          employeeId: dto.employeeId.trim(),
          position: dto.position.trim(),
          department: dto.department?.trim() ?? null,
          hireDate: parseDateOnly(dto.hireDate),
          salary: dto.salary ?? null,
          phone: dto.phone?.trim() ?? null,
          address: dto.address?.trim() ?? null,
        },
      });

      return this.findOne(created.id);
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  async update(id: number, dto: UpdateStaffDto) {
    await this.findOne(id);

    try {
      await this.prisma.staff.update({
        where: { id },
        data: {
          ...(dto.employeeId !== undefined && {
            employeeId: dto.employeeId.trim(),
          }),
          ...(dto.position !== undefined && { position: dto.position.trim() }),
          ...(dto.department !== undefined && {
            department: dto.department.trim(),
          }),
          ...(dto.hireDate !== undefined && {
            hireDate: parseDateOnly(dto.hireDate),
          }),
          ...(dto.salary !== undefined && { salary: dto.salary }),
          ...(dto.phone !== undefined && { phone: dto.phone.trim() }),
          ...(dto.address !== undefined && { address: dto.address.trim() }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });

      return this.findOne(id);
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
        'Ya existe un miembro del personal con ese código o ese usuario',
      );
    }

    throw error;
  }
}
