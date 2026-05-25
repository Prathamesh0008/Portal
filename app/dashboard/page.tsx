'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { useAuth } from '@/components/useAuth';

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  routeType: string;
  courier: string;
  createdAt: string;
  trackingId?: string;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, shipped: 0, delivered: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await response.json();
        if (data.success && isMounted) {
          setOrders(data.data);
          setStats({
            total: data.data.length,
            pending: data.data.filter((o: Order) => o.status === 'PENDING').length,
            shipped: data.data.filter((o: Order) => ['SHIPPED', 'IN_TRANSIT'].includes(o.status)).length,
            delivered: data.data.filter((o: Order) => o.status === 'DELIVERED').length,
          });
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
  }, [token]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-amber-900">Dashboard</h1>
          <p className="text-amber-700 mt-1">Welcome back! Here's your shipping overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <div className="text-3xl font-bold text-amber-900">{stats.total}</div>
            <p className="text-amber-700 text-sm mt-1">Total Orders</p>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-amber-700 text-sm mt-1">Pending</p>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.shipped}</div>
            <p className="text-amber-700 text-sm mt-1">In Transit</p>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.delivered}</div>
            <p className="text-amber-700 text-sm mt-1">Delivered</p>
          </Card>
        </div>

        {/* Quick Action */}
        <Link href="/dashboard/new-order">
          <button className="w-full md:w-auto bg-amber-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-800 transition">
            + Create New Order
          </button>
        </Link>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-amber-700">Loading...</p>
            ) : orders.length === 0 ? (
              <p className="text-amber-700">No orders yet. Create your first order!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-amber-200">
                      <th className="text-left py-2 px-4 text-amber-900 font-semibold">Order #</th>
                      <th className="text-left py-2 px-4 text-amber-900 font-semibold">Route</th>
                      <th className="text-left py-2 px-4 text-amber-900 font-semibold">Status</th>
                      <th className="text-left py-2 px-4 text-amber-900 font-semibold">Date</th>
                      <th className="text-left py-2 px-4 text-amber-900 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order._id} className="border-b border-amber-100 hover:bg-amber-50">
                        <td className="py-3 px-4">{order.orderNumber}</td>
                        <td className="py-3 px-4">{order.routeType === 'EU_TO_EU' ? 'EU to EU' : 'EU to US'}</td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-900">
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <Link href={`/dashboard/orders/${order._id}`}>
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
    </DashboardLayout>
  );
}
