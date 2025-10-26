import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, SaleStatus, PaymentStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';
import { MovementType } from '../inventory/entities/inventory-movement.entity';
import { VoucherType } from '../accounting/entities/voucher.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private inventoryService: InventoryService,
    private accountingService: AccountingService,
    private dataSource: DataSource,
  ) {}

  async createPOSSale(companyId: number, createSaleDto: CreateSaleDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check idempotency key
      if (createSaleDto.idempotency_key) {
        const existing = await this.saleRepository.findOne({
          where: { idempotency_key: createSaleDto.idempotency_key },
        });
        if (existing) {
          return this.findOne(existing.id, companyId);
        }
      }

      // Generate invoice number
      const invoiceNo = await this.generateInvoiceNumber(companyId);

      // Resolve products and calculate totals
      let totalAmount = 0;
      let totalTax = 0;
      const resolvedItems = [];

      for (const itemDto of createSaleDto.items) {
        let product: Product;

        if (itemDto.product_id) {
          product = await queryRunner.manager.findOne(Product, {
            where: { id: itemDto.product_id, company_id: companyId },
          });
        } else if (itemDto.barcode) {
          product = await queryRunner.manager.findOne(Product, {
            where: { barcode: itemDto.barcode, company_id: companyId },
          });
        } else {
          throw new BadRequestException(
            'Either product_id or barcode is required',
          );
        }

        if (!product) {
          throw new NotFoundException(
            `Product not found: ${itemDto.product_id || itemDto.barcode}`,
          );
        }

        if (product.stock_quantity < itemDto.qty) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}, Required: ${itemDto.qty}`,
          );
        }

        const unitPrice = itemDto.unit_price || product.sale_price;
        const tax = itemDto.tax || (unitPrice * itemDto.qty * product.tax_percent) / 100;
        const discount = itemDto.discount || 0;
        const itemTotal = unitPrice * itemDto.qty + tax - discount;

        totalAmount += itemTotal;
        totalTax += tax;

        resolvedItems.push({
          product,
          qty: itemDto.qty,
          unit_price: unitPrice,
          tax,
          discount,
        });
      }

      // Calculate payment status
      const totalPaid = createSaleDto.payments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );
      let paymentStatus: PaymentStatus;

      if (totalPaid >= totalAmount) {
        paymentStatus = PaymentStatus.PAID;
      } else if (totalPaid > 0) {
        paymentStatus = PaymentStatus.PARTIAL;
      } else {
        paymentStatus = PaymentStatus.UNPAID;
      }

      // Create sale
      const sale = queryRunner.manager.create(Sale, {
        company_id: companyId,
        customer_id: createSaleDto.customer_id,
        invoice_no: invoiceNo,
        date: new Date(),
        total_amount: totalAmount,
        tax_amount: totalTax,
        status: SaleStatus.COMPLETED,
        payment_status: paymentStatus,
        notes: createSaleDto.notes,
        idempotency_key: createSaleDto.idempotency_key,
      });
      await queryRunner.manager.save(sale);

      // Create sale items and update inventory
      for (const item of resolvedItems) {
        const saleItem = queryRunner.manager.create(SaleItem, {
          sale_id: sale.id,
          product_id: item.product.id,
          qty: item.qty,
          unit_price: item.unit_price,
          tax: item.tax,
          discount: item.discount,
        });
        await queryRunner.manager.save(saleItem);

        // Update inventory (decrease stock)
        await this.inventoryService.recordMovement(
          companyId,
          item.product.id,
          -item.qty, // Negative quantity to decrease stock
          MovementType.SALE,
          sale.id,
        );
      }

      // Create accounting voucher
      // Debit: Cash/Accounts Receivable
      // Credit: Sales, Tax Payable
      const salesAmount = totalAmount - totalTax;

      const voucherEntries = [
        {
          accountCode: '1000', // Cash Account
          debit: totalAmount,
          credit: 0,
          description: `Sale - ${invoiceNo}`,
        },
        {
          accountCode: '4000', // Sales Account
          debit: 0,
          credit: salesAmount,
          description: `Sale - ${invoiceNo}`,
        },
      ];

      if (totalTax > 0) {
        voucherEntries.push({
          accountCode: '2100', // Tax Payable (if exists)
          debit: 0,
          credit: totalTax,
          description: `Tax on Sale - ${invoiceNo}`,
        });
      }

      // Also record COGS
      let totalCOGS = 0;
      for (const item of resolvedItems) {
        totalCOGS += Number(item.product.purchase_price) * item.qty;
      }

      voucherEntries.push(
        {
          accountCode: '5000', // COGS
          debit: totalCOGS,
          credit: 0,
          description: `COGS for Sale - ${invoiceNo}`,
        },
        {
          accountCode: '1500', // Inventory (if tracked separately)
          debit: 0,
          credit: totalCOGS,
          description: `Inventory decrease for Sale - ${invoiceNo}`,
        },
      );

      await this.accountingService.createAutoVoucher(
        companyId,
        VoucherType.SALE,
        new Date(),
        sale.id,
        voucherEntries,
      );

      await queryRunner.commitTransaction();

      return this.findOne(sale.id, companyId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    companyId: number,
    status?: SaleStatus,
    startDate?: Date,
    endDate?: Date,
  ) {
    const query = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.customer', 'customer')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('sale.company_id = :companyId', { companyId });

    if (status) {
      query.andWhere('sale.status = :status', { status });
    }

    if (startDate && endDate) {
      query.andWhere('sale.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return query.orderBy('sale.date', 'DESC').getMany();
  }

  async findOne(id: number, companyId: number) {
    const sale = await this.saleRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['customer', 'items', 'items.product'],
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  async recordPayment(
    id: number,
    companyId: number,
    amount: number,
    method: string,
    notes?: string,
  ) {
    const sale = await this.findOne(id, companyId);

    // Create payment voucher
    // Debit: Cash/Bank
    // Credit: Accounts Receivable
    await this.accountingService.createAutoVoucher(
      companyId,
      VoucherType.RECEIPT,
      new Date(),
      sale.id,
      [
        {
          accountCode: '1000', // Cash Account
          debit: amount,
          credit: 0,
          description: `Payment received for Sale - ${sale.invoice_no}`,
        },
        {
          accountCode: '1200', // Accounts Receivable (if exists)
          debit: 0,
          credit: amount,
          description: `Payment received for Sale - ${sale.invoice_no}`,
        },
      ],
    );

    return {
      message: 'Payment recorded successfully',
      sale_id: sale.id,
      amount,
      method,
    };
  }

  private async generateInvoiceNumber(companyId: number): Promise<string> {
    const today = new Date();
    const prefix = `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

    const lastSale = await this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.company_id = :companyId', { companyId })
      .andWhere('sale.invoice_no LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('sale.id', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastSale) {
      const lastSequence = parseInt(lastSale.invoice_no.split('-').pop());
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }

  async getDailySalesReport(companyId: number, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .where('sale.company_id = :companyId', { companyId })
      .andWhere('sale.date BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      })
      .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
      .getMany();

    const totalSales = sales.reduce(
      (sum, sale) => sum + Number(sale.total_amount),
      0,
    );
    const totalTax = sales.reduce((sum, sale) => sum + Number(sale.tax_amount), 0);

    return {
      date,
      total_sales: totalSales,
      total_tax: totalTax,
      total_transactions: sales.length,
      sales,
    };
  }
}


