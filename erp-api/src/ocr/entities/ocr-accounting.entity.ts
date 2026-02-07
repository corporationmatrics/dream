import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InvoiceOCRResult } from './invoice-ocr.entity';
import { ReceiptOCRResult } from './receipt-ocr.entity';
import { User } from '@/auth/auth.entity';

@Entity('ocr_accounting_entries')
export class OCRAccountingEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true })
  invoiceOcrId!: string;

  @ManyToOne(() => InvoiceOCRResult, { nullable: true })
  @JoinColumn({ name: 'invoiceOcrId' })
  invoiceOcr!: InvoiceOCRResult;

  @Column('uuid', { nullable: true })
  receiptOcrId!: string;

  @ManyToOne(() => ReceiptOCRResult, { nullable: true })
  @JoinColumn({ name: 'receiptOcrId' })
  receiptOcr!: ReceiptOCRResult;

  @Column()
  entryType!: string; // 'invoice', 'receipt', 'expense'

  @Column({ nullable: true })
  vendorName!: string;

  @Column('text', { nullable: true })
  description!: string;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  amount!: number;

  @Column({ nullable: true, type: 'timestamp' })
  date!: Date;

  @Column({ nullable: true })
  category!: string;

  @Column({ default: 'pending' })
  status!: string; // 'pending', 'verified', 'booked'

  @Column('uuid', { nullable: true })
  createdBy!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
