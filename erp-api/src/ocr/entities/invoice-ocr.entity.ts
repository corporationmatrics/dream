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

@Entity('invoice_ocr_results')
export class InvoiceOCRResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  fileName!: string;

  @Column({ nullable: true })
  filePath!: string;

  @Column('text')
  rawText!: string;

  @Column({ nullable: true })
  vendorName!: string;

  @Column({ nullable: true })
  invoiceNumber!: string;

  @Column({ nullable: true, type: 'timestamp' })
  invoiceDate!: Date;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  totalAmount!: number;

  @Column('jsonb', { nullable: true })
  extractedData!: any;

  @Column({ nullable: true })
  confidence!: string;

  @Column({ default: 'completed' })
  processingStatus!: string;

  @Column({ default: 'easyocr' })
  ocrProvider!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
