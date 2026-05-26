'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/Card';
import { useAuth } from '@/components/useAuth';

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  routeType: string;
  courier: string;
  createdAt: string;
}

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
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

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-900',
    ACCEPTED: 'bg-blue-100 text-blue-900',
    PROCESSING: 'bg-indigo-100 text-indigo-900',
    LABEL_CREATED: 'bg-purple-100 text-purple-900',
    SHIPPED: 'bg-cyan-100 text-cyan-900',
    IN_TRANSIT: 'bg-sky-100 text-sky-900',
    DELIVERED: 'bg-green-100 text-green-900',
    CANCELLED: 'bg-red-100 text-red-900',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">Your Orders</h1>
            <p className="text-amber-700 mt-1">{orders.length} orders total</p>
          </div>
          <Link href="/dashboard/new-order" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-amber-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-800 transition">
              + New Order
            </button>
          </Link>
        </div>

        <Card>
          <CardContent>
            {isLoading ? (
              <p className="text-amber-700">Loading...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-amber-700 mb-4">No orders yet</p>
                <Link href="/dashboard/new-order">
                  <span className="text-amber-900 font-medium hover:underline">Create your first order</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Link key={order._id} href={`/dashboard/orders/${order._id}`}>
                    <div className="p-4 border border-amber-200 rounded-lg hover:bg-amber-50 transition cursor-pointer">
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-amber-900">{order.orderNumber}</h3>
                          <p className="text-sm text-amber-700 mt-1">
                            {order.routeType === 'EU_TO_EU' ? 'EU to EU' : 'EU to US'} - {order.courier}
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            statusColors[order.status] || 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
