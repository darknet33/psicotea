import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ReportsService, type ReportActor } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import {
  EvolutionDraftQueryDto,
  QueryReportsDto,
} from './dto/query-reports.dto';
import { CreateReportAttachmentDto } from './dto/create-report-attachment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DecimalToNumberInterceptor } from '../common/interceptors/decimal-to-number.interceptor';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

const ACCESS_ROLES = [Role.ADMIN, Role.ESPECIALISTA];

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(DecimalToNumberInterceptor)
@Roles(...ACCESS_ROLES)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async findAll(
    @Query() query: QueryReportsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reportsService.findAll(query, await this.actor(req));
  }

  @Get('evolution-draft')
  async evolutionDraft(
    @Query() query: EvolutionDraftQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reportsService.evolutionDraft(query, await this.actor(req));
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reportsService.findOne(id, await this.actor(req));
  }

  @Post()
  async create(@Body() dto: CreateReportDto, @Req() req: AuthenticatedRequest) {
    return this.reportsService.create(dto, await this.actor(req));
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReportDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reportsService.update(id, dto, await this.actor(req));
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reportsService.remove(id, await this.actor(req));
  }

  @Get(':id/attachments')
  async listAttachments(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reportsService.listAttachments(id, await this.actor(req));
  }

  @Post(':id/attachments')
  async addAttachment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReportAttachmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reportsService.addAttachment(id, dto, await this.actor(req));
  }

  @Delete(':id/attachments/:attachmentId')
  async deleteAttachment(
    @Param('id', ParseIntPipe) id: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reportsService.deleteAttachment(
      id,
      attachmentId,
      await this.actor(req),
    );
  }

  @Get(':id/pdf')
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<StreamableFile> {
    const { buffer, filename } = await this.reportsService.buildPdf(
      id,
      await this.actor(req),
    );

    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  private async actor(req: AuthenticatedRequest): Promise<ReportActor> {
    if (req.user.role !== Role.ESPECIALISTA) {
      return { userId: req.user.id, role: req.user.role };
    }

    const specialistProfileId =
      await this.reportsService.getSpecialistProfileId(req.user.id);

    return {
      userId: req.user.id,
      role: req.user.role,
      specialistProfileId,
    };
  }
}
