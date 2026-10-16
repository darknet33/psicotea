import {
  Body,
  Controller,
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
import { ExpensesService } from './expenses.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DecimalToNumberInterceptor } from '../common/interceptors/decimal-to-number.interceptor';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

const READ_ROLES = [Role.ADMIN, Role.PERSONAL_ADMINISTRATIVO];
const WRITE_ROLES = [Role.ADMIN, Role.PERSONAL_ADMINISTRATIVO];
const CATEGORY_WRITE_ROLES = [Role.ADMIN];

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(DecimalToNumberInterceptor)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('categories')
  @Roles(...READ_ROLES)
  findAllCategories(@Query() query: QueryCategoriesDto) {
    return this.expensesService.findAllCategories(query);
  }

  @Post('categories')
  @Roles(...CATEGORY_WRITE_ROLES)
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.expensesService.createCategory(dto);
  }

  @Patch('categories/:id')
  @Roles(...CATEGORY_WRITE_ROLES)
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.expensesService.updateCategory(id, dto);
  }

  @Get('totals')
  @Roles(...READ_ROLES)
  totals(@Query() query: QueryExpensesDto) {
    return this.expensesService.totals(query);
  }

  @Get()
  @Roles(...READ_ROLES)
  findAll(@Query() query: QueryExpensesDto) {
    return this.expensesService.findAll(query);
  }

  @Get(':id')
  @Roles(...READ_ROLES)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.expensesService.findOne(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() dto: CreateExpenseDto, @Req() req: AuthenticatedRequest) {
    return this.expensesService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(id, dto);
  }
}
