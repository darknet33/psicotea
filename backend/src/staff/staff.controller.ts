import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DecimalToNumberInterceptor } from '../common/interceptors/decimal-to-number.interceptor';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@UseInterceptors(DecimalToNumberInterceptor)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  findAll(@Query() query: QueryStaffDto) {
    return this.staffService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateStaffDto) {
    return this.staffService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStaffDto) {
    return this.staffService.update(id, dto);
  }
}
