import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { JournalEntry } from './journal-entry.entity';

export enum VoucherType {
  JOURNAL = 'journal',
  PAYMENT = 'payment',
  RECEIPT = 'receipt',
  SALE = 'sale',
  PURCHASE = 'purchase',
}

@Entity('vouchers')
export class Voucher extends BaseEntity {
  @Column({ type: 'int' })
  company_id: number;

  @Column({
    type: 'enum',
    enum: VoucherType,
  })
  type: VoucherType;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'int', nullable: true })
  reference_id: number;

  @Column({ type: 'boolean', default: false })
  auto_generated: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => JournalEntry, (entry) => entry.voucher, { cascade: true })
  entries: JournalEntry[];
}


