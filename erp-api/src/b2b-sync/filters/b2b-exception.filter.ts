import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * B2B Exception Filter
 *
 * Standardized error handling for B2B endpoints:
 * - Converts business logic exceptions to HTTP responses
 * - Adds B2B-specific error codes
 * - Logs errors with context
 * - Returns consistent error schema
 *
 * Error Response Format:
 * {
 *   "error_code": "B2B_INVALID_PO",
 *   "message": "Purchase Order not found",
 *   "http_status": 400,
 *   "timestamp": "2025-02-07T12:34:56Z",
 *   "request_id": "req-uuid",
 *   "path": "/api/b2b/purchase-orders"
 * }
 */
@Catch()
export class B2BExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(B2BExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'B2B_INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: Record<string, any> = {};

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const body = exceptionResponse as any;
        message = body.message || exception.message;
        details = body;
      } else {
        message = exceptionResponse as string;
      }

      // Map HTTP status to B2B error codes
      errorCode = this.mapHttpStatusToErrorCode(status, message);
    } else if (exception instanceof Error) {
      // Handle generic JavaScript errors
      message = exception.message;
      this.logger.error(
        `[B2BExceptionFilter] Unhandled Error: ${exception.message}`,
        exception.stack,
      );
    } else {
      message = String(exception);
      this.logger.error(
        `[B2BExceptionFilter] Unknown exception type: ${typeof exception}`,
      );
    }

    // Extract context information
    const requestId = request.headers['x-request-id'] || `req-${Date.now()}`;
    const userId = request.user?.id || 'anonymous';
    const partnerId = request.query?.partner_id || 'unknown';

    // Log error with context
    this.logger.error(
      `[B2BExceptionFilter] ${errorCode} - ${message} | User: ${userId}, Partner: ${partnerId}, Path: ${request.path}`,
      details,
    );

    // Build error response
    const errorResponse = {
      error_code: errorCode,
      message,
      http_status: status,
      timestamp: new Date().toISOString(),
      request_id: requestId,
      path: request.path,
      ...(process.env.NODE_ENV === 'development' && {
        details,
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Map HTTP status codes to B2B-specific error codes
   */
  private mapHttpStatusToErrorCode(status: number, message: string): string {
    const messageUpper = message.toUpperCase();

    switch (status) {
      case HttpStatus.BAD_REQUEST:
        if (messageUpper.includes('DUPLICATE')) {
          return 'B2B_DUPLICATE_PO';
        }
        if (messageUpper.includes('VALIDATION')) {
          return 'B2B_INVALID_FORMAT';
        }
        if (messageUpper.includes('NOT FOUND')) {
          return 'B2B_NOT_FOUND';
        }
        return 'B2B_BAD_REQUEST';

      case HttpStatus.UNAUTHORIZED:
        return 'B2B_UNAUTHORIZED';

      case HttpStatus.FORBIDDEN:
        return 'B2B_FORBIDDEN';

      case HttpStatus.NOT_FOUND:
        if (messageUpper.includes('PO')) {
          return 'B2B_PO_NOT_FOUND';
        }
        if (messageUpper.includes('INVOICE')) {
          return 'B2B_INVOICE_NOT_FOUND';
        }
        return 'B2B_NOT_FOUND';

      case HttpStatus.CONFLICT:
        if (messageUpper.includes('ALREADY')) {
          return 'B2B_ALREADY_EXISTS';
        }
        if (messageUpper.includes('STATE')) {
          return 'B2B_INVALID_STATE';
        }
        return 'B2B_CONFLICT';

      case HttpStatus.UNPROCESSABLE_ENTITY:
        if (messageUpper.includes('INVENTORY')) {
          return 'B2B_INSUFFICIENT_INVENTORY';
        }
        if (messageUpper.includes('INVALID')) {
          return 'B2B_VALIDATION_ERROR';
        }
        return 'B2B_UNPROCESSABLE';

      case HttpStatus.TOO_MANY_REQUESTS:
        return 'B2B_RATE_LIMIT_EXCEEDED';

      case HttpStatus.INTERNAL_SERVER_ERROR:
        if (messageUpper.includes('DATABASE')) {
          return 'B2B_DATABASE_ERROR';
        }
        if (messageUpper.includes('LEDGER')) {
          return 'B2B_ACCOUNTING_ERROR';
        }
        return 'B2B_INTERNAL_ERROR';

      case HttpStatus.SERVICE_UNAVAILABLE:
        if (messageUpper.includes('ACCOUNTING')) {
          return 'B2B_ACCOUNTING_SERVICE_UNAVAILABLE';
        }
        return 'B2B_SERVICE_UNAVAILABLE';

      case HttpStatus.GATEWAY_TIMEOUT:
        return 'B2B_TIMEOUT';

      default:
        return 'B2B_ERROR';
    }
  }
}

/**
 * Custom B2B Business Logic Exceptions
 */

export class B2BException extends Error {
  constructor(
    public readonly errorCode: string,
    public readonly httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    message: string,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'B2BException';
  }
}

export class InvalidPOException extends B2BException {
  constructor(message: string, details?: Record<string, any>) {
    super('B2B_INVALID_PO', HttpStatus.BAD_REQUEST, message, details);
  }
}

export class DuplicatePOException extends B2BException {
  constructor(poNumber: string) {
    super(
      'B2B_DUPLICATE_PO',
      HttpStatus.CONFLICT,
      `PO ${poNumber} already exists`,
      { po_number: poNumber },
    );
  }
}

export class PONotFound Exception extends B2BException {
  constructor(poNumber: string) {
    super(
      'B2B_PO_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      `PO ${poNumber} not found`,
      { po_number: poNumber },
    );
  }
}

export class InvoiceNotFoundException extends B2BException {
  constructor(invoiceNumber: string) {
    super(
      'B2B_INVOICE_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      `Invoice ${invoiceNumber} not found`,
      { invoice_number: invoiceNumber },
    );
  }
}

export class InsufficientInventoryException extends B2BException {
  constructor(productId: string, required: number, available: number) {
    super(
      'B2B_INSUFFICIENT_INVENTORY',
      HttpStatus.UNPROCESSABLE_ENTITY,
      `Insufficient inventory for product ${productId}`,
      { product_id: productId, required, available },
    );
  }
}

export class PartnerNotActivatedException extends B2BException {
  constructor(partnerId: string) {
    super(
      'B2B_PARTNER_INACTIVE',
      HttpStatus.FORBIDDEN,
      `Partner ${partnerId} is not activated`,
      { partner_id: partnerId },
    );
  }
}

export class InvalidPOStateException extends B2BException {
  constructor(poNumber: string, currentState: string) {
    super(
      'B2B_INVALID_PO_STATE',
      HttpStatus.CONFLICT,
      `PO ${poNumber} cannot be processed from state ${currentState}`,
      { po_number: poNumber, current_state: currentState },
    );
  }
}

export class AccountingServiceException extends B2BException {
  constructor(message: string, details?: Record<string, any>) {
    super(
      'B2B_ACCOUNTING_ERROR',
      HttpStatus.BAD_GATEWAY,
      `Accounting service error: ${message}`,
      details,
    );
  }
}

export class WebhookDeliveryException extends B2BException {
  constructor(partnerId: string, message: string) {
    super(
      'B2B_WEBHOOK_DELIVERY_ERROR',
      HttpStatus.INTERNAL_SERVER_ERROR,
      `Failed to deliver webhook to partner ${partnerId}: ${message}`,
      { partner_id: partnerId },
    );
  }
}
