'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOCR } from '@/hooks/useOCR';
import FileUploadComponent from '@/components/FileUploadComponent';

interface ProductImageData {
  id: string;
  fileName: string;
  extractedProductName?: string;
  extractedSku?: string;
  extractedPrice?: number;
  extractedDescription?: string;
  extractedData?: any;
  createdAt: string;
}

export default function ProductImageOCRPage() {
  const { user } = useAuth();
  const { processProductImage, getProductImages, loading, error: ocrError } =
    useOCR();
  const [products, setProducts] = useState<ProductImageData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user, pagination.page]);

  const loadProducts = async () => {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      const results = await getProductImages(pagination.limit, offset);
      setProducts(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    }
  };

  const handleUpload = async (file: File) => {
    try {
      setError(null);
      await processProductImage(file);
      setPagination({ ...pagination, page: 1 });
      await loadProducts();
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
        <h1 className="text-4xl font-bold mb-2">Product Image OCR</h1>
        <p className="text-gray-600 mb-8">
          Extract product information from images
        </p>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Product Image</h2>
          <FileUploadComponent
            onUpload={handleUpload}
            acceptedTypes={['image/jpeg', 'image/png']}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.length === 0 ? (
            <div className="md:col-span-2 bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No products uploaded yet
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
              >
                <div className="p-6">
                  <button
                    onClick={() =>
                      setExpandedId(
                        expandedId === product.id ? null : product.id,
                      )
                    }
                    className="w-full text-left"
                  >
                    <p className="font-semibold text-lg mb-2">
                      {product.extractedProductName || product.fileName}
                    </p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">SKU:</span>{' '}
                        {product.extractedSku || 'Not detected'}
                      </p>
                      <p>
                        <span className="font-medium">Price:</span>{' '}
                        {product.extractedPrice
                          ? `$${product.extractedPrice.toFixed(2)}`
                          : 'Not detected'}
                      </p>
                      <p>
                        <span className="font-medium">Uploaded:</span>{' '}
                        {new Date(product.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>

                  {expandedId === product.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div>
                        <p className="font-medium text-sm text-gray-700 mb-1">
                          Description:
                        </p>
                        <p className="text-sm text-gray-600">
                          {product.extractedDescription || 'Not detected'}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-700 mb-1">
                          Raw Text:
                        </p>
                        <p className="text-sm text-gray-600 max-h-24 overflow-y-auto bg-gray-50 p-2 rounded">
                          {product.extractedData?.raw_text || 'No text extracted'}
                        </p>
                      </div>
                      <div className="pt-3 border-t">
                        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                          Use as Product Template
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
