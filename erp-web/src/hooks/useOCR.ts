import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface OCRResult {
  id: string;
  fileName: string;
  rawText: string;
  extractedData: any;
  processingStatus: string;
  createdAt: string;
}

export interface BarcodeResult {
  found: boolean;
  barcodeData?: string;
  barcodeType?: string;
  message?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const useOCR = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('authToken');

  const uploadFile = useCallback(
    async (
      file: File,
      endpoint: string,
      additionalData?: Record<string, any>,
    ) => {
      try {
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        if (additionalData) {
          Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value as string);
          });
        }

        const token = getToken();
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch(`${API_URL}/ocr/${endpoint}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
            signal: controller.signal,
          });

          if (!response.ok) {
            if (response.status === 404) {
              const message = `OCR endpoint /${endpoint} not yet implemented. This feature is coming in Phase 2.`;
              setError(message);
              throw new Error(message);
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `OCR processing failed: ${response.status}`);
          }

          return await response.json();
        } finally {
          clearTimeout(timeout);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Invoice OCR
  const processInvoice = useCallback(
    async (file: File) => {
      return uploadFile(file, 'invoice');
    },
    [uploadFile],
  );

  // Receipt OCR
  const processReceipt = useCallback(
    async (file: File, orderId?: string) => {
      return uploadFile(file, 'receipt', orderId ? { orderId } : {});
    },
    [uploadFile],
  );

  // Barcode Scanning
  const scanBarcode = useCallback(
    async (file: File, productId: string, scanLocation?: string) => {
      return uploadFile(
        file,
        `barcode/${productId}`,
        scanLocation ? { scanLocation } : {},
      );
    },
    [uploadFile],
  );

  // Product Image OCR
  const processProductImage = useCallback(
    async (file: File, productId?: string) => {
      return uploadFile(file, 'product', productId ? { productId } : {});
    },
    [uploadFile],
  );

  // Document OCR
  const processDocument = useCallback(
    async (file: File) => {
      return uploadFile(file, 'document');
    },
    [uploadFile],
  );

  // Get results
  const getResults = useCallback(
    async (endpoint: string, limit = 10, offset = 0) => {
      try {
        setLoading(true);
        setError(null);

        const token = getToken();
        const response = await fetch(
          `${API_URL}/ocr/${endpoint}?limit=${limit}&offset=${offset}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getInvoices = useCallback(
    (limit = 10, offset = 0) => getResults('invoices', limit, offset),
    [getResults],
  );

  const getReceipts = useCallback(
    (limit = 10, offset = 0) => getResults('receipts', limit, offset),
    [getResults],
  );

  const getProductImages = useCallback(
    (limit = 10, offset = 0) => getResults('products', limit, offset),
    [getResults],
  );

  const getDocuments = useCallback(
    (limit = 10, offset = 0) => getResults('documents', limit, offset),
    [getResults],
  );

  const getBarcodes = useCallback(
    (productId: string, limit = 50, offset = 0) =>
      getResults(`barcodes/${productId}`, limit, offset),
    [getResults],
  );

  return {
    loading,
    error,
    processInvoice,
    processReceipt,
    scanBarcode,
    processProductImage,
    processDocument,
    getInvoices,
    getReceipts,
    getProductImages,
    getDocuments,
    getBarcodes,
  };
};