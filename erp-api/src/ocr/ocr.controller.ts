import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  Body,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OCRService } from './ocr.service';
import { JwtAuthGuard } from '@/auth/strategies/jwt.guard';

@Controller('ocr')
@UseGuards(JwtAuthGuard)
export class OCRController {
  constructor(private ocrService: OCRService) {}

  // ==================== INVOICE OCR ====================
  @Post('invoice')
  @UseInterceptors(FileInterceptor('file'))
  async processInvoice(@Req() req: any, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return await this.ocrService.processInvoice(
      req.user.id,
      file.originalname,
      file.buffer,
    );
  }

  @Get('invoices')
  async getInvoices(
    @Req() req: any,
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0',
  ) {
    return await this.ocrService.getInvoiceOCRResults(
      req.user.id,
      parseInt(limit),
      parseInt(offset),
    );
  }

  // ==================== RECEIPT OCR ====================
  @Post('receipt')
  @UseInterceptors(FileInterceptor('file'))
  async processReceipt(
    @Req() req: any,
    @UploadedFile() file: any,
    @Body('orderId') orderId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return await this.ocrService.processReceipt(
      req.user.id,
      file.originalname,
      file.buffer,
      orderId,
    );
  }

  @Get('receipts')
  async getReceipts(
    @Req() req: any,
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0',
  ) {
    return await this.ocrService.getReceiptOCRResults(
      req.user.id,
      parseInt(limit),
      parseInt(offset),
    );
  }

  // ==================== BARCODE SCANNING ====================
  @Post('barcode/:productId')
  @UseInterceptors(FileInterceptor('file'))
  async scanBarcode(
    @Req() req: any,
    @Param('productId') productId: string,
    @UploadedFile() file: any,
    @Body('scanLocation') scanLocation?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return await this.ocrService.scanBarcode(
      productId,
      file.buffer,
      req.user.id,
      scanLocation,
    );
  }

  @Get('barcodes/:productId')
  async getBarcodes(
    @Param('productId') productId: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    return await this.ocrService.getBarcodeScans(
      productId,
      parseInt(limit),
      parseInt(offset),
    );
  }

  // ==================== PRODUCT IMAGE OCR ====================
  @Post('product')
  @UseInterceptors(FileInterceptor('file'))
  async processProductImage(
    @Req() req: any,
    @UploadedFile() file: any,
    @Body('productId') productId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return await this.ocrService.processProductImage(
      req.user.id,
      file.originalname,
      file.buffer,
      productId,
    );
  }

  @Get('products')
  async getProductImages(
    @Req() req: any,
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0',
  ) {
    return await this.ocrService.getProductImageOCRResults(
      req.user.id,
      parseInt(limit),
      parseInt(offset),
    );
  }

  // ==================== DOCUMENT OCR ====================
  @Post('document')
  @UseInterceptors(FileInterceptor('file'))
  async processDocument(
    @Req() req: any,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return await this.ocrService.processDocument(
      req.user.id,
      file.originalname,
      file.buffer,
    );
  }

  @Get('documents')
  async getDocuments(
    @Req() req: any,
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0',
  ) {
    return await this.ocrService.getDocumentOCRResults(
      req.user.id,
      parseInt(limit),
      parseInt(offset),
    );
  }

  // ==================== ACCOUNTING INTEGRATION ====================
  @Post('accounting')
  async createAccountingEntry(
    @Req() req: any,
    @Body()
    data: {
      entryType: string;
      vendorName: string;
      description: string;
      amount: number;
      date: string;
      category: string;
      invoiceOcrId?: string;
      receiptOcrId?: string;
    },
  ) {
    return await this.ocrService.createAccountingEntry(
      data.entryType,
      data.vendorName,
      data.description,
      data.amount,
      new Date(data.date),
      data.category,
      req.user.id,
      data.invoiceOcrId,
      data.receiptOcrId,
    );
  }

  @Get('accounting')
  async getAccountingEntries(
    @Query('status') status?: string,
    @Query('type') entryType?: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    return await this.ocrService.getAccountingEntries(
      status,
      entryType,
      parseInt(limit),
      parseInt(offset),
    );
  }

  @Post('accounting/:entryId/verify')
  async verifyEntry(@Param('entryId') entryId: string) {
    return await this.ocrService.verifyAccountingEntry(entryId);
  }
}
