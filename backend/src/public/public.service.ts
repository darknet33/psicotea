import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CREDENTIAL_NOT_FOUND,
  CredentialResolverService,
} from '../common/credential/credential-resolver.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  PublicChildProfileDto,
  PublicPrimaryTutorDto,
  PublicReportDto,
} from './dto/public-child-profile.dto';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: CredentialResolverService,
    private readonly config: ConfigService,
  ) {}

  async getChildByCredential(
    credentialCode: string,
  ): Promise<PublicChildProfileDto> {
    const childId = await this.resolver.resolveActiveChildId(credentialCode);

    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      // Lista blanca: estos son los únicos datos que salen del backend.
      // `diagnostico` y el `content` de los informes no se seleccionan, así que
      // no existen en memoria y no pueden filtrarse.
      select: {
        name: true,
        lastName: true,
        carnet: true,
        dateOfBirth: true,
        photoUrl: true,
        tutors: {
          where: { isPrimary: true },
          take: 1,
          select: {
            relationship: true,
            tutor: {
              select: {
                name: true,
                lastName: true,
                phone: true,
                address: true,
              },
            },
          },
        },
        reports: {
          where: { isDraft: false },
          orderBy: { periodEnd: 'desc' },
          select: {
            title: true,
            periodStart: true,
            periodEnd: true,
          },
        },
      },
    });

    if (!child) {
      // El resolver ya garantizó que existe y está activo; si desapareciera
      // entre ambas consultas, se responde igual que un token inválido.
      throw new NotFoundException(CREDENTIAL_NOT_FOUND);
    }

    const link = child.tutors[0];

    return {
      name: child.name,
      lastName: child.lastName,
      carnet: child.carnet,
      age: this.calculateAge(child.dateOfBirth),
      photoUrl: child.photoUrl,
      primaryTutor: link
        ? ({
            name: link.tutor.name,
            lastName: link.tutor.lastName,
            relationship: link.relationship,
            phone: link.tutor.phone,
            address: link.tutor.address,
          } satisfies PublicPrimaryTutorDto)
        : null,
      reports: child.reports.map(
        (report) =>
          ({
            title: report.title,
            periodStart: toIsoDate(report.periodStart),
            periodEnd: toIsoDate(report.periodEnd),
          }) satisfies PublicReportDto,
      ),
    };
  }

  /** URL pública que codifica el QR de la credencial. */
  buildPublicUrl(credentialCode: string): string {
    const base = (
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000'
    ).replace(/\/+$/, '');

    return `${base}/publico/nino/${credentialCode}`;
  }

  private calculateAge(dateOfBirth: Date): number {
    const now = new Date();
    let age = now.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = now.getMonth() - dateOfBirth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())
    ) {
      age -= 1;
    }
    return age;
  }
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
