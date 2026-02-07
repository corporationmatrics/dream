import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@/auth/auth.entity';
import { Order } from '@/orders/order.entity';

@Entity('receipt_ocr_results')
export class ReceiptOCRResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column('uuid', { nullable: true })
  orderId!: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @Column()
  fileName!: string;

  @Column({ nullable: true })
  filePath!: string;

  @Column('text')
  rawText!: string;

  @Column({ nullable: true })
  vendor!: string;

  @Column({ nullable: true })
  receiptNumber!: string;

  @Column({ nullable: true, type: 'timestamp' })
  transactionDate!: Date;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  amount!: number;

  @Column({ nullable: true })
  paymentMethod!: string;

  @Column('jsonb', { nullable: true })
  extractedData!: any;

  @Column({ default: false })
  verified!: boolean;

  @Column({ default: 'completed' })
  processingStatus!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
