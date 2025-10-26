import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { ChartOfAccount, AccountType } from './entities/chart-of-account.entity';
import { Voucher, VoucherType } from './entities/voucher.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateJournalVoucherDto } from './dto/create-journal-voucher.dto';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(ChartOfAccount)
    private accountRepository: Repository<ChartOfAccount>,
    @InjectRepository(Voucher)
    private voucherRepository: Repository<Voucher>,
    @InjectRepository(JournalEntry)
    private journalEntryRepository: Repository<JournalEntry>,
    private dataSource: DataSource,
  ) {}

  // Chart of Accounts
  async createAccount(companyId: number, createAccountDto: CreateAccountDto) {
    const existing = await this.accountRepository.findOne({
      where: { code: createAccountDto.code, company_id: companyId },
    });

    if (existing) {
      throw new ConflictException('Account code already exists');
    }

    const account = this.accountRepository.create({
      ...createAccountDto,
      company_id: companyId,
    });

    return this.accountRepository.save(account);
  }

  async getAllAccounts(companyId: number) {
    return this.accountRepository.find({
      where: { company_id: companyId },
      order: { code: 'ASC' },
    });
  }

  async getAccountsByType(companyId: number, type: AccountType) {
    return this.accountRepository.find({
      where: { company_id: companyId, type },
      order: { code: 'ASC' },
    });
  }

  async getAccountByCode(companyId: number, code: string) {
    const account = await this.accountRepository.findOne({
      where: { code, company_id: companyId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  // Vouchers
  async createJournalVoucher(
    companyId: number,
    createJournalVoucherDto: CreateJournalVoucherDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate entries balance
      const totalDebit = createJournalVoucherDto.entries.reduce(
        (sum, entry) => sum + Number(entry.debit),
        0,
      );
      const totalCredit = createJournalVoucherDto.entries.reduce(
        (sum, entry) => sum + Number(entry.credit),
        0,
      );

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new BadRequestException(
          'Debit and Credit must be equal. Difference: ' +
            Math.abs(totalDebit - totalCredit),
        );
      }

      // Create voucher
      const voucher = queryRunner.manager.create(Voucher, {
        company_id: companyId,
        type: VoucherType.JOURNAL,
        date: createJournalVoucherDto.date,
        notes: createJournalVoucherDto.notes,
        auto_generated: false,
      });
      await queryRunner.manager.save(voucher);

      // Create entries
      for (const entryDto of createJournalVoucherDto.entries) {
        const entry = queryRunner.manager.create(JournalEntry, {
          company_id: companyId,
          voucher_id: voucher.id,
          account_id: entryDto.account_id,
          debit: entryDto.debit,
          credit: entryDto.credit,
          date: createJournalVoucherDto.date,
          description: entryDto.description,
        });
        await queryRunner.manager.save(entry);
      }

      await queryRunner.commitTransaction();

      return this.voucherRepository.findOne({
        where: { id: voucher.id },
        relations: ['entries', 'entries.account'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createAutoVoucher(
    companyId: number,
    type: VoucherType,
    date: Date,
    referenceId: number,
    entries: Array<{
      accountCode: string;
      debit: number;
      credit: number;
      description?: string;
    }>,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create voucher
      const voucher = queryRunner.manager.create(Voucher, {
        company_id: companyId,
        type,
        date,
        reference_id: referenceId,
        auto_generated: true,
      });
      await queryRunner.manager.save(voucher);

      // Create entries
      for (const entryDto of entries) {
        const account = await this.accountRepository.findOne({
          where: { code: entryDto.accountCode, company_id: companyId },
        });

        if (!account) {
          throw new NotFoundException(
            `Account with code ${entryDto.accountCode} not found`,
          );
        }

        const entry = queryRunner.manager.create(JournalEntry, {
          company_id: companyId,
          voucher_id: voucher.id,
          account_id: account.id,
          debit: entryDto.debit,
          credit: entryDto.credit,
          date,
          description: entryDto.description,
        });
        await queryRunner.manager.save(entry);
      }

      await queryRunner.commitTransaction();
      return voucher;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getVouchers(companyId: number, startDate?: Date, endDate?: Date) {
    const where: any = { company_id: companyId };

    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }

    return this.voucherRepository.find({
      where,
      relations: ['entries', 'entries.account'],
      order: { date: 'DESC', id: 'DESC' },
    });
  }

  async getLedger(accountId: number, companyId: number, startDate?: Date, endDate?: Date) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, company_id: companyId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const query = this.journalEntryRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.voucher', 'voucher')
      .where('entry.company_id = :companyId', { companyId })
      .andWhere('entry.account_id = :accountId', { accountId });

    if (startDate && endDate) {
      query.andWhere('entry.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const entries = await query.orderBy('entry.date', 'ASC').getMany();

    let balance = 0;
    const ledgerEntries = entries.map((entry) => {
      balance += Number(entry.debit) - Number(entry.credit);
      return {
        ...entry,
        balance,
      };
    });

    return {
      account,
      entries: ledgerEntries,
      closingBalance: balance,
    };
  }

  async getProfitAndLoss(companyId: number, startDate: Date, endDate: Date) {
    const entries = await this.journalEntryRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.account', 'account')
      .where('entry.company_id = :companyId', { companyId })
      .andWhere('entry.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('account.type IN (:...types)', {
        types: [AccountType.INCOME, AccountType.EXPENSE],
      })
      .getMany();

    let totalIncome = 0;
    let totalExpense = 0;

    const incomeAccounts = new Map();
    const expenseAccounts = new Map();

    for (const entry of entries) {
      const amount = Number(entry.credit) - Number(entry.debit);
      const accountName = entry.account.name;

      if (entry.account.type === AccountType.INCOME) {
        totalIncome += amount;
        incomeAccounts.set(
          accountName,
          (incomeAccounts.get(accountName) || 0) + amount,
        );
      } else if (entry.account.type === AccountType.EXPENSE) {
        totalExpense += Math.abs(amount);
        expenseAccounts.set(
          accountName,
          (expenseAccounts.get(accountName) || 0) + Math.abs(amount),
        );
      }
    }

    const profit = totalIncome - totalExpense;

    return {
      period: { startDate, endDate },
      income: {
        total: totalIncome,
        accounts: Array.from(incomeAccounts.entries()).map(([name, amount]) => ({
          name,
          amount,
        })),
      },
      expense: {
        total: totalExpense,
        accounts: Array.from(expenseAccounts.entries()).map(([name, amount]) => ({
          name,
          amount,
        })),
      },
      profit,
    };
  }

  async getTrialBalance(companyId: number, date: Date) {
    const entries = await this.journalEntryRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.account', 'account')
      .where('entry.company_id = :companyId', { companyId })
      .andWhere('entry.date <= :date', { date })
      .getMany();

    const accountBalances = new Map();

    for (const entry of entries) {
      const accountId = entry.account_id;
      const accountName = entry.account.name;
      const accountType = entry.account.type;

      if (!accountBalances.has(accountId)) {
        accountBalances.set(accountId, {
          name: accountName,
          type: accountType,
          debit: 0,
          credit: 0,
        });
      }

      const account = accountBalances.get(accountId);
      account.debit += Number(entry.debit);
      account.credit += Number(entry.credit);
    }

    let totalDebit = 0;
    let totalCredit = 0;

    const balances = Array.from(accountBalances.values()).map((account) => {
      const balance = account.debit - account.credit;
      const debitBalance = balance > 0 ? balance : 0;
      const creditBalance = balance < 0 ? Math.abs(balance) : 0;

      totalDebit += debitBalance;
      totalCredit += creditBalance;

      return {
        ...account,
        balance: debitBalance || creditBalance,
        balanceType: balance >= 0 ? 'Debit' : 'Credit',
      };
    });

    return {
      date,
      accounts: balances,
      totalDebit,
      totalCredit,
      difference: Math.abs(totalDebit - totalCredit),
    };
  }
}


