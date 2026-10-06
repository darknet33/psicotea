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
  UseInterceptors,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ChildrenService } from './children.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { QueryChildrenDto } from './dto/query-children.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DecimalToNumberInterceptor } from '../common/interceptors/decimal-to-number.interceptor';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

const READ_ROLES = [
  Role.ADMIN,
  Role.PERSONAL_ADMINISTRATIVO,
  Role.ESPECIALISTA,
];
const WRITE_ROLES = [Role.ADMIN, Role.PERSONAL_ADMINISTRATIVO];

@Controller('children')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(DecimalToNumberInterceptor)
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Get()
  @Roles(...READ_ROLES)
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryChildrenDto,
  ) {
    const specialistId = await this.resolveSpecialistScope(req);

    return this.childrenService.findAll(query, specialistId);
  }

  @Get(':id')
  @Roles(...READ_ROLES)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const specialistId = await this.resolveSpecialistScope(req);

    return this.childrenService.findOne(id, specialistId);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateChildDto) {
    return this.childrenService.create(dto);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateChildDto) {
    return this.childrenService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.childrenService.remove(id);
  }

  private async resolveSpecialistScope(
    req: AuthenticatedRequest,
  ): Promise<number | undefined> {
    if (req.user.role !== Role.ESPECIALISTA) {
      return undefined;
    }

    const specialistId = await this.childrenService.getSpecialistIdByUser(
      req.user.id,
    );

    return specialistId ?? -1;
  }
}
