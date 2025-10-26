import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales/summary')
  @ApiOperation({ summary: 'Get sales summary report' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  getSalesSummary(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getSalesSummary(
      user.companyId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('sales/daily')
  @ApiOperation({ summary: 'Get daily sales report' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  getDailySales(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getDailySales(
      user.companyId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('sales/top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopSellingProducts(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getTopSellingProducts(
      user.companyId,
      new Date(startDate),
      new Date(endDate),
      limit || 10,
    );
  }

  @Get('stock/reorder')
  @ApiOperation({ summary: 'Get products needing reorder' })
  getStockReorderReport(@CurrentUser() user: any) {
    return this.reportsService.getStockReorderReport(user.companyId);
  }

  @Get('stock/valuation')
  @ApiOperation({ summary: 'Get inventory valuation report' })
  getInventoryValuation(@CurrentUser() user: any) {
    return this.reportsService.getInventoryValuation(user.companyId);
  }

  @Get('purchases/summary')
  @ApiOperation({ summary: 'Get purchases summary report' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  getPurchasesSummary(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getPurchasesSummary(
      user.companyId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('inventory/movements')
  @ApiOperation({ summary: 'Get inventory movement report' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  getInventoryMovementReport(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getInventoryMovementReport(
      user.companyId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}


