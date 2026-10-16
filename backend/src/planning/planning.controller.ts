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
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PlanningService } from './planning.service';
import { CreateTreatmentPlanDto } from './dto/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dto/update-treatment-plan.dto';
import {
  CreateTreatmentPlanItemDto,
  QueryAgendaDto,
  QueryEvolutionDto,
  QueryPlansDto,
  UpdateTreatmentPlanItemDto,
} from './dto/treatment-plan-item.dto';
import {
  CreateEvolutionNoteDto,
  UpdateEvolutionNoteDto,
} from './dto/evolution-note.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

const ACCESS_ROLES = [Role.ADMIN, Role.ESPECIALISTA];

@Controller('planning')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ACCESS_ROLES)
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Get('plans')
  async listPlans(
    @Query() query: QueryPlansDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.planningService.findAllPlans(query, await this.scope(req));
  }

  @Get('plans/:id')
  async getPlan(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.planningService.findOnePlan(id, await this.scope(req));
  }

  @Post('plans')
  async createPlan(
    @Body() dto: CreateTreatmentPlanDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.planningService.createPlan(dto, await this.scope(req));
  }

  @Patch('plans/:id')
  async updatePlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTreatmentPlanDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.planningService.updatePlan(id, dto, await this.scope(req));
  }

  @Delete('plans/:id')
  async removePlan(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.planningService.removePlan(id, await this.scope(req));
  }

  @Get('plans/:id/items')
  async listItems(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.planningService.listItems(id, await this.scope(req));
  }

  @Post('plans/:id/items')
  async createItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTreatmentPlanItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.planningService.createItem(id, dto, await this.scope(req));
  }

  @Patch('plans/:id/items/:itemId')
  async updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateTreatmentPlanItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.planningService.updateItem(
      id,
      itemId,
      dto,
      await this.scope(req),
    );
  }

  @Delete('plans/:id/items/:itemId')
  async deleteItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.planningService.deleteItem(id, itemId, await this.scope(req));
  }

  @Get('agenda')
  async getAgenda(
    @Query() query: QueryAgendaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.planningService.getAgenda(query, await this.scope(req));
  }

  @Get('evolution')
  async listEvolution(
    @Query() query: QueryEvolutionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.planningService.listEvolution(query, await this.scope(req));
  }

  @Post('evolution')
  async createEvolution(
    @Body() dto: CreateEvolutionNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.planningService.createEvolution(dto, await this.scope(req));
  }

  @Patch('evolution/:id')
  async updateEvolution(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEvolutionNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.planningService.updateEvolution(id, dto, await this.scope(req));
  }

  @Delete('evolution/:id')
  async deleteEvolution(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.planningService.deleteEvolution(id, await this.scope(req));
  }

  private async scope(req: AuthenticatedRequest): Promise<number | undefined> {
    if (req.user.role !== Role.ESPECIALISTA) {
      return undefined;
    }

    const specialistId = await this.planningService.getSpecialistIdByUser(
      req.user.id,
    );

    return specialistId ?? -1;
  }
}
