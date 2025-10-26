import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InventoryMovement, MovementType } from './entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryMovement)
    private inventoryMovementRepository: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  async getStock(companyId: number, productId?: number, warehouseId?: number) {
    const query = this.productRepository
      .createQueryBuilder('product')
      .where('product.company_id = :companyId', { companyId });

    if (productId) {
      query.andWhere('product.id = :productId', { productId });
    }

    const products = await query.getMany();

    return products.map((product) => ({
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      stock_quantity: product.stock_quantity,
      reorder_level: product.reorder_level,
      needs_reorder: product.stock_quantity <= product.reorder_level,
    }));
  }

  async getStockMovements(
    companyId: number,
    productId?: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    const query = this.inventoryMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('movement.warehouse', 'warehouse')
      .where('movement.company_id = :companyId', { companyId });

    if (productId) {
      query.andWhere('movement.product_id = :productId', { productId });
    }

    if (startDate && endDate) {
      query.andWhere('movement.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return query.orderBy('movement.date', 'DESC').getMany();
  }

  async adjustStock(companyId: number, adjustmentDto: StockAdjustmentDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: adjustmentDto.product_id, company_id: companyId },
      });

      if (!product) {
        throw new BadRequestException('Product not found');
      }

      const newStockQty = product.stock_quantity + adjustmentDto.qty_change;

      if (newStockQty < 0) {
        throw new BadRequestException('Insufficient stock');
      }

      // Update product stock
      product.stock_quantity = newStockQty;
      await queryRunner.manager.save(product);

      // Create inventory movement
      const movement = queryRunner.manager.create(InventoryMovement, {
        company_id: companyId,
        product_id: adjustmentDto.product_id,
        warehouse_id: adjustmentDto.warehouse_id,
        qty_change: adjustmentDto.qty_change,
        movement_type: MovementType.ADJUSTMENT,
        reason: adjustmentDto.reason,
        date: new Date(),
      });
      await queryRunner.manager.save(movement);

      await queryRunner.commitTransaction();

      return {
        product_id: product.id,
        product_name: product.name,
        previous_stock: product.stock_quantity - adjustmentDto.qty_change,
        new_stock: product.stock_quantity,
        adjustment: adjustmentDto.qty_change,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async recordMovement(
    companyId: number,
    productId: number,
    qtyChange: number,
    movementType: MovementType,
    referenceId?: number,
    warehouseId?: number,
    reason?: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: productId, company_id: companyId },
      });

      if (!product) {
        throw new BadRequestException('Product not found');
      }

      const newStockQty = product.stock_quantity + qtyChange;

      if (newStockQty < 0) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}, Required: ${Math.abs(qtyChange)}`,
        );
      }

      // Update product stock
      product.stock_quantity = newStockQty;
      await queryRunner.manager.save(product);

      // Create inventory movement
      const movement = queryRunner.manager.create(InventoryMovement, {
        company_id: companyId,
        product_id: productId,
        warehouse_id: warehouseId,
        qty_change: qtyChange,
        movement_type: movementType,
        reference_id: referenceId,
        reason: reason,
        date: new Date(),
      });
      await queryRunner.manager.save(movement);

      await queryRunner.commitTransaction();
      return movement;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getLowStockProducts(companyId: number) {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.company_id = :companyId', { companyId })
      .andWhere('product.stock_quantity <= product.reorder_level')
      .andWhere('product.reorder_level > 0')
      .andWhere('product.is_active = true')
      .getMany();
  }
}


