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
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

const ROLES = [Role.ADMIN, Role.ESPECIALISTA, Role.PERSONAL_ADMINISTRATIVO];

@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @Roles(...ROLES)
  findAll(
    @Query() query: QueryActivitiesDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.activitiesService.findAll(query, req.user);
  }

  @Get(':id')
  @Roles(...ROLES)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.activitiesService.findOne(id);
  }

  @Post()
  @Roles(...ROLES)
  create(@Body() dto: CreateActivityDto, @Req() req: AuthenticatedRequest) {
    return this.activitiesService.create(dto, req.user);
  }

  @Patch(':id')
  @Roles(...ROLES)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActivityDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.activitiesService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(...ROLES)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.activitiesService.remove(id, req.user);
  }
}
