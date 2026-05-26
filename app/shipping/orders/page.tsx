'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/useAuth';
import { Card, CardContent } from '@/components/Card';
import PortalNav from '@/components/PortalNav';

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  routeType: string;
  courier: string;
  createdAt: string;
  trackingId?: string;
  productName?: string;
  productSent?: string;
  quantity?: number;
  receiverAddress?: string;
  receiverCity?: string;
  receiverState?: string;
  receiverPostalCode?: string;
  receiverCountry?: string;
}

export default function ShippingOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        const params = new URLSearchParams();
        if (filter) params.append('status', filter);

        const response = await fetch(`/api/shipping/orders?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await response.json();
        if (data.success && isMounted) {
          setOrders(data.data.orders);
        }
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrders();
    const intervalId = window.setInterval(fetchOrders, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [token, filter]);

  return (
    <div className="min-h-screen bg-amber-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PortalNav title="My Orders" subtitle="Assigned shipments" homeHref="/shipping" backHref="/shipping" />

        {/* Filter */}
        <Card>
          <CardContent>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-amber-200 rounded focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SHIPPED">Shipped</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardContent>
            {isLoading ? (
              <p className="text-amber-700">Loading...</p>
            ) : orders.length === 0 ? (
              <p className="text-amber-700">No orders found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full">
                  <thead>
                    <tr className="border-b border-amber-200">
                      <th className="text-left py-3 px-4 text-amber-900 font-semibold">Order ID</th>
                      <th className="text-left py-3 px-4 text-amber-900 font-semibold">Address</th>
                      <th className="text-left py-3 px-4 text-amber-900 font-semibold">City</th>
                      <th className="text-left py-3 px-4 text-amber-900 font-semibold">ZIP</th>
                      <th className="text-left py-3 px-4 text-amber-900 font-semibold">Country</th>
                      <th className="text-left py-3 px-4 text-amber-900 font-semibold">Product</th>
                      <th className="text-left py-3 px-4 text-amber-900 font-semibold">Qty</th>
                      <th className="text-left py-3 px-4 text-amber-900 font-semibold">Tracking</th>
                      <th className="text-left py-3 px-4 text-amber-900 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-amber-900 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-amber-100 hover:bg-amber-50">
                    <td className="py-3 px-4">{order.orderNumber}</td>
                    <td className="py-3 px-4 text-sm">{order.receiverAddress || '-'}</td>
                    <td className="py-3 px-4 text-sm">{order.receiverCity || '-'}</td>
                    <td className="py-3 px-4 text-sm">{order.receiverPostalCode || '-'}</td>
                    <td className="py-3 px-4 text-sm">{order.receiverCountry || '-'}</td>
                    <td className="py-3 px-4 text-sm">
                      {order.productName || '-'}
                      {order.productSent && <span className="block text-xs text-amber-600">Sent: {order.productSent}</span>}
                    </td>
                    <td className="py-3 px-4 text-sm">{order.quantity ?? '-'}</td>
                    <td className="py-3 px-4 text-sm font-mono">{order.trackingId || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-900">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/shipping/orders/${order._id}`}>
                        <span className="text-amber-900 hover:underline font-medium">View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
