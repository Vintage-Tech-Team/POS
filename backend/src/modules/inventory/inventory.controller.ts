import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock')
  @ApiOperation({ summary: 'Get current stock levels' })
  @ApiQuery({ name: 'productId', required: false, type: Number })
  @ApiQuery({ name: 'warehouseId', required: false, type: Number })
  getStock(
    @CurrentUser() user: any,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.inventoryService.getStock(
      user.companyId,
      productId ? parseInt(productId, 10) : undefined,
      warehouseId ? parseInt(warehouseId, 10) : undefined,
    );
  }

  @Get('movements')
  @ApiOperation({ summary: 'Get inventory movements' })
  @ApiQuery({ name: 'productId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getMovements(
    @CurrentUser() user: any,
    @Query('productId') productId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.inventoryService.getStockMovements(
      user.companyId,
      productId ? parseInt(productId, 10) : undefined,
      start,
      end,
    );
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products with low stock' })
  getLowStockProducts(@CurrentUser() user: any) {
    return this.inventoryService.getLowStockProducts(user.companyId);
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Manual stock adjustment' })
  adjustStock(
    @CurrentUser() user: any,
    @Body() adjustmentDto: StockAdjustmentDto,
  ) {
    return this.inventoryService.adjustStock(user.companyId, adjustmentDto);
  }
}


