import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ReportPeriod, ReportType, Role, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ROOM_BY_ROLE } from '../realtime/realtime.constants';
import { parseDateOnly } from '../enrollments/enrollments.service';
import { buildPdf, type PdfSection } from '../common/pdf/pdf.builder';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import {
  EvolutionDraftQueryDto,
  QueryReportsDto,
} from './dto/query-reports.dto';
import { CreateReportAttachmentDto } from './dto/create-report-attachment.dto';

const REPORT_INCLUDE = {
  child: {
    select: {
      id: true,
      name: true,
      lastName: true,
      carnet: true,
      dateOfBirth: true,
    },
  },
  specialist: {
    select: { id: true, name: true, lastName: true, email: true },
  },
  attachments: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.ReportInclude;

const TYPE_LABEL: Record<ReportType, string> = {
  EVALUACION: 'Informe de evaluación',
  EVOLUTIVO: 'Informe evolutivo',
  PERIODICO: 'Informe periódico',
};

const PERIOD_LABEL: Record<ReportPeriod, string> = {
  INICIO: 'Principios de año',
  MEDIADOS: 'Mediados de año',
  FIN: 'Finales de año',
  NINGUNO: '',
};

export interface ReportActor {
  userId: number;
  role: Role;
  /** `Specialist.id` cuando el actor es ESPECIALISTA (para validar asignaciones). */
  specialistProfileId?: number;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly realtime?: RealtimeService,
  ) {}

  /** `Specialist.id` del usuario, para validar asignaciones de niños. */
  async getSpecialistProfileId(userId: number): Promise<number | undefined> {
    const specialist = await this.prisma.specialist.findUnique({
      where: { userId },
      select: { id: true },
    });
    return specialist?.id;
  }

  private scopeWhere(actor: ReportActor): Prisma.ReportWhereInput {
    return actor.role === Role.ESPECIALISTA
      ? { specialistId: actor.userId }
      : {};
  }

  private assertChildAccess(
    child: { specialistId: number | null } | null,
    actor: ReportActor,
  ) {
    if (!child) {
      throw new NotFoundException('Niño no encontrado');
    }

    if (actor.role === Role.ESPECIALISTA) {
      if (
        actor.specialistProfileId === undefined ||
        child.specialistId !== actor.specialistProfileId
      ) {
        throw new ForbiddenException(
          'El niño no está asignado a este especialista',
        );
      }
    }
  }

  private async getChildOrFail(childId: number) {
    return this.prisma.child.findUnique({
      where: { id: childId },
      select: { id: true, specialistId: true },
    });
  }

  async findAll(query: QueryReportsDto, actor: ReportActor) {
    const where = this.scopeWhere(actor);

    if (query.childId !== undefined) where.childId = query.childId;
    if (query.specialistId !== undefined && actor.role !== Role.ESPECIALISTA) {
      where.specialistId = query.specialistId;
    }
    if (query.type !== undefined) where.type = query.type;
    if (!query.includeDrafts) where.isDraft = false;
    if (query.from || query.to) {
      where.periodStart = {
        ...(query.to && { lte: parseDateOnly(query.to) }),
      };
      where.periodEnd = {
        ...(query.from && { gte: parseDateOnly(query.from) }),
      };
    }

    return this.prisma.report.findMany({
      where,
      include: REPORT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, actor: ReportActor) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: REPORT_INCLUDE,
    });

    if (!report) {
      throw new NotFoundException('Informe no encontrado');
    }

    if (
      actor.role === Role.ESPECIALISTA &&
      report.specialistId !== actor.userId
    ) {
      throw new NotFoundException('Informe no encontrado');
    }

    return report;
  }

  private async resolveSpecialistId(
    dtoSpecialistId: number | undefined,
    actor: ReportActor,
  ): Promise<number> {
    if (actor.role === Role.ESPECIALISTA) {
      return actor.userId;
    }

    if (dtoSpecialistId === undefined) {
      throw new BadRequestException('Debe indicar el especialista responsable');
    }

    const specialist = await this.prisma.user.findUnique({
      where: { id: dtoSpecialistId },
      select: { id: true, role: true },
    });

    if (!specialist || specialist.role !== Role.ESPECIALISTA) {
      throw new BadRequestException(
        'El especialista indicado no existe o no tiene ese rol',
      );
    }

    return specialist.id;
  }

  async create(dto: CreateReportDto, actor: ReportActor) {
    const child = await this.getChildOrFail(dto.childId);
    this.assertChildAccess(child, actor);

    const specialistId = await this.resolveSpecialistId(
      dto.specialistId,
      actor,
    );

    const periodStart = parseDateOnly(dto.periodStart);
    const periodEnd = parseDateOnly(dto.periodEnd);

    if (periodStart > periodEnd) {
      throw new BadRequestException('El período del informe no es válido');
    }

    const created = await this.prisma.report.create({
      data: {
        childId: dto.childId,
        specialistId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        type: dto.type ?? ReportType.EVOLUTIVO,
        reportPeriod: dto.reportPeriod ?? ReportPeriod.NINGUNO,
        summary: dto.summary?.trim() ?? null,
        periodStart,
        periodEnd,
        isDraft: dto.isDraft ?? true,
        visibilityToParents: dto.visibilityToParents ?? false,
      },
    });

    const report = await this.findOne(created.id, actor);

    this.realtime?.emitToRooms(
      [
        ROOM_BY_ROLE[Role.ADMIN],
        ROOM_BY_ROLE[Role.PERSONAL_ADMINISTRATIVO],
        `user:${specialistId}`,
      ],
      'report:new',
      { childId: dto.childId, report },
    );

    return report;
  }

  async update(id: number, dto: UpdateReportDto, actor: ReportActor) {
    await this.findOne(id, actor);

    await this.prisma.report.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.content !== undefined && { content: dto.content.trim() }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.reportPeriod !== undefined && {
          reportPeriod: dto.reportPeriod,
        }),
        ...(dto.summary !== undefined && { summary: dto.summary.trim() }),
        ...(dto.periodStart !== undefined && {
          periodStart: parseDateOnly(dto.periodStart),
        }),
        ...(dto.periodEnd !== undefined && {
          periodEnd: parseDateOnly(dto.periodEnd),
        }),
        ...(dto.isDraft !== undefined && { isDraft: dto.isDraft }),
        ...(dto.visibilityToParents !== undefined && {
          visibilityToParents: dto.visibilityToParents,
        }),
      },
    });

    return this.findOne(id, actor);
  }

  async remove(id: number, actor: ReportActor) {
    await this.findOne(id, actor);
    await this.prisma.report.delete({ where: { id } });
    return { id, deleted: true };
  }

  /**
   * Arma el borrador de un informe evolutivo consolidando las notas de
   * evolución del niño en el rango indicado.
   */
  async evolutionDraft(query: EvolutionDraftQueryDto, actor: ReportActor) {
    const child = await this.getChildOrFail(query.childId);
    this.assertChildAccess(child, actor);

    const from = query.from ? parseDateOnly(query.from) : undefined;
    const to = query.to ? parseDateOnly(query.to) : undefined;

    const notes = await this.prisma.evolutionNote.findMany({
      where: {
        childId: query.childId,
        ...(from || to
          ? { date: { ...(from && { gte: from }), ...(to && { lte: to }) } }
          : {}),
      },
      include: {
        planItem: { select: { title: true } },
        specialist: {
          select: { user: { select: { name: true, lastName: true } } },
        },
      },
      orderBy: [{ date: 'asc' }, { id: 'asc' }],
    });

    const content = notes
      .map((note) => {
        const date = note.date.toISOString().slice(0, 10);
        const author = `${note.specialist.user.name} ${note.specialist.user.lastName}`;
        const item = note.planItem ? ` · ${note.planItem.title}` : '';
        const observation = note.observation
          ? `\nObservación: ${note.observation}`
          : '';
        return `[${date}] ${author}${item}:\n${note.content}${observation}`;
      })
      .join('\n\n');

    return { content, count: notes.length };
  }

  async listAttachments(id: number, actor: ReportActor) {
    await this.findOne(id, actor);
    return this.prisma.reportAttachment.findMany({
      where: { reportId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addAttachment(
    id: number,
    dto: CreateReportAttachmentDto,
    actor: ReportActor,
  ) {
    await this.findOne(id, actor);

    return this.prisma.reportAttachment.create({
      data: {
        reportId: id,
        name: dto.name.trim(),
        fileUrl: dto.fileUrl.trim(),
        mimeType: dto.mimeType?.trim() ?? null,
      },
    });
  }

  async deleteAttachment(id: number, attachmentId: number, actor: ReportActor) {
    await this.findOne(id, actor);

    const attachment = await this.prisma.reportAttachment.findFirst({
      where: { id: attachmentId, reportId: id },
      select: { id: true },
    });

    if (!attachment) {
      throw new NotFoundException('Adjunto no encontrado');
    }

    await this.prisma.reportAttachment.delete({ where: { id: attachmentId } });
    return { id: attachmentId, deleted: true };
  }

  async buildPdf(
    id: number,
    actor: ReportActor,
  ): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const report = await this.findOne(id, actor);

    const sections: PdfSection[] = [];

    if (report.summary) {
      sections.push({ heading: 'Resumen', lines: [report.summary] });
    }

    sections.push({
      heading: 'Contenido',
      lines: report.content.split(/\r?\n/),
    });

    if (report.attachments.length) {
      sections.push({
        heading: 'Documentos adjuntos',
        lines: report.attachments.map((attachment) => `• ${attachment.name}`),
      });
    }

    const buffer = await buildPdf({
      title: report.title,
      subtitle: `${TYPE_LABEL[report.type]}${
        report.reportPeriod !== ReportPeriod.NINGUNO
          ? ` · ${PERIOD_LABEL[report.reportPeriod]}`
          : ''
      }`,
      meta: [
        {
          label: 'Niño',
          value: `${report.child.name} ${report.child.lastName}`,
        },
        {
          label: 'Especialista',
          value: `${report.specialist.name} ${report.specialist.lastName}`,
        },
        {
          label: 'Período',
          value: `${report.periodStart.toISOString().slice(0, 10)} a ${report.periodEnd
            .toISOString()
            .slice(0, 10)}`,
        },
      ],
      sections,
    });

    const safeName = report.title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    return { buffer, filename: `informe-${safeName || report.id}.pdf` };
  }
}
