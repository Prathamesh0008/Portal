'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import PortalNav from '@/components/PortalNav';

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  routeType: string;
  courier: string;
  trackingId?: string;
  labelUrl?: string;
  shippingNotes?: string;
  receiverFirstName: string;
  receiverLastName: string;
  receiverAddress: string;
  receiverHouseNumber?: string;
  receiverCity?: string;
  receiverState?: string;
  receiverPostalCode?: string;
  receiverCountry?: string;
  productName: string;
  productSent?: string;
  quantity: number;
  weight: number;
  createdAt: string;
  source?: string;
}

export default function ShippingOrderDetailPage() {
  const params = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    trackingId: '',
    labelUrl: '',
    shippingNotes: '',
    productSent: '',
  });

  useEffect(() => {
    if (!token || !params.id) return;
    let isMounted = true;

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/shipping/orders/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await response.json();
        if (data.success && isMounted) {
          setOrder(data.data);
          if (!isUpdating && !isFormDirty) {
            setFormData({
              status: data.data.status,
              trackingId: data.data.trackingId || '',
              labelUrl: data.data.labelUrl || '',
              shippingNotes: data.data.shippingNotes || '',
              productSent: data.data.productSent || '',
            });
          }
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
  }, [token, params.id, isUpdating, isFormDirty]);

  const handleUpdate = async () => {
    if (!token || !order) return;

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/shipping/orders/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update order');
      }

      setOrder(data.data);
      setFormData({
        status: data.data.status,
        trackingId: data.data.trackingId || '',
        labelUrl: data.data.labelUrl || '',
        shippingNotes: data.data.shippingNotes || '',
        productSent: data.data.productSent || '',
      });
      setIsFormDirty(false);
      alert('Order updated successfully');
    } catch (error) {
      console.error('Failed to update order', error);
      alert(error instanceof Error ? error.message : 'Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 p-4 sm:p-6 md:p-8">
        <p className="text-amber-700">Loading...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-amber-50 p-4 sm:p-6 md:p-8">
        <p className="text-red-600">Order not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <PortalNav
          title={order.orderNumber}
          subtitle="Update shipment status and tracking"
          homeHref="/shipping"
          backHref="/shipping/orders"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Update Form */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      setIsFormDirty(true);
                      setFormData({ ...formData, status: e.target.value });
                    }}
                    className="w-full px-4 py-2 border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="LABEL_CREATED">Label Created</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">Tracking ID</label>
                  <input
                    type="text"
                    value={formData.trackingId}
                    onChange={(e) => {
                      setIsFormDirty(true);
                      setFormData({ ...formData, trackingId: e.target.value });
                    }}
                    className="w-full px-4 py-2 border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                    placeholder="e.g., 123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">Label URL</label>
                  <input
                    type="text"
                    value={formData.labelUrl}
                    onChange={(e) => {
                      setIsFormDirty(true);
                      setFormData({ ...formData, labelUrl: e.target.value });
                    }}
                    className="w-full px-4 py-2 border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                    placeholder="https://example.com/label.pdf"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">Product Sent</label>
                  <input
                    type="text"
                    value={formData.productSent}
                    onChange={(e) => {
                      setIsFormDirty(true);
                      setFormData({ ...formData, productSent: e.target.value });
                    }}
                    className="w-full px-4 py-2 border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                    placeholder="e.g., CENFORCE 100MG"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">Internal Notes</label>
                  <textarea
                    value={formData.shippingNotes}
                    onChange={(e) => {
                      setIsFormDirty(true);
                      setFormData({ ...formData, shippingNotes: e.target.value });
                    }}
                    className="w-full px-4 py-2 border border-amber-200 rounded focus:outline-none focus:border-amber-400 h-24"
                    placeholder="Internal shipping notes..."
                  />
                </div>

                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="w-full px-4 py-2 bg-amber-900 text-white rounded hover:bg-amber-800 disabled:opacity-50 transition"
                >
                  {isUpdating ? 'Updating...' : order.source === 'google-sheet' ? 'Update Google Sheet' : 'Update Order'}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                  <span className="text-amber-700">Product</span>
                  <span className="font-semibold text-amber-900">{order.productName}</span>
                </div>
                {order.productSent && (
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                    <span className="text-amber-700">Product Sent</span>
                    <span className="font-semibold text-amber-900">{order.productSent}</span>
                  </div>
                )}
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                  <span className="text-amber-700">Quantity</span>
                  <span className="font-semibold text-amber-900">{order.quantity}</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                  <span className="text-amber-700">Weight</span>
                  <span className="font-semibold text-amber-900">{order.weight} kg</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                  <span className="text-amber-700">Status</span>
                  <span className="font-semibold text-amber-900">{order.status}</span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3">
                  <span className="text-amber-700">Created</span>
                  <span className="font-semibold text-amber-900">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recipient</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-amber-900">
              {order.receiverFirstName} {order.receiverLastName}
            </p>
            <p className="text-sm text-amber-700 mt-1">
              {order.receiverAddress} {order.receiverHouseNumber}
            </p>
            <p className="text-sm text-amber-700">
              {order.receiverPostalCode} {order.receiverCity} {order.receiverState} {order.receiverCountry}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
