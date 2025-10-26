import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('warehouses')
@Controller('warehouses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new warehouse' })
  create(@CurrentUser() user: any, @Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehousesService.create(user.companyId, createWarehouseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all warehouses' })
  findAll(@CurrentUser() user: any) {
    return this.warehousesService.findAll(user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.warehousesService.findOne(id, user.companyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a warehouse' })
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWarehouseDto: CreateWarehouseDto,
  ) {
    return this.warehousesService.update(id, user.companyId, updateWarehouseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a warehouse' })
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.warehousesService.remove(id, user.companyId);
  }
}


