import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new supplier (Admin/Manager only)' })
  create(@CurrentUser() user: any, @Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(user.companyId, createSupplierDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all suppliers' })
  findAll(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.suppliersService.findAll(user.companyId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findOne(id, user.companyId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a supplier (Admin/Manager only)' })
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: CreateSupplierDto,
  ) {
    return this.suppliersService.update(id, user.companyId, updateSupplierDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a supplier (Admin only)' })
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.remove(id, user.companyId);
  }
}


