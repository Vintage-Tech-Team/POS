import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Purchase, PurchaseStatus } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';
import { MovementType } from '../inventory/entities/inventory-movement.entity';
import { VoucherType } from '../accounting/entities/voucher.entity';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    private purchaseItemRepository: Repository<PurchaseItem>,
    private inventoryService: InventoryService,
    private accountingService: AccountingService,
    private dataSource: DataSource,
  ) {}

  async create(companyId: number, createPurchaseDto: CreatePurchaseDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if invoice number exists
      const existing = await this.purchaseRepository.findOne({
        where: {
          invoice_no: createPurchaseDto.invoice_no,
          company_id: companyId,
        },
      });

      if (existing) {
        throw new ConflictException('Invoice number already exists');
      }

      // Calculate totals
      let totalAmount = 0;
      let totalTax = 0;

      for (const item of createPurchaseDto.items) {
        const itemTotal =
          item.qty * item.unit_price + (item.tax || 0) - (item.discount || 0);
        totalAmount += itemTotal;
        totalTax += item.tax || 0;
      }

      // Create purchase
      const purchase = queryRunner.manager.create(Purchase, {
        company_id: companyId,
        supplier_id: createPurchaseDto.supplier_id,
        invoice_no: createPurchaseDto.invoice_no,
        date: createPurchaseDto.date,
        total_amount: totalAmount,
        tax_amount: totalTax,
        status: PurchaseStatus.CONFIRMED,
        notes: createPurchaseDto.notes,
      });
      await queryRunner.manager.save(purchase);

      // Create purchase items and update inventory
      for (const itemDto of createPurchaseDto.items) {
        const purchaseItem = queryRunner.manager.create(PurchaseItem, {
          purchase_id: purchase.id,
          product_id: itemDto.product_id,
          qty: itemDto.qty,
          unit_price: itemDto.unit_price,
          tax: itemDto.tax || 0,
          discount: itemDto.discount || 0,
        });
        await queryRunner.manager.save(purchaseItem);

        // Update inventory (increase stock)
        await this.inventoryService.recordMovement(
          companyId,
          itemDto.product_id,
          itemDto.qty, // Positive quantity to increase stock
          MovementType.PURCHASE,
          purchase.id,
        );
      }

      // Create accounting voucher
      // Debit: Purchase Account (or Inventory)
      // Credit: Accounts Payable (Supplier)
      await this.accountingService.createAutoVoucher(
        companyId,
        VoucherType.PURCHASE,
        createPurchaseDto.date,
        purchase.id,
        [
          {
            accountCode: '5000', // COGS or Purchase Account
            debit: totalAmount,
            credit: 0,
            description: `Purchase from Supplier - ${createPurchaseDto.invoice_no}`,
          },
          {
            accountCode: '2000', // Accounts Payable
            debit: 0,
            credit: totalAmount,
            description: `Purchase from Supplier - ${createPurchaseDto.invoice_no}`,
          },
        ],
      );

      await queryRunner.commitTransaction();

      return this.findOne(purchase.id, companyId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    companyId: number,
    status?: PurchaseStatus,
    startDate?: Date,
    endDate?: Date,
  ) {
    const query = this.purchaseRepository
      .createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.supplier', 'supplier')
      .leftJoinAndSelect('purchase.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('purchase.company_id = :companyId', { companyId });

    if (status) {
      query.andWhere('purchase.status = :status', { status });
    }

    if (startDate && endDate) {
      query.andWhere('purchase.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return query.orderBy('purchase.date', 'DESC').getMany();
  }

  async findOne(id: number, companyId: number) {
    const purchase = await this.purchaseRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['supplier', 'items', 'items.product'],
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    return purchase;
  }

  async recordPayment(
    id: number,
    companyId: number,
    amount: number,
    method: string,
    notes?: string,
  ) {
    const purchase = await this.findOne(id, companyId);

    // Create payment voucher
    // Debit: Accounts Payable
    // Credit: Cash/Bank
    await this.accountingService.createAutoVoucher(
      companyId,
      VoucherType.PAYMENT,
      new Date(),
      purchase.id,
      [
        {
          accountCode: '2000', // Accounts Payable
          debit: amount,
          credit: 0,
          description: `Payment to Supplier - ${purchase.invoice_no}`,
        },
        {
          accountCode: '1000', // Cash Account
          debit: 0,
          credit: amount,
          description: `Payment to Supplier - ${purchase.invoice_no}`,
        },
      ],
    );

    return {
      message: 'Payment recorded successfully',
      purchase_id: purchase.id,
      amount,
      method,
    };
  }
}


