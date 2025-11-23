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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PurchaseStatus } from './entities/purchase.entity';

@ApiTags('purchases')
@Controller('purchases')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new purchase (Admin/Manager only)' })
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
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Record payment to supplier (Admin/Manager/Accountant only)' })
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


