import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Company } from '../../companies/entities/company.entity';
import { Category } from './category.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ type: 'int' })
  company_id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  barcode: string;

  @Column({ type: 'int', nullable: true })
  category_id: number;

  @Column({ type: 'varchar', length: 50, default: 'pcs' })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  purchase_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  sale_price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tax_percent: number;

  @Column({ type: 'int', default: 0 })
  reorder_level: number;

  @Column({ type: 'int', default: 0 })
  stock_quantity: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => Company, (company) => company.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Category, (category) => category.products, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}


