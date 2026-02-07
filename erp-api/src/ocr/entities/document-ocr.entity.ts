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

@Entity('document_ocr_results')
export class DocumentOCRResult {
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

  @Column({ nullable: true })
  fileType!: string;

  @Column('text')
  rawText!: string;

  @Column({ nullable: true })
  pageCount!: number;

  @Column('jsonb', { nullable: true })
  extractedData!: any;

  @Column({ default: 'completed' })
  processingStatus!: string;

  @Column({ default: 'easyocr' })
  ocrProvider!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
