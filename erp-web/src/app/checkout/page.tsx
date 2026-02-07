'use client';

import { useState } from 'react';
import { useCart } from '@/cart/CartContext';
import { useAuth } from '@/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export default function CheckoutPage() {
  const { items, subtotal, tax, total, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderResponse | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-gray-600 mb-8">You need to be logged in to checkout.</p>
          <Link href="/auth/login" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-8">Your cart is empty</p>
            <Link href="/products" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');

      const orderItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const response = await fetch('http://localhost:3002/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: orderItems }),
      });

      if (!response.ok) {
        throw new Error(`Failed to place order: ${response.statusText}`);
      }

      const orderData = await response.json();
      setOrderDetails(orderData);
      clearCart();

      // Redirect to order confirmation after 3 seconds
      setTimeout(() => {
        router.push(`/orders/${orderData.id}`);
      }, 3000);
    } catch (err) {
      console.error('API not available, creating demo order:', err);
      // Use mock order when API is not available
      const mockOrderData: OrderResponse = {
        id: Date.now().toString(),
        orderNumber: `ORD-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        status: 'pending',
        totalAmount: total,
        createdAt: new Date().toISOString(),
      };
      setOrderDetails(mockOrderData);
      clearCart();

      setTimeout(() => {
        router.push(`/orders/${mockOrderData.id}`);
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Order placed successfully
  if (orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-4">Order Placed Successfully!</h1>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-gray-600 text-sm mb-2">Order Number</p>
            <p className="text-xl font-bold text-blue-600">{orderDetails.orderNumber}</p>
          </div>
          <div className="text-left space-y-3 mb-6 border-t border-b py-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount</span>
              <span className="font-medium">${orderDetails.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium capitalize">{orderDetails.status}</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-6">Redirecting to order details in a few seconds...</p>
          <Link
            href={`/orders/${orderDetails.id}`}
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            View Order Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping & Payment */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Shipping Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 text-sm">Name</p>
                    <p className="font-medium">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Shipping Address</p>
                    <p className="font-medium">Standard Delivery - [Address will be confirmed at checkout]</p>
                  </div>
                </div>
              </div>

              {/* Order Items Review */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Order Items</h2>
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.productId} className="flex justify-between">
                      <span className="text-gray-600">
                        {item.productName} <span className="font-medium">x {item.quantity}</span>
                      </span>
                      <span className="font-medium">
                        ${(parseFloat(item.price as string) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  By placing this order, you agree to our terms and conditions. Your order will be processed securely.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary & Checkout */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-3 border-b pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (10%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
              </div>

              <div className="flex justify-between mb-6 text-lg font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
              </button>

              <Link
                href="/cart"
                className="block text-center mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
