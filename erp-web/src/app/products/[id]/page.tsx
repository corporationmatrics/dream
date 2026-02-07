'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/cart/CartContext';
import { useAuth } from '@/auth/AuthContext';
import ReviewForm from '@/components/ReviewForm';
import ReviewsList from '@/components/ReviewsList';
import WishlistButton from '@/components/WishlistButton';

interface Product {
  id: string;
  name: string;
  price: string;
  stock: number;
  category: string;
  description: string;
  status: string;
  sku: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3002/products/${productId}`);
      if (!response.ok) {
        throw new Error('Product not found');
      }
      const data = await response.json();
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!product) return;

    addToCart(product.id, product.name, product.price, quantity);
    setAddedSuccess(true);

    // Reset success message after 2 seconds
    setTimeout(() => {
      setAddedSuccess(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading product...</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-white p-8 rounded-lg shadow">
            <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
            <Link href="/products" className="text-blue-600 hover:underline">
              ← Back to Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <Link href="/products" className="text-blue-600 hover:underline mb-6 block">
          ← Back to Products
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
            <span className="text-gray-400 text-xl">Product Image</span>
          </div>

          {/* Product Details */}
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="mb-4">
              <span className="text-sm text-gray-500">{product.category}</span>
              <span className="text-sm text-gray-500 ml-2">•</span>
              <span className="text-sm text-gray-500 ml-2">SKU: {product.sku}</span>
            </div>

            <h1 className="text-4xl font-bold mb-2">{product.name}</h1>

            <p className="text-gray-600 mb-6">{product.description}</p>

            <div className="mb-6 pb-6 border-b">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                ${parseFloat(product.price).toFixed(2)}
              </div>
              <div
                className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                  product.stock > 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </div>
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-4 mb-6">
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={handleAddToCart}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    {user ? 'Add to Cart' : 'Sign in to Buy'}
                  </button>
                  <WishlistButton productId={productId} variant="button" />
                </div>
              </div>
            )}

            {/* Success Message */}
            {addedSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium">✓ Added to cart successfully!</p>
              </div>
            )}

            {product.stock === 0 && (
              <button disabled className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-lg cursor-not-allowed mb-6">
                Out of Stock
              </button>
            )}

            {/* Product Info */}
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium capitalize">{product.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Added:</span>
                <span className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">{new Date(product.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Customer Reviews</h2>
            {user && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Write a Review
              </button>
            )}
          </div>

          {showReviewForm && (
            <ReviewForm
              productId={productId}
              onReviewSubmitted={() => {
                setShowReviewForm(false);
                setRefreshReviews(prev => prev + 1);
              }}
              onCancel={() => setShowReviewForm(false)}
            />
          )}

          <ReviewsList
            key={refreshReviews}
            productId={productId}
          />
        </div>
      </div>
    </div>
  );
}
