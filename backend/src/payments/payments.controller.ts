import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

const PAYMENT_ROLES = [Role.ADMIN, Role.PERSONAL_ADMINISTRATIVO];

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYMENT_ROLES)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Query() query: QueryPaymentsDto) {
    return this.paymentsService.findAll(query);
  }

  @Get('pending')
  getPending(@Query('childId') childId?: string) {
    return this.paymentsService.getPendingPayments(
      childId ? Number(childId) : undefined,
    );
  }

  @Get('period')
  findByPeriod(@Query('start') start: string, @Query('end') end: string) {
    return this.paymentsService.findByPeriod(start, end);
  }

  @Get('child/:childId')
  findByChild(@Param('childId', ParseIntPipe) childId: number) {
    return this.paymentsService.findByChild(childId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePaymentDto) {
    return this.paymentsService.update(id, dto);
  }
}
