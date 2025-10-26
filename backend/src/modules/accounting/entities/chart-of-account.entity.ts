import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum AccountType {
  ASSET = 'Asset',
  LIABILITY = 'Liability',
  EQUITY = 'Equity',
  INCOME = 'Income',
  EXPENSE = 'Expense',
}

@Entity('chart_of_accounts')
export class ChartOfAccount extends BaseEntity {
  @Column({ type: 'int' })
  company_id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  type: AccountType;

  @Column({ type: 'int', nullable: true })
  parent_id: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => ChartOfAccount, (account) => account.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: ChartOfAccount;

  @OneToMany(() => ChartOfAccount, (account) => account.parent)
  children: ChartOfAccount[];
}


