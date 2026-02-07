import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { OCRService } from './ocr.service';
import { OCRController } from './ocr.controller';
import { InvoiceOCRResult } from './entities/invoice-ocr.entity';
import { ReceiptOCRResult } from './entities/receipt-ocr.entity';
import { BarcodeScan } from './entities/barcode-scan.entity';
import { ProductImageOCRResult } from './entities/product-image-ocr.entity';
import { DocumentOCRResult } from './entities/document-ocr.entity';
import { OCRAccountingEntry } from './entities/ocr-accounting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvoiceOCRResult,
      ReceiptOCRResult,
      BarcodeScan,
      ProductImageOCRResult,
      DocumentOCRResult,
      OCRAccountingEntry,
    ]),
    HttpModule,
  ],
  controllers: [OCRController],
  providers: [OCRService],
  exports: [OCRService],
})
export class OCRModule {}
