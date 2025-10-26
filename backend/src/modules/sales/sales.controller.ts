import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SaleStatus } from './entities/sale.entity';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('pos')
  @ApiOperation({ summary: 'Create POS sale' })
  createPOSSale(@CurrentUser() user: any, @Body() createSaleDto: CreateSaleDto) {
    return this.salesService.createPOSSale(user.companyId, createSaleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales' })
  @ApiQuery({ name: 'status', enum: SaleStatus, required: false })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: SaleStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.salesService.findAll(user.companyId, status, start, end);
  }

  @Get('daily-report')
  @ApiOperation({ summary: 'Get daily sales report' })
  @ApiQuery({ name: 'date', required: true, type: Date })
  getDailySalesReport(
    @CurrentUser() user: any,
    @Query('date') date: string,
  ) {
    return this.salesService.getDailySalesReport(user.companyId, new Date(date));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale by ID' })
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id, user.companyId);
  }

  @Post(':id/receipt')
  @ApiOperation({ summary: 'Record customer payment' })
  recordPayment(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() paymentDto: { amount: number; method: string; notes?: string },
  ) {
    return this.salesService.recordPayment(
      id,
      user.companyId,
      paymentDto.amount,
      paymentDto.method,
      paymentDto.notes,
    );
  }
}


