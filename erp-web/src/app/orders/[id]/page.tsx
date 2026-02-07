'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/auth/AuthContext';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  userId: string;
  subtotal: string;
  taxAmount?: string;
  tax_amount?: string;
  totalAmount?: string;
  total_amount?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

const statusSteps: { status: string; label: string; completed: boolean }[] = [];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchOrderDetail();
  }, [orderId, user]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      if (!token) {
        setError('Please log in to view order details');
        return;
      }

      const response = await fetch(`http://localhost:3002/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Order not found');
        } else if (response.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          const data = await response.json();
          setError(data.message || 'Failed to load order');
        }
        return;
      }

      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' };
      case 'confirmed':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: '✓' };
      case 'shipped':
        return { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🚚' };
      case 'delivered':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: '✓✓' };
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: '✕' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: '•' };
    }
  };

  const getTaxAmount = (order: Order) => {
    return order.taxAmount || order.tax_amount || '0';
  };

  const getTotal = (order: Order) => {
    return order.totalAmount || order.total_amount || '0';
  };

  const getStatusTimeline = (status: string) => {
    const steps = ['pending', 'confirmed', 'shipped', 'delivered'];
    return steps.map((step, idx) => ({
      step,
      label: step.charAt(0).toUpperCase() + step.slice(1),
      completed: steps.indexOf(status) >= idx,
      current: step === status,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-8">
          <Link href="/orders" className="text-blue-600 hover:underline mb-4 block">
            ← Back to Orders
          </Link>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-lg mb-4">{error || 'Order not found'}</p>
            <Link href="/orders" className="inline-block text-blue-600 hover:underline font-medium">
              Back to Order History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <Link href="/orders" className="text-blue-600 hover:underline mb-4 block">
          ← Back to Orders
        </Link>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Order #{(order.orderNumber || order.id).slice(-8).toUpperCase()}
              </h1>
              <p className="text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-6 py-3 rounded-full text-lg font-semibold ${statusColor.bg} ${statusColor.text}`}>
                {statusColor.icon} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-4">Order Progress</h3>
            <div className="flex items-center justify-between">
              {getStatusTimeline(order.status).map((item, idx, arr) => (
                <div key={item.step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        item.completed
                          ? 'bg-blue-600 text-white'
                          : item.current
                          ? 'bg-blue-200 text-blue-600 animate-pulse'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      ✓
                    </div>
                    <p className="text-xs font-medium mt-2 text-center">{item.label}</p>
                  </div>
                  {idx < arr.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        item.completed ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Items */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Order Items</h2>
              <div className="space-y-4">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.product?.name || 'Product'}</h4>
                        <p className="text-sm text-gray-600">SKU: {item.product?.sku || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">
                          {item.quantity} × ${parseFloat(item.unitPrice).toFixed(2)}
                        </p>
                        <p className="font-semibold text-lg">
                          ${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No items in this order</p>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${parseFloat(order.subtotal || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (10%)</span>
                  <span className="font-medium">${parseFloat(getTaxAmount(order)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="border-t pt-4 flex justify-between">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-2xl text-blue-600">
                    ${parseFloat(getTotal(order)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium">
                    Cancel Order
                  </button>
                )}
                <button className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition font-medium">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Additional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 text-sm mb-1">Order Number</p>
              <p className="font-mono font-semibold">{order.orderNumber || order.id}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Order Date</p>
              <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Status</p>
              <p className="font-semibold capitalize">{order.status}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Items</p>
              <p className="font-semibold">{order.items?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
