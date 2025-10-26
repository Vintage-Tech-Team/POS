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
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PurchaseStatus } from './entities/purchase.entity';

@ApiTags('purchases')
@Controller('purchases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new purchase' })
  create(
    @CurrentUser() user: any,
    @Body() createPurchaseDto: CreatePurchaseDto,
  ) {
    return this.purchasesService.create(user.companyId, createPurchaseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all purchases' })
  @ApiQuery({ name: 'status', enum: PurchaseStatus, required: false })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: PurchaseStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.purchasesService.findAll(user.companyId, status, start, end);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase by ID' })
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.purchasesService.findOne(id, user.companyId);
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Record payment to supplier' })
  recordPayment(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() paymentDto: { amount: number; method: string; notes?: string },
  ) {
    return this.purchasesService.recordPayment(
      id,
      user.companyId,
      paymentDto.amount,
      paymentDto.method,
      paymentDto.notes,
    );
  }
}


