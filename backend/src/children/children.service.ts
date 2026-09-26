import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CredentialTokenService } from '../common/credential/credential-token.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { QueryChildrenDto } from './dto/query-children.dto';
import { ChildTutorDto } from './dto/child-tutor.dto';

@Injectable()
export class ChildrenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credentialToken: CredentialTokenService,
  ) {}

  private serializeTutors(child: {
    tutors?: Array<{
      tutor: {
        id: number;
        name: string;
        lastName: string;
        phone: string;
        email: string | null;
        address: string | null;
        carnet: string;
      };
      relationship: string;
      isPrimary: boolean;
    }>;
  }) {
    return (child.tutors ?? []).map((ct) => ({
      id: ct.tutor.id,
      name: ct.tutor.name,
      lastName: ct.tutor.lastName,
      relationship: ct.relationship,
      phone: ct.tutor.phone,
      email: ct.tutor.email,
      address: ct.tutor.address,
      carnet: ct.tutor.carnet,
      isPrimary: ct.isPrimary,
    }));
  }

  /**
   * Normaliza el carnet del niño: recorta espacios y rechaza el valor vacío.
   * Un carnet solo con espacios pasa `@IsNotEmpty()`, así que se valida aquí.
   */
  private normalizeCarnet(carnet: string): string {
    const trimmed = carnet.trim();
    if (!trimmed) {
      throw new BadRequestException('El carnet del niño es obligatorio');
    }
    return trimmed;
  }

  /**
   * Traduce la violación del índice único de `Child.carnet` a un 400 con un
   * mensaje que el formulario puede mostrar junto al campo.
   */
  private assertCarnetAvailable(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      String(error.meta?.target ?? '').includes('carnet')
    ) {
      throw new BadRequestException(
        'Ese carnet ya pertenece a otro niño. Cada niño debe tener un carnet distinto.',
      );
    }
    throw error;
  }

  private validateTutors(tutors: ChildTutorDto[]) {
    const primaryCount = tutors.filter((t) => t.isPrimary).length;
    if (primaryCount !== 1) {
      throw new BadRequestException(
        'Debe haber exactamente un tutor principal (isPrimary)',
      );
    }

    const seen = new Set<string>();
    for (const tutor of tutors) {
      const carnet = tutor.carnet?.trim() ?? '';
      if (!carnet) {
        throw new BadRequestException('El carnet del tutor es obligatorio');
      }
      if (seen.has(carnet)) {
        throw new BadRequestException(
          `El carnet "${carnet}" está repetido: un niño no puede tener dos veces al mismo tutor`,
        );
      }
      seen.add(carnet);
    }
  }

  private async upsertTutors(
    tx: Prisma.TransactionClient,
    childId: number,
    tutors: ChildTutorDto[],
  ) {
    await tx.childTutor.deleteMany({ where: { childId } });

    for (const t of tutors) {
      const carnet = t.carnet.trim();
      const tutor = await tx.tutor.upsert({
        where: { carnet },
        update: {
          name: t.name,
          lastName: t.lastName,
          phone: t.phone,
          email: t.email,
          address: t.address,
        },
        create: {
          name: t.name,
          lastName: t.lastName,
          phone: t.phone,
          email: t.email,
          address: t.address,
          carnet,
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
                address: true,
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
                address: true,
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
    this.validateTutors(dto.tutors);

    const carnet = this.normalizeCarnet(dto.carnet);
    // El token lo genera siempre el backend: el cliente nunca lo controla.
    const credentialCode = this.credentialToken.generate();

    const childId = await this.prisma
      .$transaction(async (tx) => {
        const child = await tx.child.create({
          data: {
            name: dto.name,
            lastName: dto.lastName,
            dateOfBirth: new Date(dto.dateOfBirth),
            sex: dto.sex,
            photoUrl: dto.photoUrl,
            diagnostico: dto.diagnostico,
            carnet,
            credentialCode,
            isActive: dto.isActive ?? true,
            specialistId: dto.specialistId,
          },
        });

        await this.upsertTutors(tx, child.id, dto.tutors);
        return child.id;
      })
      .catch((error: unknown) => this.assertCarnetAvailable(error));

    return this.findOne(childId);
  }

  async update(id: number, dto: UpdateChildDto) {
    await this.findOne(id);

    if (dto.tutors) {
      this.validateTutors(dto.tutors);
    }

    const carnet =
      dto.carnet !== undefined ? this.normalizeCarnet(dto.carnet) : undefined;

    await this.prisma
      .$transaction(async (tx) => {
        await tx.child.update({
          where: { id },
          data: {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.lastName !== undefined && { lastName: dto.lastName }),
            ...(dto.dateOfBirth !== undefined && {
              dateOfBirth: new Date(dto.dateOfBirth),
            }),
            ...(dto.sex !== undefined && { sex: dto.sex }),
            ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl }),
            ...(dto.diagnostico !== undefined && {
              diagnostico: dto.diagnostico,
            }),
            ...(carnet !== undefined && { carnet }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            ...(dto.specialistId !== undefined && {
              specialistId: dto.specialistId,
            }),
          },
        });

        if (dto.tutors) {
          await this.upsertTutors(tx, id, dto.tutors);
        }
      })
      // Un PATCH que reenvía el carnet propio no choca con el índice: solo lo
      // dispara un carnet que pertenece a otro niño.
      .catch((error: unknown) => this.assertCarnetAvailable(error));

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.child.delete({ where: { id } });
  }
}
