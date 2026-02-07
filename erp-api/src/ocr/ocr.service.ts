import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceOCRResult } from './entities/invoice-ocr.entity';
import { ReceiptOCRResult } from './entities/receipt-ocr.entity';
import { BarcodeScan } from './entities/barcode-scan.entity';
import { ProductImageOCRResult } from './entities/product-image-ocr.entity';
import { DocumentOCRResult } from './entities/document-ocr.entity';
import { OCRAccountingEntry } from './entities/ocr-accounting.entity';
import { firstValueFrom } from 'rxjs';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

@Injectable()
export class OCRService {
  private readonly logger = new Logger(OCRService.name);

  constructor(
    private httpService: HttpService,
    @InjectRepository(InvoiceOCRResult)
    private invoiceOcrRepository: Repository<InvoiceOCRResult>,
    @InjectRepository(ReceiptOCRResult)
    private receiptOcrRepository: Repository<ReceiptOCRResult>,
    @InjectRepository(BarcodeScan)
    private barcodeScanRepository: Repository<BarcodeScan>,
    @InjectRepository(ProductImageOCRResult)
    private productImageOcrRepository: Repository<ProductImageOCRResult>,
    @InjectRepository(DocumentOCRResult)
    private documentOcrRepository: Repository<DocumentOCRResult>,
    @InjectRepository(OCRAccountingEntry)
    private accountingEntryRepository: Repository<OCRAccountingEntry>,
  ) {}

