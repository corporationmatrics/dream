'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOCR } from '@/hooks/useOCR';
import FileUploadComponent from '@/components/FileUploadComponent';

interface BarcodeResult {
  id: string;
  productId: string;
  barcodeData: string;
  barcodeType: string;
  quantityScanned: number;
  scanDate: string;
}

export default function BarcodeOCRPage() {
  const { user } = useAuth();
  const { scanBarcode, getBarcodes, loading, error: ocrError } = useOCR();
  const [productId, setProductId] = useState<string>('');
  const [scans, setScans] = useState<BarcodeResult[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const [error, setError] = useState<string | null>(null);
  const [scanLocation, setScanLocation] = useState<string>('');

  useEffect(() => {
    if (productId && user) {
      loadScans();
    }
  }, [user, productId, pagination.page]);

  const loadScans = async () => {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await getBarcodes(productId, pagination.limit, offset);
      setScans(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scans');
    }
  };

  const handleUpload = async (file: File) => {
    if (!productId.trim()) {
      setError('Please enter a Product ID');
      return;
    }

    try {
      setError(null);
      const result = await scanBarcode(
        file,
        productId,
        scanLocation || undefined,
      );
      setPagination({ ...pagination, page: 1 });
      await loadScans();
      setScanLocation('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    }
  };

  if (!user) {
    return <div className="p-8 text-center">Please log in to use OCR features</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <h1 className="text-4xl font-bold mb-2">Barcode Scanner</h1>
        <p className="text-gray-600 mb-8">Read product barcodes for inventory management</p>

        {/* Scan Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Scan Barcode</h2>

          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product ID *
              </label>
              <input
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Enter product ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scan Location (Optional)
              </label>
              <input
                type="text"
                value={scanLocation}
                onChange={(e) => setScanLocation(e.target.value)}
                placeholder="e.g., Warehouse A, Shelf 3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <FileUploadComponent
            onUpload={handleUpload}
            acceptedTypes={['image/jpeg', 'image/png']}
            disabled={loading || !productId}
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
        {productId && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                Scan History - Product {productId}
              </h2>
            </div>

            {scans.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No scans recorded for this product
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Barcode
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Scan Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {scans.map((scan) => (
                      <tr key={scan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-mono text-gray-900">
                          {scan.barcodeData}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {scan.barcodeType || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {scan.quantityScanned}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(scan.scanDate).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
