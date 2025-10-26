import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(InventoryMovement)
    private inventoryMovementRepository: Repository<InventoryMovement>,
  ) {}

  async getSalesSummary(companyId: number, startDate: Date, endDate: Date) {
    const sales = await this.saleRepository
      .createQueryBuilder('sale')
      .where('sale.company_id = :companyId', { companyId })
      .andWhere('sale.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
      .getMany();

    const totalSales = sales.reduce(
      (sum, sale) => sum + Number(sale.total_amount),
      0,
    );
    const totalTax = sales.reduce((sum, sale) => sum + Number(sale.tax_amount), 0);
    const avgSale = sales.length > 0 ? totalSales / sales.length : 0;

    return {
      period: { startDate, endDate },
      total_sales: totalSales,
      total_tax: totalTax,
      total_transactions: sales.length,
      average_sale: avgSale,
      net_sales: totalSales - totalTax,
    };
  }

  async getDailySales(companyId: number, startDate: Date, endDate: Date) {
    const sales = await this.saleRepository
      .createQueryBuilder('sale')
      .select('DATE(sale.date)', 'date')
      .addSelect('COUNT(sale.id)', 'count')
      .addSelect('SUM(sale.total_amount)', 'total')
      .where('sale.company_id = :companyId', { companyId })
      .andWhere('sale.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
      .groupBy('DATE(sale.date)')
      .orderBy('DATE(sale.date)', 'ASC')
      .getRawMany();

    return sales.map((s) => ({
      date: s.date,
      transactions: parseInt(s.count),
      total: parseFloat(s.total),
    }));
  }

  async getTopSellingProducts(
    companyId: number,
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ) {
    const topProducts = await this.saleRepository
      .createQueryBuilder('sale')
      .innerJoin('sale.items', 'items')
      .innerJoin('items.product', 'product')
      .select('product.id', 'product_id')
      .addSelect('product.name', 'product_name')
      .addSelect('product.sku', 'sku')
      .addSelect('SUM(items.qty)', 'total_qty')
      .addSelect('SUM(items.qty * items.unit_price)', 'total_revenue')
      .where('sale.company_id = :companyId', { companyId })
      .andWhere('sale.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('product.sku')
      .orderBy('SUM(items.qty)', 'DESC')
      .limit(limit)
      .getRawMany();

    return topProducts.map((p) => ({
      product_id: p.product_id,
      product_name: p.product_name,
      sku: p.sku,
      total_quantity_sold: parseInt(p.total_qty),
      total_revenue: parseFloat(p.total_revenue),
    }));
  }

  async getStockReorderReport(companyId: number) {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.company_id = :companyId', { companyId })
      .andWhere('product.stock_quantity <= product.reorder_level')
      .andWhere('product.reorder_level > 0')
      .andWhere('product.is_active = true')
      .orderBy('product.stock_quantity', 'ASC')
      .getMany();

    return products.map((p) => ({
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      current_stock: p.stock_quantity,
      reorder_level: p.reorder_level,
      shortage: p.reorder_level - p.stock_quantity,
      purchase_price: p.purchase_price,
      estimated_reorder_cost:
        (p.reorder_level - p.stock_quantity + 10) * Number(p.purchase_price),
    }));
  }

  async getInventoryValuation(companyId: number) {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.company_id = :companyId', { companyId })
      .andWhere('product.is_active = true')
      .getMany();

    let totalPurchaseValue = 0;
    let totalSaleValue = 0;

    const valuation = products.map((p) => {
      const purchaseValue = Number(p.purchase_price) * p.stock_quantity;
      const saleValue = Number(p.sale_price) * p.stock_quantity;

      totalPurchaseValue += purchaseValue;
      totalSaleValue += saleValue;

      return {
        product_id: p.id,
        product_name: p.name,
        sku: p.sku,
        stock_quantity: p.stock_quantity,
        purchase_price: p.purchase_price,
        sale_price: p.sale_price,
        purchase_value: purchaseValue,
        sale_value: saleValue,
        potential_profit: saleValue - purchaseValue,
      };
    });

    return {
      products: valuation,
      summary: {
        total_purchase_value: totalPurchaseValue,
        total_sale_value: totalSaleValue,
        potential_profit: totalSaleValue - totalPurchaseValue,
        profit_margin:
          totalPurchaseValue > 0
            ? ((totalSaleValue - totalPurchaseValue) / totalPurchaseValue) * 100
            : 0,
      },
    };
  }

  async getPurchasesSummary(companyId: number, startDate: Date, endDate: Date) {
    const purchases = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .where('purchase.company_id = :companyId', { companyId })
      .andWhere('purchase.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    const totalPurchases = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.total_amount),
      0,
    );

    return {
      period: { startDate, endDate },
      total_purchases: totalPurchases,
      total_transactions: purchases.length,
      average_purchase:
        purchases.length > 0 ? totalPurchases / purchases.length : 0,
    };
  }

  async getInventoryMovementReport(
    companyId: number,
    startDate: Date,
    endDate: Date,
  ) {
    const movements = await this.inventoryMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .where('movement.company_id = :companyId', { companyId })
      .andWhere('movement.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('movement.date', 'DESC')
      .getMany();

    const summary = {
      total_in: 0,
      total_out: 0,
      by_type: {},
    };

    for (const movement of movements) {
      if (movement.qty_change > 0) {
        summary.total_in += movement.qty_change;
      } else {
        summary.total_out += Math.abs(movement.qty_change);
      }

      if (!summary.by_type[movement.movement_type]) {
        summary.by_type[movement.movement_type] = 0;
      }
      summary.by_type[movement.movement_type] += Math.abs(movement.qty_change);
    }

    return {
      period: { startDate, endDate },
      summary,
      movements,
    };
  }
}


