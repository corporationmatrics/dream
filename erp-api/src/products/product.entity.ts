import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('products')
@Index(['name'])
@Index(['sku'])
export class Product {
  @PrimaryColumn({ type: 'uuid', name: 'product_id' })
  id!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'product_name' })
  name!: string;

  @Column({ name: 'product_description', nullable: true })
  description?: string;

  @Column({ name: 'product_code', unique: true })
  sku!: string;

  @Column({ name: 'selling_price', type: 'decimal', precision: 12, scale: 2 })
  price!: number;

  @Column({ name: 'reorder_quantity', default: 0 })
  stock!: number;

  @Column({ name: 'category', nullable: true })
  category?: string;

  @Column({ name: 'is_active', default: true })
  status!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
