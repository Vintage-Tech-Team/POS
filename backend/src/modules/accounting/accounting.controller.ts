import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateJournalVoucherDto } from './dto/create-journal-voucher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccountType } from './entities/chart-of-account.entity';

@ApiTags('accounting')
@Controller('accounting')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('coa')
  @ApiOperation({ summary: 'Create a new chart of account' })
  createAccount(
    @CurrentUser() user: any,
    @Body() createAccountDto: CreateAccountDto,
  ) {
    return this.accountingService.createAccount(user.companyId, createAccountDto);
  }

  @Get('coa')
  @ApiOperation({ summary: 'Get all chart of accounts' })
  @ApiQuery({ name: 'type', enum: AccountType, required: false })
  getAllAccounts(
    @CurrentUser() user: any,
    @Query('type') type?: AccountType,
  ) {
    if (type) {
      return this.accountingService.getAccountsByType(user.companyId, type);
    }
    return this.accountingService.getAllAccounts(user.companyId);
  }

  @Post('vouchers/journal')
  @ApiOperation({ summary: 'Create a manual journal voucher' })
  createJournalVoucher(
    @CurrentUser() user: any,
    @Body() createJournalVoucherDto: CreateJournalVoucherDto,
  ) {
    return this.accountingService.createJournalVoucher(
      user.companyId,
      createJournalVoucherDto,
    );
  }

  @Get('vouchers')
  @ApiOperation({ summary: 'Get all vouchers' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getVouchers(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.accountingService.getVouchers(user.companyId, start, end);
  }

  @Get('ledger/:accountId')
  @ApiOperation({ summary: 'Get ledger for an account' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getLedger(
    @CurrentUser() user: any,
    @Param('accountId', ParseIntPipe) accountId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.accountingService.getLedger(accountId, user.companyId, start, end);
  }

  @Get('pnl')
  @ApiOperation({ summary: 'Get Profit & Loss report' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  getProfitAndLoss(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.accountingService.getProfitAndLoss(
      user.companyId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Get Trial Balance' })
  @ApiQuery({ name: 'date', required: true, type: Date })
  getTrialBalance(
    @CurrentUser() user: any,
    @Query('date') date: string,
  ) {
    return this.accountingService.getTrialBalance(
      user.companyId,
      new Date(date),
    );
  }
}


