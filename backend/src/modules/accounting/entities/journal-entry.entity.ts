import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Voucher } from './voucher.entity';
import { ChartOfAccount } from './chart-of-account.entity';

@Entity('journal_entries')
export class JournalEntry extends BaseEntity {
  @Column({ type: 'int' })
  company_id: number;

  @Column({ type: 'int' })
  voucher_id: number;

  @Column({ type: 'int' })
  account_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  credit: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => Voucher, (voucher) => voucher.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voucher_id' })
  voucher: Voucher;

  @ManyToOne(() => ChartOfAccount)
  @JoinColumn({ name: 'account_id' })
  account: ChartOfAccount;
}


