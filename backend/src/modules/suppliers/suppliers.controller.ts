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
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new supplier' })
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
  @ApiOperation({ summary: 'Update a supplier' })
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: CreateSupplierDto,
  ) {
    return this.suppliersService.update(id, user.companyId, updateSupplierDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a supplier' })
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.remove(id, user.companyId);
  }
}


