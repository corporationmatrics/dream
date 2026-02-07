'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function OCRPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8 text-center">Please log in to use OCR features</div>;
  }

  const ocrServices = [
    {
      title: 'Invoice OCR',
      description: 'Extract data from invoices including vendor, amount, and line items',
      icon: '📄',
      href: '/ocr/invoice',
      color: 'bg-blue-50 border-blue-200 hover:shadow-blue-100',
      features: ['Vendor extraction', 'Amount parsing', 'Invoice number detection', 'Date extraction'],
    },
    {
      title: 'Receipt OCR',
      description: 'Process receipts for order verification and accounting',
      icon: '🧾',
      href: '/ocr/receipt',
      color: 'bg-green-50 border-green-200 hover:shadow-green-100',
      features: ['Vendor recognition', 'Transaction details', 'Payment method detection', 'Amount verification'],
    },
    {
      title: 'Barcode Scanner',
      description: 'Read product barcodes for inventory and checkout',
      icon: '📊',
      href: '/ocr/barcode',
      color: 'bg-purple-50 border-purple-200 hover:shadow-purple-100',
      features: ['Barcode reading', 'Type detection', 'Quantity tracking', 'Location logging'],
    },
    {
      title: 'Product Image OCR',
      description: 'Extract product information from images',
      icon: '🏷️',
      href: '/ocr/product',
      color: 'bg-orange-50 border-orange-200 hover:shadow-orange-100',
      features: ['Product name', 'SKU detection', 'Price extraction', 'Description parsing'],
    },
    {
      title: 'Document OCR',
      description: 'Process PDFs and images to extract text',
      icon: '📋',
      href: '/ocr/document',
      color: 'bg-red-50 border-red-200 hover:shadow-red-100',
      features: ['Multi-page support', 'PDF processing', 'Text extraction', 'Language support'],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">OCR Services</h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Leverage optical character recognition and document processing to automate data extraction from invoices, receipts, barcodes, and documents.
          </p>
        </div>

        {/* OCR Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {ocrServices.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className={`border rounded-lg p-6 transition hover:shadow-lg ${service.color}`}
            >
              <div className="text-4xl mb-3">{service.icon}</div>
              <h2 className="text-xl font-bold mb-2">{service.title}</h2>
              <p className="text-gray-700 text-sm mb-4">{service.description}</p>
              <div className="space-y-1">
                {service.features.map((feature) => (
                  <p key={feature} className="text-xs text-gray-600">
                    ✓ {feature}
                  </p>
                ))}
              </div>
              <div className="mt-4 font-semibold text-blue-600">
                Get Started →
              </div>
            </Link>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="inline-block w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-lg font-bold mb-3">
                1
              </div>
              <h3 className="font-semibold mb-2">Upload</h3>
              <p className="text-sm text-gray-600">
                Upload your document, image, or barcode
              </p>
            </div>
            <div className="text-center">
              <div className="inline-block w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-lg font-bold mb-3">
                2
              </div>
              <h3 className="font-semibold mb-2">Process</h3>
              <p className="text-sm text-gray-600">
                AI extracts data automatically
              </p>
            </div>
            <div className="text-center">
              <div className="inline-block w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-lg font-bold mb-3">
                3
              </div>
              <h3 className="font-semibold mb-2">Review</h3>
              <p className="text-sm text-gray-600">
                Verify extracted information
              </p>
            </div>
            <div className="text-center">
              <div className="inline-block w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-lg font-bold mb-3">
                4
              </div>
              <h3 className="font-semibold mb-2">Integrate</h3>
              <p className="text-sm text-gray-600">
                Use data in your workflows
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Benefits</h3>
            <ul className="space-y-2 text-gray-700">
              <li>⚡ <span className="font-medium">Fast Processing</span> - Real-time OCR recognition</li>
              <li>🎯 <span className="font-medium">High Accuracy</span> - AI-powered extraction</li>
              <li>📊 <span className="font-medium">Data Integration</span> - Automatic accounting entries</li>
              <li>🔐 <span className="font-medium">Secure</span> - Encrypted data storage</li>
              <li>♿ <span className="font-medium">Scalable</span> - Handle any volume</li>
              <li>🌐 <span className="font-medium">Multi-format</span> - Images, PDFs, and more</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Use Cases</h3>
            <ul className="space-y-2 text-gray-700">
              <li>💼 <span className="font-medium">Accounts Payable</span> - Automate invoice processing</li>
              <li>📦 <span className="font-medium">Inventory</span> - Track products with barcodes</li>
              <li>🛒 <span className="font-medium">Retail</span> - Fast checkout with barcode scanning</li>
              <li>📝 <span className="font-medium">Accounting</span> - Electronic bookkeeping</li>
              <li>🏪 <span className="font-medium">Warehouse</span> - Automated stock management</li>
              <li>📑 <span className="font-medium">Compliance</span> - Document digitization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
