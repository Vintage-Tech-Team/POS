import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
  MOBILE_MONEY = 'mobile_money',
}

export enum EntityType {
  CUSTOMER = 'customer',
  SUPPLIER = 'supplier',
}

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ type: 'int' })
  company_id: number;

  @Column({
    type: 'enum',
    enum: EntityType,
  })
  entity_type: EntityType;

  @Column({ type: 'int' })
  entity_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'int', nullable: true })
  reference_id: number;
}


