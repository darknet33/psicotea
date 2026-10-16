import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, SpecialistShift } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpecialistDto } from './dto/create-specialist.dto';
import { UpdateSpecialistDto } from './dto/update-specialist.dto';
import { QuerySpecialistsDto } from './dto/query-specialists.dto';
import { SpecialistScheduleDayDto } from './dto/specialist-schedule-day.dto';
import { CreateSpecialistPaymentDto } from './dto/create-specialist-payment.dto';
import { parseDateOnly } from '../enrollments/enrollments.service';

const LIST_INCLUDE = {
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
  areas: { include: { area: true } },
  schedules: { orderBy: { dayOfWeek: 'asc' as const } },
} satisfies Prisma.SpecialistInclude;

const DETAIL_INCLUDE = {
  ...LIST_INCLUDE,
  children: {
    select: { id: true, name: true, lastName: true, isActive: true },
    orderBy: { name: 'asc' as const },
  },
  payments: { orderBy: { paymentDate: 'desc' as const } },
} satisfies Prisma.SpecialistInclude;

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const SHIFT_LABEL: Record<SpecialistShift, string> = {
  MANANA: 'Mañana (09:00–12:30)',
  TARDE: 'Tarde (14:00–17:30)',
  AMBOS: 'Mañana y tarde',
};

@Injectable()
export class SpecialistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuerySpecialistsDto = {}) {
    const where: Prisma.SpecialistWhereInput = {};

    if (!query.includeInactive) {
      where.isActive = true;
    }

