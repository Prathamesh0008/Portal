'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  trackingId?: string;
  labelUrl?: string;
  estimatedDeliveryDate?: string;
  receiverFirstName: string;
  receiverLastName: string;
  receiverAddress: string;
  receiverHouseNumber?: string;
  receiverCity?: string;
  receiverPostalCode?: string;
  receiverCountry?: string;
  receiverEmail?: string;
  receiverPhone?: string;
  productName: string;
  quantity: number;
  weight: number;
  createdAt: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || !params.id) return;
    let isMounted = true;

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await response.json();
        if (data.success && isMounted) {
          setOrder(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch order', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrder();
    const intervalId = window.setInterval(fetchOrder, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [token, params.id]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <p className="text-amber-700">Loading...</p>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <p className="text-red-600">Order not found</p>
      </DashboardLayout>
    );
  }

  const statusSteps = ['PENDING', 'ACCEPTED', 'PROCESSING', 'LABEL_CREATED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'];
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">{order.orderNumber}</h1>
            <p className="text-amber-700 mt-1">Created {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <Link
            href="/dashboard/orders"
            className="inline-flex w-fit px-4 py-2 rounded border border-amber-300 bg-white text-amber-900 hover:bg-amber-100 transition"
          >
            Back to Orders
          </Link>
        </div>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Shipment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      index <= currentStepIndex ? 'bg-amber-900 text-white' : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    {index <= currentStepIndex ? 'OK' : index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">{step}</p>
                    {step === order.status && (
                      <p className="text-sm text-amber-700">Current status</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {order.trackingId && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium">Tracking ID</p>
                <p className="text-lg font-mono text-green-900 mt-1">{order.trackingId}</p>
              </div>
            )}

            {order.labelUrl && (
              <div className="mt-4">
                <a
                  href={order.labelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Download Label
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recipient Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-amber-900">{order.receiverFirstName} {order.receiverLastName}</p>
              <p className="text-amber-700">
                {order.receiverAddress} {order.receiverHouseNumber}
              </p>
              <p className="text-amber-700">
                {order.receiverPostalCode} {order.receiverCity} {order.receiverCountry}
              </p>
              {order.receiverEmail && <p className="text-amber-700">{order.receiverEmail}</p>}
              {order.receiverPhone && <p className="text-amber-700">{order.receiverPhone}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-amber-700">Product Name</span>
                <span className="font-semibold text-amber-900">{order.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Quantity</span>
                <span className="font-semibold text-amber-900">{order.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Weight</span>
                <span className="font-semibold text-amber-900">{order.weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Route</span>
                <span className="font-semibold text-amber-900">
                  {order.routeType === 'EU_TO_EU' ? 'EU to EU' : 'EU to US'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Courier</span>
                <span className="font-semibold text-amber-900">{order.courier}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
