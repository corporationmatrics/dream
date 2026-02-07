import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '@/products/product.entity';
import { User } from '@/auth/auth.entity';

@Entity('product_image_ocr_results')
export class ProductImageOCRResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true })
  productId!: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  fileName!: string;

  @Column({ nullable: true })
  filePath!: string;

  @Column('text', { nullable: true })
  rawText!: string;

  @Column({ nullable: true })
  extractedProductName!: string;

  @Column({ nullable: true })
  extractedSku!: string;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  extractedPrice!: number;

  @Column('text', { nullable: true })
  extractedDescription!: string;

  @Column('jsonb', { nullable: true })
  extractedData!: any;

  @Column({ default: 'completed' })
  processingStatus!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
