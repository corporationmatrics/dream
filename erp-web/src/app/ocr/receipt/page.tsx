'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOCR } from '@/hooks/useOCR';
import FileUploadComponent from '@/components/FileUploadComponent';

interface ReceiptData {
  id: string;
  fileName: string;
  vendor?: string;
  receiptNumber?: string;
  transactionDate?: string;
  amount?: number;
  paymentMethod?: string;
  verified: boolean;
  extractedData?: any;
  createdAt: string;
}

export default function ReceiptOCRPage() {
  const { user } = useAuth();
  const { processReceipt, getReceipts, loading, error: ocrError } = useOCR();
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadReceipts();
    }
  }, [user, pagination.page]);

  const loadReceipts = async () => {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await getReceipts(pagination.limit, offset);
      setReceipts(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load receipts');
    }
  };

  const handleUpload = async (file: File) => {
    try {
      setError(null);
      await processReceipt(file, orderId || undefined);
      setPagination({ ...pagination, page: 1 });
      await loadReceipts();
      setOrderId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  if (!user) {
    return <div className="p-8 text-center">Please log in to use OCR features</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <h1 className="text-4xl font-bold mb-2">Receipt OCR</h1>
        <p className="text-gray-600 mb-8">Process receipts for order verification</p>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Receipt</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order ID (Optional)
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Link to order (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <FileUploadComponent
            onUpload={handleUpload}
            acceptedTypes={['image/jpeg', 'image/png', 'application/pdf']}
            disabled={loading}
          />
          {ocrError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {ocrError}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Receipts</h2>
          </div>

          {receipts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No receipts uploaded yet
            </div>
          ) : (
            <div className="divide-y">
              {receipts.map((receipt) => (
                <div key={receipt.id} className="p-6 hover:bg-gray-50 transition">
                  <button
                    onClick={() =>
                      setExpandedId(
                        expandedId === receipt.id ? null : receipt.id,
                      )
                    }
                    className="w-full text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{receipt.fileName}</p>
                          {receipt.verified && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Vendor:</span>
                            <p>{receipt.vendor || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Receipt #:</span>
                            <p>{receipt.receiptNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Amount:</span>
                            <p>
                              $
                              {receipt.amount
                                ? receipt.amount.toFixed(2)
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Payment:</span>
                            <p>{receipt.paymentMethod || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-xl transform transition ${
                          expandedId === receipt.id ? 'rotate-180' : ''
                        }`}
                      >
                        ▼
                      </span>
                    </div>
                  </button>

                  {expandedId === receipt.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                      <div>
                        <p className="font-medium text-sm text-gray-700">
                          Extracted Text:
                        </p>
                        <p className="text-sm text-gray-600 mt-1 max-h-32 overflow-y-auto">
                          {receipt.extractedData?.raw_text || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-700">
                          Line Items:
                        </p>
                        {receipt.extractedData?.items &&
                        receipt.extractedData.items.length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {receipt.extractedData.items.map(
                              (item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="text-sm text-gray-600 bg-white p-2 rounded"
                                >
                                  <div className="flex justify-between">
                                    <span>
                                      {item.quantity}x {item.description}
                                    </span>
                                    <span>${item.price.toFixed(2)}</span>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 mt-1">No items found</p>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-700">
                          Processed:
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(receipt.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
