import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RequestUser } from '../common/interfaces/authenticated-request.interface';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map((user) => this.serializeUser(user));
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.serializeUser(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        lastName: dto.lastName,
        role: dto.role,
      },
    });

    return this.serializeUser(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: Prisma.UserUpdateInput = { ...dto };

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    return this.serializeUser(user);
  }

  async updateRole(id: number, dto: UpdateRoleDto) {
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
    });

    return this.serializeUser(user);
  }

  async remove(id: number) {
    await this.findOne(id);

    const user = await this.prisma.user.delete({ where: { id } });

    return this.serializeUser(user);
  }

  private serializeUser(user: User): RequestUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
