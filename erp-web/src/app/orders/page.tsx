'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/auth/AuthContext';
import { useRouter } from 'next/navigation';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount?: string;
  total_amount?: string;
  subtotal: string;
  taxAmount?: string;
  tax_amount?: string;
  discount?: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount-high' | 'amount-low'>('newest');

  useEffect(() => {
    // Wait for auth to load before redirecting
    if (isLoading) return;
    
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchOrders();
  }, [user, isLoading, router]);

  useEffect(() => {
    let filtered = [...orders];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'amount-high':
        filtered.sort((a, b) => parseFloat(getTotal(b)) - parseFloat(getTotal(a)));
        break;
      case 'amount-low':
        filtered.sort((a, b) => parseFloat(getTotal(a)) - parseFloat(getTotal(b)));
        break;
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, sortBy]);

  const mockOrders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      status: 'delivered',
      subtotal: '99.99',
      totalAmount: '109.99',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { id: '1', quantity: 1, unitPrice: '99.99', product: { name: 'Product A' } },
      ],
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      status: 'shipped',
      subtotal: '149.99',
      totalAmount: '164.99',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { id: '2', quantity: 1, unitPrice: '149.99', product: { name: 'Product B' } },
      ],
    },
    {
      id: '3',
      orderNumber: 'ORD-003',
      status: 'pending',
      subtotal: '79.99',
      totalAmount: '87.99',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { id: '3', quantity: 2, unitPrice: '39.99', product: { name: 'Product F' } },
      ],
    },
  ];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.log('No token, using mock orders');
        setOrders(mockOrders);
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3002/orders', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        setError('Your session has expired. Please log in again.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      const data = await response.json();
      const ordersList = Array.isArray(data) ? data : data.data || [];
      setOrders(ordersList.length > 0 ? ordersList : mockOrders);
      
      if (ordersList.length === 0) {
        setError(null);
      }
    } catch (err) {
      console.error('API not available, using mock orders:', err);
      // Use mock orders when API is not available
      setOrders(mockOrders);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotal = (order: Order) => {
    return order.totalAmount || order.total_amount || '0';
  };

  const getTaxAmount = (order: Order) => {
    return order.taxAmount || order.tax_amount || '0';
  };

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading your orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Orders</h1>
            <p className="text-gray-600">View and manage all your orders</p>
          </div>
          <Link href="/products" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium">
            Continue Shopping
          </Link>
        </div>

        {error && error !== 'Please log in to view your orders' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        )}

        {/* Filters */}
        {orders.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Highest Amount</option>
                  <option value="amount-low">Lowest Amount</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your orders...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-600 text-lg mb-4">
              {orders.length === 0 ? "You haven't placed any orders yet" : "No orders match your filters"}
            </p>
            <Link href="/products" className="inline-block text-blue-600 hover:underline font-medium">
              Browse products →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">
                Showing {filteredOrders.length} of {orders.length} order{orders.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Order Cards */}
            {filteredOrders.map((order) => (
              <Link href={`/orders/${order.id}`} key={order.id}>
                <div className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden">
                  <div className="p-6 border-b flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Order #{(order.orderNumber || order.id).slice(-8).toUpperCase()}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Items Count */}
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Items</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {order.items?.length || 0}
                      </p>
                    </div>

                    {/* Subtotal */}
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Subtotal</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${parseFloat(order.subtotal || '0').toFixed(2)}
                      </p>
                    </div>

                    {/* Tax */}
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Tax</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${parseFloat(getTaxAmount(order)).toFixed(2)}
                      </p>
                    </div>

                    {/* Total */}
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Total</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${parseFloat(getTotal(order)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
