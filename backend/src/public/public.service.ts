import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CREDENTIAL_NOT_FOUND,
  CredentialResolverService,
} from '../common/credential/credential-resolver.service';
import { PrismaService } from '../prisma/prisma.service';
import { buildPdf, type PdfSection } from '../common/pdf/pdf.builder';
import { computeTotals } from '../enrollments/enrollments.service';
import {
  PublicActivityDto,
  PublicAttendanceDto,
  PublicChildProfileDto,
  PublicEnrollmentDto,
  PublicPrimaryTutorDto,
  PublicReportDto,
} from './dto/public-child-profile.dto';

/** Límites de historial para no devolver un payload desmedido. */
const MAX_ATTENDANCES = 500;
const MAX_ACTIVITIES = 200;

const TYPE_LABEL: Record<string, string> = {
  EVALUACION: 'Evaluación',
  EVOLUTIVO: 'Evolutivo',
  PERIODICO: 'Periódico',
};

const PERIOD_LABEL: Record<string, string> = {
  INICIO: 'Principios de año',
  MEDIADOS: 'Mediados de año',
  FIN: 'Finales de año',
  NINGUNO: '',
};

const ATTENDANCE_LABEL: Record<string, string> = {
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente',
  JUSTIFICADO: 'Justificado',
};

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
      // El dueño pidió exponer el diagnóstico y el contenido de los informes
      // mediante el QR (ver `public-child-portal-enhancement`).
      select: {
        name: true,
        lastName: true,
        carnet: true,
        dateOfBirth: true,
        photoUrl: true,
        diagnostico: true,
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
        enrollments: {
          orderBy: { startDate: 'desc' },
          select: {
            id: true,
            type: true,
            startDate: true,
            endDate: true,
            status: true,
            amount: true,
            allocations: { select: { amount: true } },
            areas: { select: { area: { select: { name: true } } } },
          },
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: MAX_ATTENDANCES,
          select: { date: true, status: true, notes: true },
        },
        activities: {
          orderBy: { date: 'desc' },
          take: MAX_ACTIVITIES,
          select: { date: true, title: true, description: true },
        },
        reports: {
          where: { isDraft: false, visibilityToParents: true },
          orderBy: { periodEnd: 'desc' },
          select: {
            id: true,
            title: true,
            content: true,
            summary: true,
            type: true,
            reportPeriod: true,
            periodStart: true,
            periodEnd: true,
            attachments: {
              select: { name: true, fileUrl: true, mimeType: true },
            },
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
      diagnostico: child.diagnostico,
      primaryTutor: link
        ? ({
            name: link.tutor.name,
            lastName: link.tutor.lastName,
            relationship: link.relationship,
            phone: link.tutor.phone,
            address: link.tutor.address,
          } satisfies PublicPrimaryTutorDto)
        : null,
      enrollments: child.enrollments.map((enrollment): PublicEnrollmentDto => {
        const totals = computeTotals(enrollment);
        return {
          id: enrollment.id,
          type: enrollment.type,
          startDate: toIsoDate(enrollment.startDate),
          endDate: enrollment.endDate ? toIsoDate(enrollment.endDate) : null,
          status: enrollment.status,
          amount: totals.total,
          totalPaid: totals.pagado,
          balance: totals.saldo,
          areas: enrollment.areas.map((item) => item.area.name),
        };
      }),
      attendances: child.attendances.map((attendance): PublicAttendanceDto => ({
        date: toIsoDate(attendance.date),
        status: attendance.status,
        notes: attendance.notes,
      })),
      activities: child.activities.map((activity): PublicActivityDto => ({
        date: toIsoDate(activity.date),
        title: activity.title,
        description: activity.description,
      })),
      reports: child.reports.map((report): PublicReportDto => ({
        id: report.id,
        title: report.title,
        type: report.type,
        reportPeriod: report.reportPeriod,
        periodStart: toIsoDate(report.periodStart),
        periodEnd: toIsoDate(report.periodEnd),
        content: report.content,
        summary: report.summary,
        attachments: report.attachments.map((attachment) => ({
          name: attachment.name,
          fileUrl: attachment.fileUrl,
          mimeType: attachment.mimeType,
        })),
      })),
    };
  }

  /** Genera el PDF resumido del historial público. */
  async buildSummaryPdf(credentialCode: string): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const profile = await this.getChildByCredential(credentialCode);

    const sections: PdfSection[] = [
      { heading: 'Diagnóstico', lines: [profile.diagnostico] },
    ];

    if (profile.enrollments.length) {
      sections.push({
        heading: 'Inscripciones',
        lines: profile.enrollments.map((enrollment) => {
          const period = `${enrollment.startDate} a ${
            enrollment.endDate ?? 'sin fin'
          }`;
          const areas = enrollment.areas.length
            ? ` · Áreas: ${enrollment.areas.join(', ')}`
            : '';
          return `• ${enrollment.type ?? '—'} (${period}) — Total: ${enrollment.amount} · Pagado: ${enrollment.totalPaid} · Saldo: ${enrollment.balance}${areas}`;
        }),
      });
    }

    if (profile.attendances.length) {
      const present = profile.attendances.filter(
        (attendance) => attendance.status === 'PRESENTE',
      ).length;
      sections.push({
        heading: 'Asistencias',
        lines: [
          `Total de registros: ${profile.attendances.length} · Presente: ${present}`,
          ...profile.attendances
            .slice(0, 40)
            .map(
              (attendance) =>
                `• ${attendance.date}: ${ATTENDANCE_LABEL[attendance.status] ?? attendance.status}`,
            ),
          ...(profile.attendances.length > 40
            ? ['(Se muestran los primeros 40 registros)']
            : []),
        ],
      });
    }

    if (profile.activities.length) {
      sections.push({
        heading: 'Actividades',
        lines: profile.activities
          .slice(0, 40)
          .map((activity) => `• ${activity.date}: ${activity.title}`),
      });
    }

    for (const report of profile.reports) {
      const period =
        report.reportPeriod !== 'NINGUNO'
          ? ` · ${PERIOD_LABEL[report.reportPeriod]}`
          : '';
      sections.push({
        heading: `${report.title} (${TYPE_LABEL[report.type] ?? report.type}${period})`,
        lines: [
          ...(report.summary ? [`Resumen: ${report.summary}`] : []),
          ...report.content.split(/\r?\n/),
        ],
      });
    }

    const buffer = await buildPdf({
      title: `${profile.name} ${profile.lastName}`,
      subtitle: 'Resumen de historial · Credencial QR',
      meta: [
        { label: 'Carnet', value: profile.carnet },
        { label: 'Edad', value: `${profile.age} años` },
        ...(profile.primaryTutor
          ? [
              {
                label: 'Tutor',
                value: `${profile.primaryTutor.name} ${profile.primaryTutor.lastName} (${profile.primaryTutor.relationship})`,
              },
            ]
          : []),
      ],
      sections,
    });

    const safeName = `${profile.name}-${profile.lastName}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    return { buffer, filename: `resumen-${safeName || 'nino'}.pdf` };
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