  // ==================== INVOICE OCR ====================
  async processInvoice(
    userId: string,
    fileName: string,
    fileData: Buffer,
  ): Promise<InvoiceOCRResult> {
    try {
      const formData = new FormData();
      const blob = new Blob([fileData], { type: 'image/jpeg' });
      formData.append('file', blob, fileName);

      const response = await firstValueFrom(
        this.httpService.post<{ data: any; success: boolean }>(
          `${ML_API_URL}/ocr/invoice`,
          formData,
        ),
      );

      const ocrData = response.data?.data;

      if (!ocrData || !response.data?.success) {
        throw new Error('OCR processing failed');
      }

      const invoiceOcr = this.invoiceOcrRepository.create({
        userId,
        fileName,
        rawText: ocrData.raw_text,
        vendorName: ocrData.vendor_name,
        invoiceNumber: ocrData.invoice_number,
        invoiceDate: ocrData.invoice_date ? new Date(ocrData.invoice_date) : new Date(),
        totalAmount: ocrData.total_amount,
        extractedData: ocrData,
        confidence: ocrData.confidence,
        processingStatus: 'completed',
      });

      return await this.invoiceOcrRepository.save(invoiceOcr);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Invoice OCR processing failed: ${errorMessage}`);
      throw new HttpException(
        `Invoice OCR processing failed: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getInvoiceOCRResults(userId: string, limit = 10, offset = 0) {
    return this.invoiceOcrRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  // ==================== RECEIPT OCR ====================
  async processReceipt(
    userId: string,
    fileName: string,
    fileData: Buffer,
    orderId?: string,
  ): Promise<ReceiptOCRResult> {
    try {
      const formData = new FormData();
      const blob = new Blob([fileData], { type: 'image/jpeg' });
      formData.append('file', blob, fileName);

      const response = await firstValueFrom(
        this.httpService.post<{ data: any; success: boolean }>
          (`${ML_API_URL}/ocr/receipt`, formData),
      );

      const ocrData = response.data?.data;

      if (!ocrData || !response.data?.success) {
        throw new Error('OCR processing failed');
      }

      const receiptOcr = this.receiptOcrRepository.create({
        userId,
        orderId,
        fileName,
        rawText: ocrData.raw_text,
        vendor: ocrData.vendor,
        receiptNumber: ocrData.receipt_number,
        transactionDate: ocrData.transaction_date ? new Date(ocrData.transaction_date) : new Date(),
        amount: ocrData.amount,
        paymentMethod: ocrData.payment_method,
        extractedData: ocrData,
        processingStatus: 'completed',
      });

      return await this.receiptOcrRepository.save(receiptOcr);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Receipt OCR processing failed: ${errorMessage}`);
      throw new HttpException(
        `Receipt OCR processing failed: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getReceiptOCRResults(userId: string, limit = 10, offset = 0) {
    return this.receiptOcrRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  // ==================== BARCODE SCANNING ====================
  async scanBarcode(
    productId: string,
    fileData: Buffer,
    scannedBy?: string,
    scanLocation?: string,
  ): Promise<BarcodeScan> {
    try {
      const formData = new FormData();
      const blob = new Blob([fileData], { type: 'image/jpeg' });
      formData.append('file', blob, 'barcode.jpg');

      const response = await firstValueFrom(
        this.httpService.post<{ data: any; success: boolean }>
          (`${ML_API_URL}/ocr/barcode`, formData),
      );

      const barcodeData = response.data?.data;

      if (!barcodeData || !response.data?.success) {
        throw new Error('Barcode reading failed');
      }

      if (!barcodeData.found) {
        throw new Error('No barcode found in image');
      }

      const barcodeScan = this.barcodeScanRepository.create({
        productId,
        barcodeData: barcodeData.barcode_data,
        barcodeType: barcodeData.barcode_type,
        scannedBy,
        scanLocation,
      });

      return await this.barcodeScanRepository.save(barcodeScan);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Barcode scanning failed: ${errorMessage}`);
      throw new HttpException(
        `Barcode scanning failed: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getBarcodeScans(productId: string, limit = 50, offset = 0) {
    return this.barcodeScanRepository.find({
      where: { productId },
      order: { scanDate: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  // ==================== PRODUCT IMAGE OCR ====================
  async processProductImage(
    userId: string,
    fileName: string,
    fileData: Buffer,
    productId?: string,
  ): Promise<ProductImageOCRResult> {
    try {
      const formData = new FormData();
      const blob = new Blob([fileData], { type: 'image/jpeg' });
      formData.append('file', blob, fileName);

      const response = await firstValueFrom(
        this.httpService.post<{ data: any; success: boolean }>
          (`${ML_API_URL}/ocr/product`, formData),
      );

      const ocrData = response.data?.data;

      if (!ocrData || !response.data?.success) {
        throw new Error('OCR processing failed');
      }

      const productImageOcr = this.productImageOcrRepository.create({
        userId,
        productId,
        fileName,
        rawText: ocrData.raw_text,
        extractedProductName: ocrData.product_name,
        extractedSku: ocrData.sku,
        extractedPrice: ocrData.price,
        extractedDescription: ocrData.description,
        extractedData: ocrData,
        processingStatus: 'completed',
      });

      return await this.productImageOcrRepository.save(productImageOcr);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Product image OCR processing failed: ${errorMessage}`);
      throw new HttpException(
        `Product image OCR processing failed: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getProductImageOCRResults(userId: string, limit = 10, offset = 0) {
    return this.productImageOcrRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  // ==================== DOCUMENT OCR ====================
  async processDocument(
    userId: string,
    fileName: string,
    fileData: Buffer,
  ): Promise<DocumentOCRResult> {
    try {
      const formData = new FormData();
      const fileType = fileName.split('.').pop()?.toLowerCase();
      const mimeType = fileType === 'pdf' ? 'application/pdf' : 'image/jpeg';
      const blob = new Blob([fileData], { type: mimeType });
      formData.append('file', blob, fileName);

      const endpoint = fileType === 'pdf' ? '/ocr/pdf' : '/ocr/text';
      const response = await firstValueFrom(
        this.httpService.post<{ data: any; success: boolean }>
          (`${ML_API_URL}${endpoint}`, formData),
      );

      const ocrData = response.data?.data;

      if (!ocrData || !response.data?.success) {
        throw new Error('OCR processing failed');
      }

      const documentOcr = this.documentOcrRepository.create({
        userId,
        fileName,
        fileType,
        rawText: ocrData.text || ocrData.total_text,
        pageCount: ocrData.page_count || 1,
        extractedData: ocrData,
        processingStatus: 'completed',
      });

      return await this.documentOcrRepository.save(documentOcr);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Document OCR processing failed: ${errorMessage}`);
      throw new HttpException(
        `Document OCR processing failed: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getDocumentOCRResults(userId: string, limit = 10, offset = 0) {
    return this.documentOcrRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  // ==================== ACCOUNTING INTEGRATION ====================
  async createAccountingEntry(
    entryType: string,
    vendorName: string,
    description: string,
    amount: number,
    date: Date,
    category: string,
    createdBy: string,
    invoiceOcrId?: string,
    receiptOcrId?: string,
  ): Promise<OCRAccountingEntry> {
    const entry = this.accountingEntryRepository.create({
      entryType,
      vendorName,
      description,
      amount,
      date,
      category,
      createdBy,
      invoiceOcrId,
      receiptOcrId,
      status: 'pending',
    });

    return await this.accountingEntryRepository.save(entry);
  }

  async getAccountingEntries(
    status?: string,
    entryType?: string,
    limit = 50,
    offset = 0,
  ) {
    const query = this.accountingEntryRepository.createQueryBuilder('entry');

    if (status) {
      query.where('entry.status = :status', { status });
    }

    if (entryType) {
      query.andWhere('entry.entryType = :entryType', { entryType });
    }

    return query
      .orderBy('entry.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();
  }

  async verifyAccountingEntry(entryId: string): Promise<OCRAccountingEntry> {
    const entry = await this.accountingEntryRepository.findOne({
      where: { id: entryId },
    });

    if (!entry) {
      throw new HttpException('Entry not found', HttpStatus.NOT_FOUND);
    }

    entry.status = 'verified';
    return await this.accountingEntryRepository.save(entry);
  }
}