    if (query.areaId !== undefined) {
      where.areas = { some: { areaId: query.areaId } };
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { professionalId: { contains: term } },
        { specialty: { contains: term } },
        { user: { is: { name: { contains: term } } } },
        { user: { is: { lastName: { contains: term } } } },
      ];
    }

    return this.prisma.specialist.findMany({
      where,
      include: LIST_INCLUDE,
      orderBy: { user: { name: 'asc' } },
    });
  }

  async findOne(id: number) {
    const specialist = await this.prisma.specialist.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });

    if (!specialist) {
      throw new NotFoundException('Especialista no encontrado');
    }

    return specialist;
  }

  private async ensureExists(id: number) {
    const specialist = await this.prisma.specialist.findUnique({
      where: { id },
      select: { id: true, entryDate: true, monthlySalary: true },
    });

    if (!specialist) {
      throw new NotFoundException('Especialista no encontrado');
    }

    return specialist;
  }

  async create(dto: CreateSpecialistDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new BadRequestException('El usuario indicado no existe');
    }

    if (user.role !== Role.ESPECIALISTA) {
      throw new BadRequestException(
        'El usuario debe tener el rol ESPECIALISTA para ser dado de alta como especialista',
      );
    }

    const existing = await this.prisma.specialist.findUnique({
      where: { userId: dto.userId },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        'Ese usuario ya tiene un perfil de especialista asociado',
      );
    }

    try {
      const created = await this.prisma.specialist.create({
        data: {
          userId: dto.userId,
          professionalId: dto.professionalId.trim(),
          specialty: dto.specialty.trim(),
          licenseNumber: dto.licenseNumber?.trim() ?? null,
          phone: dto.phone?.trim() ?? null,
          address: dto.address?.trim() ?? null,
          ...(dto.entryDate !== undefined && {
            entryDate: parseDateOnly(dto.entryDate),
          }),
          monthlySalary: dto.monthlySalary ?? null,
        },
      });

      return this.findOne(created.id);
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  async update(id: number, dto: UpdateSpecialistDto) {
    await this.ensureExists(id);

    try {
      await this.prisma.specialist.update({
        where: { id },
        data: {
          ...(dto.professionalId !== undefined && {
            professionalId: dto.professionalId.trim(),
          }),
          ...(dto.specialty !== undefined && {
            specialty: dto.specialty.trim(),
          }),
          ...(dto.licenseNumber !== undefined && {
            licenseNumber: dto.licenseNumber.trim(),
          }),
          ...(dto.phone !== undefined && { phone: dto.phone.trim() }),
          ...(dto.address !== undefined && { address: dto.address.trim() }),
          ...(dto.entryDate !== undefined && {
            entryDate: parseDateOnly(dto.entryDate),
          }),
          ...(dto.monthlySalary !== undefined && {
            monthlySalary: dto.monthlySalary,
          }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });

      return this.findOne(id);
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  async getSchedule(id: number) {
    await this.ensureExists(id);

    const schedule = await this.prisma.specialistSchedule.findMany({
      where: { specialistId: id },
      orderBy: { dayOfWeek: 'asc' },
    });

    return schedule.map((day) => ({
      ...day,
      label: day.shift ? SHIFT_LABEL[day.shift] : 'Horario personalizado',
    }));
  }

  async replaceSchedule(id: number, days: SpecialistScheduleDayDto[]) {
    await this.ensureExists(id);

    const seen = new Set<number>();
    for (const day of days) {
      if (seen.has(day.dayOfWeek)) {
        throw new BadRequestException(
          'No se puede repetir el mismo día en el horario',
        );
      }
      seen.add(day.dayOfWeek);

      const hasTimes = day.startTime !== undefined || day.endTime !== undefined;
      if (!day.shift && !(day.startTime && day.endTime)) {
        throw new BadRequestException(
          'Cada día debe tener un turno o una hora de inicio y fin',
        );
      }
      if (day.shift && hasTimes) {
        throw new BadRequestException(
          'Un día no puede tener turno y horas personalizadas a la vez',
        );
      }
      if (day.startTime && day.endTime && day.startTime >= day.endTime) {
        throw new BadRequestException(
          'La hora de inicio debe ser anterior a la de fin',
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.specialistSchedule.deleteMany({
        where: { specialistId: id },
      }),
      this.prisma.specialistSchedule.createMany({
        data: days.map((day) => ({
          specialistId: id,
          dayOfWeek: day.dayOfWeek,
          shift: day.shift ?? null,
          startTime: day.startTime ?? null,
          endTime: day.endTime ?? null,
        })),
      }),
    ]);

    return this.getSchedule(id);
  }

  async replaceAreas(id: number, areaIds: number[]) {
    await this.ensureExists(id);

    const unique = [...new Set(areaIds)];
    const found = await this.prisma.area.findMany({
      where: { id: { in: unique } },
      select: { id: true },
    });

    if (found.length !== unique.length) {
      throw new BadRequestException('Una de las áreas indicadas no existe');
    }

    await this.prisma.$transaction([
      this.prisma.specialistArea.deleteMany({ where: { specialistId: id } }),
      this.prisma.specialistArea.createMany({
        data: unique.map((areaId) => ({ specialistId: id, areaId })),
      }),
    ]);

    return this.findOne(id);
  }

  async replaceChildren(id: number, childIds: number[]) {
    await this.ensureExists(id);

    const unique = [...new Set(childIds)];
    const found = await this.prisma.child.findMany({
      where: { id: { in: unique } },
      select: { id: true },
    });

    if (found.length !== unique.length) {
      throw new BadRequestException('Uno de los niños indicados no existe');
    }

    await this.prisma.$transaction([
      // Los niños que ya no están en la lista quedan sin especialista.
      this.prisma.child.updateMany({
        where: { specialistId: id, id: { notIn: unique } },
        data: { specialistId: null },
      }),
      this.prisma.child.updateMany({
        where: { id: { in: unique } },
        data: { specialistId: id },
      }),
    ]);

    return this.findOne(id);
  }

  async listPayments(id: number) {
    await this.ensureExists(id);

    return this.prisma.specialistPayment.findMany({
      where: { specialistId: id },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async createPayment(
    id: number,
    dto: CreateSpecialistPaymentDto,
    createdById: number,
  ) {
    await this.ensureExists(id);

    const periodStart = parseDateOnly(dto.periodStart);
    const periodEnd = parseDateOnly(dto.periodEnd);

    if (periodStart > periodEnd) {
      throw new BadRequestException('El período del pago no es válido');
    }

    const created = await this.prisma.specialistPayment.create({
      data: {
        specialistId: id,
        amount: dto.amount,
        periodStart,
        periodEnd,
        paymentDate: parseDateOnly(dto.paymentDate),
        method: dto.method,
        notes: dto.notes?.trim() ?? null,
        createdById,
      },
    });

    return created;
  }

  async deletePayment(id: number, paymentId: number) {
    await this.ensureExists(id);

    const payment = await this.prisma.specialistPayment.findFirst({
      where: { id: paymentId, specialistId: id },
      select: { id: true },
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    await this.prisma.specialistPayment.delete({ where: { id: paymentId } });

    return { id: paymentId, deleted: true };
  }

  /**
   * Períodos mensuales desde la fecha de ingreso hasta el mes actual, indicando
   * si cada uno ya fue cubierto por algún pago (por solapamiento de fechas).
   */
  async getPaymentPeriods(id: number) {
    const specialist = await this.ensureExists(id);

    const payments = await this.prisma.specialistPayment.findMany({
      where: { specialistId: id },
      select: { periodStart: true, periodEnd: true, amount: true },
    });

    const entry = specialist.entryDate ?? new Date();
    const now = new Date();
    const cursor = new Date(
      Date.UTC(entry.getUTCFullYear(), entry.getUTCMonth(), 1),
    );
    const endMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );

    const periods: Array<{
      periodStart: Date;
      periodEnd: Date;
      label: string;
      isPaid: boolean;
      totalPaid: number;
    }> = [];

    while (cursor <= endMonth) {
      const year = cursor.getUTCFullYear();
      const month = cursor.getUTCMonth();
      const periodStart = new Date(Date.UTC(year, month, 1));
      const periodEnd = new Date(Date.UTC(year, month + 1, 0));

      const overlaps = payments.filter(
        (payment) =>
          payment.periodStart <= periodEnd && payment.periodEnd >= periodStart,
      );

      periods.push({
        periodStart,
        periodEnd,
        label: `${MONTH_NAMES[month]} ${year}`,
        isPaid: overlaps.length > 0,
        totalPaid: overlaps.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0,
        ),
      });

      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    return periods;
  }

  private rethrowDuplicate(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(
        'Ya existe un especialista con ese carnet profesional o ese usuario',
      );
    }

    throw error;
  }
}
