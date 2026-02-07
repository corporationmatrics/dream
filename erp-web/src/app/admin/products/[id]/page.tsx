'use client';

import AdminGuard from '@/components/AdminGuard';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/admin" className="text-blue-600 hover:underline mb-4 block">
              ← Back to Admin Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Edit Product</h1>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Product ID: {productId}</p>
              <p className="text-gray-600">Edit functionality coming soon...</p>
              <Link
                href="/admin"
                className="inline-block mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
