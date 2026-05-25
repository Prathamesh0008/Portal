'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import PortalNav from '@/components/PortalNav';

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  routeType: string;
  courier: string;
  createdAt: string;
  trackingId?: string;
}

export default function ShippingDashboard() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inTransit: 0, delivered: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/shipping/orders', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await response.json();
        if (data.success && isMounted) {
          setOrders(data.data.orders);
          setStats({
            total: data.data.orders.length,
            pending: data.data.orders.filter((o: Order) => o.status === 'PENDING').length,
            inTransit: data.data.orders.filter((o: Order) => o.status === 'IN_TRANSIT').length,
            delivered: data.data.orders.filter((o: Order) => o.status === 'DELIVERED').length,
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

  const courierName = user?.role === 'SHIPPING_DPD' ? 'DPD' : 'FedEx';
  const routeType = user?.role === 'SHIPPING_DPD' ? 'EU to EU' : 'EU to US';

  return (
    <div className="min-h-screen bg-amber-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <PortalNav
          title="Shipping Dashboard"
          subtitle={`${courierName} Shipping Partner - ${routeType}`}
          homeHref="/shipping"
        />

        {/* Stats */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="text-center">
              <div className="text-3xl font-bold text-amber-900">{stats.total}</div>
              <p className="text-amber-700 text-sm mt-2">Total Orders</p>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
              <p className="text-amber-700 text-sm mt-2">Pending</p>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.inTransit}</div>
              <p className="text-amber-700 text-sm mt-2">In Transit</p>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.delivered}</div>
              <p className="text-amber-700 text-sm mt-2">Delivered</p>
            </Card>
          </div>
        )}

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Assigned Orders</CardTitle>
              <Link href="/shipping/orders">
                <span className="text-amber-900 hover:underline font-medium">View All</span>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-amber-700">Loading...</p>
            ) : orders.length === 0 ? (
              <p className="text-amber-700">No orders assigned yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-amber-200">
                      <th className="text-left py-2 px-4 text-amber-900 font-semibold">Order #</th>
                      <th className="text-left py-2 px-4 text-amber-900 font-semibold">Status</th>
                      <th className="text-left py-2 px-4 text-amber-900 font-semibold">Tracking ID</th>
                      <th className="text-left py-2 px-4 text-amber-900 font-semibold">Date</th>
                      <th className="text-left py-2 px-4 text-amber-900 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map((order) => (
                      <tr key={order._id} className="border-b border-amber-100 hover:bg-amber-50">
                        <td className="py-3 px-4">{order.orderNumber}</td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-900">
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-mono">{order.trackingId || 'Not Set'}</td>
                        <td className="py-3 px-4 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <Link href={`/shipping/orders/${order._id}`}>
                            <span className="text-amber-900 hover:underline font-medium">Update</span>
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
