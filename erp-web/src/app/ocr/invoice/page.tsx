'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOCR } from '@/hooks/useOCR';
import FileUploadComponent from '@/components/FileUploadComponent';

interface InvoiceData {
  id: string;
  fileName: string;
  vendorName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  extractedData?: any;
  createdAt: string;
}

export default function InvoiceOCRPage() {
  const { user } = useAuth();
  const { processInvoice, getInvoices, loading, error: ocrError } = useOCR();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadInvoices();
    }
  }, [user, pagination.page]);

  const loadInvoices = async () => {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await getInvoices(pagination.limit, offset);
      setInvoices(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    }
  };

  const handleUpload = async (file: File) => {
    try {
      setError(null);
      const result = await processInvoice(file);
      // Reload invoices
      setPagination({ ...pagination, page: 1 });
      await loadInvoices();
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
        <h1 className="text-4xl font-bold mb-2">Invoice OCR</h1>
        <p className="text-gray-600 mb-8">Extract invoice data automatically</p>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Invoice</h2>
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
            <h2 className="text-xl font-semibold">Recent Invoices</h2>
          </div>

          {invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No invoices uploaded yet
            </div>
          ) : (
            <div className="divide-y">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-6 hover:bg-gray-50 transition">
                  <button
                    onClick={() =>
                      setExpandedId(
                        expandedId === invoice.id ? null : invoice.id,
                      )
                    }
                    className="w-full text-left"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{invoice.fileName}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Vendor:</span>
                            <p>{invoice.vendorName || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Invoice #:</span>
                            <p>{invoice.invoiceNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium">Amount:</span>
                            <p>
                              $
                              {invoice.totalAmount
                                ? invoice.totalAmount.toFixed(2)
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Date:</span>
                            <p>
                              {invoice.invoiceDate
                                ? new Date(invoice.invoiceDate).toLocaleDateString()
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-xl transform transition ${
                          expandedId === invoice.id ? 'rotate-180' : ''
                        }`}
                      >
                        ▼
                      </span>
                    </div>
                  </button>

                  {expandedId === invoice.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                      <div>
                        <p className="font-medium text-sm text-gray-700">
                          Extracted Text:
                        </p>
                        <p className="text-sm text-gray-600 mt-1 max-h-32 overflow-y-auto">
                          {invoice.extractedData?.raw_text || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-700">
                          Line Items:
                        </p>
                        {invoice.extractedData?.items &&
                        invoice.extractedData.items.length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {invoice.extractedData.items.map(
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
                          {new Date(invoice.createdAt).toLocaleString()}
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
