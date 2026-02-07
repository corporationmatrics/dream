'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/auth/AuthContext';
import { useWishlist } from '@/wishlist/WishlistContext';
import { useCart } from '@/cart/CartContext';
import WishlistButton from '@/components/WishlistButton';

interface WishlistProduct {
  id: string;
  name: string;
  price: string;
  stock: number;
  category: string;
  description: string;
  status: string;
}

interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: WishlistProduct;
}

export default function WishlistPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { removeFromWishlist } = useWishlist();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchWishlist();
  }, [user, page]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(
        `http://localhost:3002/wishlist?page=${page}&limit=12`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load wishlist');
      }

      const data = await response.json();
      setItems(data.data);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: WishlistProduct) => {
    addToCart(product.id, product.name, product.price, 1);
  };

  const handleRemove = async (productId: string) => {
    await removeFromWishlist(productId);
    setItems(items.filter(item => item.productId !== productId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <Link href="/" className="text-blue-600 hover:underline mb-6 block">
          ← Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Wishlist</h1>
          <p className="text-gray-600">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🤍</div>
            <p className="text-gray-600 text-lg mb-2">Your wishlist is empty</p>
            <p className="text-gray-500 mb-6">
              Browse products and add your favorites to get started
            </p>
            <Link
              href="/products"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                >
                  {/* Image Placeholder */}
                  <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                    <span className="text-gray-400 text-4xl">📦</span>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Category & Date */}
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {item.product.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Title */}
                    <Link
                      href={`/products/${item.product.id}`}
                      className="text-lg font-bold text-gray-900 hover:text-blue-600 mb-2 line-clamp-2 block"
                    >
                      {item.product.name}
                    </Link>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.product.description}
                    </p>

                    {/* Price & Stock */}
                    <div className="flex justify-between items-center mb-4 pb-4 border-b">
                      <span className="text-2xl font-bold text-blue-600">
                        ${parseFloat(item.product.price).toFixed(2)}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          item.product.stock > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      {item.product.stock > 0 && (
                        <button
                          onClick={() => handleAddToCart(item.product)}
                          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                          🛒 Add to Cart
                        </button>
                      )}
                      <div className="flex gap-2">
                        <Link
                          href={`/products/${item.product.id}`}
                          className="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleRemove(item.product.id)}
                          className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg hover:bg-red-100 transition font-medium"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-2 rounded-lg transition ${
                        page === p
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
