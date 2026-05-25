'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import Link from 'next/link';
import PortalNav from '@/components/PortalNav';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  dpdOrders: number;
  fedexOrders: number;
  deliveredOrders: number;
  totalCustomers: number;
  totalShippingPartners: number;
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await response.json();
        if (data.success && isMounted) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStats();
    const intervalId = window.setInterval(fetchStats, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-amber-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <PortalNav
          title="Admin Dashboard"
          subtitle="Manage orders, customers, and shipping partners"
          homeHref="/admin"
        />

        {/* Stats Grid */}
        {isLoading ? (
          <p className="text-amber-700">Loading...</p>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="text-center">
                <div className="text-4xl font-bold text-amber-900">{stats.totalOrders}</div>
                <p className="text-amber-700 text-sm mt-2">Total Orders</p>
              </Card>
              <Card className="text-center">
                <div className="text-4xl font-bold text-orange-600">{stats.pendingOrders}</div>
                <p className="text-amber-700 text-sm mt-2">Pending Orders</p>
              </Card>
              <Card className="text-center">
                <div className="text-4xl font-bold text-green-600">{stats.deliveredOrders}</div>
                <p className="text-amber-700 text-sm mt-2">Delivered</p>
              </Card>
              <Card className="text-center">
                <div className="text-4xl font-bold text-blue-600">{stats.totalCustomers}</div>
                <p className="text-amber-700 text-sm mt-2">Customers</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.dpdOrders}</div>
                <p className="text-amber-700 text-sm mt-2">DPD Orders (EU to EU)</p>
              </Card>
              <Card className="text-center">
                <div className="text-3xl font-bold text-indigo-600">{stats.fedexOrders}</div>
                <p className="text-amber-700 text-sm mt-2">FedEx Orders (EU to US)</p>
              </Card>
              <Card className="text-center">
                <div className="text-3xl font-bold text-cyan-600">{stats.totalShippingPartners}</div>
                <p className="text-amber-700 text-sm mt-2">Shipping Partners</p>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/orders">
                <button className="w-full bg-amber-900 text-white px-6 py-4 rounded-lg font-medium hover:bg-amber-800 transition">
                  View All Orders
                </button>
              </Link>
              <Link href="/admin/customers">
                <button className="w-full bg-amber-900 text-white px-6 py-4 rounded-lg font-medium hover:bg-amber-800 transition">
                  Manage Customers
                </button>
              </Link>
              <Link href="/admin/shipping-partners">
                <button className="w-full bg-amber-900 text-white px-6 py-4 rounded-lg font-medium hover:bg-amber-800 transition">
                  Shipping Partners
                </button>
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
