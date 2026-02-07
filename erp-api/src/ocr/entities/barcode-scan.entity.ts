import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Product } from '@/products/product.entity';
import { User } from '@/auth/auth.entity';

@Entity('barcode_scans')
export class BarcodeScan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  productId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column()
  barcodeData!: string;

  @Column({ nullable: true })
  barcodeType!: string;

  @Column('uuid', { nullable: true })
  scannedBy!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'scannedBy' })
  user!: User;

  @Column({ nullable: true })
  scanLocation!: string;

  @Column({ default: 1 })
  quantityScanned!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  scanDate!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
