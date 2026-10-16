import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { SpecialistsService } from './specialists.service';
import { CreateSpecialistDto } from './dto/create-specialist.dto';
import { UpdateSpecialistDto } from './dto/update-specialist.dto';
import { QuerySpecialistsDto } from './dto/query-specialists.dto';
import {
  UpdateSpecialistAreasDto,
  UpdateSpecialistScheduleDto,
} from './dto/update-specialist-schedule.dto';
import { UpdateSpecialistChildrenDto } from './dto/update-specialist-children.dto';
import { CreateSpecialistPaymentDto } from './dto/create-specialist-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DecimalToNumberInterceptor } from '../common/interceptors/decimal-to-number.interceptor';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

const READ_ROLES = [Role.ADMIN, Role.PERSONAL_ADMINISTRATIVO];
const WRITE_ROLES = [Role.ADMIN];

@Controller('specialists')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(DecimalToNumberInterceptor)
export class SpecialistsController {
  constructor(private readonly specialistsService: SpecialistsService) {}

  @Get()
  @Roles(...READ_ROLES)
  findAll(@Query() query: QuerySpecialistsDto) {
    return this.specialistsService.findAll(query);
  }

  @Get(':id')
  @Roles(...READ_ROLES)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.specialistsService.findOne(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateSpecialistDto) {
    return this.specialistsService.create(dto);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpecialistDto,
  ) {
    return this.specialistsService.update(id, dto);
  }

  @Get(':id/schedule')
  @Roles(...READ_ROLES)
  getSchedule(@Param('id', ParseIntPipe) id: number) {
    return this.specialistsService.getSchedule(id);
  }

  @Put(':id/schedule')
  @Roles(...WRITE_ROLES)
  replaceSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpecialistScheduleDto,
  ) {
    return this.specialistsService.replaceSchedule(id, dto.days ?? []);
  }

  @Put(':id/areas')
  @Roles(...WRITE_ROLES)
  replaceAreas(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpecialistAreasDto,
  ) {
    return this.specialistsService.replaceAreas(id, dto.areaIds ?? []);
  }

  @Patch(':id/children')
  @Roles(...WRITE_ROLES)
  replaceChildren(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpecialistChildrenDto,
  ) {
    return this.specialistsService.replaceChildren(id, dto.childIds ?? []);
  }

  @Get(':id/payment-periods')
  @Roles(...READ_ROLES)
  getPaymentPeriods(@Param('id', ParseIntPipe) id: number) {
    return this.specialistsService.getPaymentPeriods(id);
  }

  @Get(':id/payments')
  @Roles(...READ_ROLES)
  listPayments(@Param('id', ParseIntPipe) id: number) {
    return this.specialistsService.listPayments(id);
  }

  @Post(':id/payments')
  @Roles(...WRITE_ROLES)
  createPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSpecialistPaymentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.specialistsService.createPayment(id, dto, req.user.id);
  }

  @Delete(':id/payments/:paymentId')
  @Roles(...WRITE_ROLES)
  deletePayment(
    @Param('id', ParseIntPipe) id: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ) {
    return this.specialistsService.deletePayment(id, paymentId);
  }
}
