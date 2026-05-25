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
  estimatedDeliveryDate?: string;
  adminNotes?: string;
  receiverFirstName: string;
  receiverLastName: string;
  receiverAddress: string;
  receiverHouseNumber?: string;
  receiverCity?: string;
  receiverState?: string;
  receiverPostalCode?: string;
  receiverCountry?: string;
  receiverEmail: string;
  receiverPhone: string;
  productName: string;
  productSent?: string;
  quantity: number;
  weight: number;
  parcelCount: number;
  createdAt: string;
  source?: string;
  customerId?: { _id: string; firstName: string; lastName: string; email: string };
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingLabel, setIsUploadingLabel] = useState(false);
  const [labelFile, setLabelFile] = useState<File | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    trackingId: '',
    labelUrl: '',
    adminNotes: '',
    courier: '',
    estimatedDeliveryDate: '',
    productSent: '',
  });

  useEffect(() => {
    if (!token || !params.id) return;
    let isMounted = true;

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/admin/orders/${params.id}`, {
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
              adminNotes: data.data.adminNotes || '',
              courier: data.data.courier,
              estimatedDeliveryDate: data.data.estimatedDeliveryDate || '',
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
      const response = await fetch(`/api/admin/orders/${params.id}`, {
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
        adminNotes: data.data.adminNotes || '',
        courier: data.data.courier,
        estimatedDeliveryDate: data.data.estimatedDeliveryDate || '',
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

  const handleUploadLabel = async () => {
    if (!token || !params.id || !labelFile) return;

    setIsUploadingLabel(true);
    try {
      const payload = new FormData();
      payload.append('file', labelFile);

      const response = await fetch(`/api/admin/orders/${params.id}/label`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload label');
      }

      setIsFormDirty(true);
      setFormData((current) => ({ ...current, labelUrl: data.data.labelUrl }));
      setLabelFile(null);
      alert('Label uploaded. Click "Update Order" to save it for customer.');
    } catch (error) {
      console.error('Failed to upload label', error);
      alert(error instanceof Error ? error.message : 'Failed to upload label');
    } finally {
      setIsUploadingLabel(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 p-8">
        <p className="text-amber-700">Loading...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-amber-50 p-8">
        <p className="text-red-600">Order not found</p>
      </div>
    );
  }

  const recipientFullName = `${order.receiverFirstName || ''} ${order.receiverLastName || ''}`.trim();
  const displayName = recipientFullName || '-';

  return (
    <div className="min-h-screen bg-amber-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PortalNav
          title={order.orderNumber}
          subtitle={displayName}
          homeHref="/admin"
          backHref="/admin/orders"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Status Update */}
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
                    <option value="ACCEPTED">Accepted</option>
                    <option value="PROCESSING">Processing</option>
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
                  {formData.labelUrl && (
                    <a
                      href={formData.labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-amber-900 underline"
                    >
                      Open current label
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">Upload Label (PDF/Image)</label>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setLabelFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-amber-900 file:mr-3 file:rounded file:border file:border-amber-300 file:bg-white file:px-3 file:py-2 file:text-amber-900"
                    />
                    <button
                      type="button"
                      onClick={handleUploadLabel}
                      disabled={isUploadingLabel || !labelFile}
                      className="rounded border border-amber-300 bg-white px-4 py-2 text-sm text-amber-900 hover:bg-amber-50 disabled:opacity-50"
                    >
                      {isUploadingLabel ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
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
                  <label className="block text-sm font-medium text-amber-900 mb-2">Est. Delivery Date</label>
                  <input
                    type="date"
                    value={formData.estimatedDeliveryDate}
                    onChange={(e) => {
                      setIsFormDirty(true);
                      setFormData({ ...formData, estimatedDeliveryDate: e.target.value });
                    }}
                    className="w-full px-4 py-2 border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">Admin Notes</label>
                  <textarea
                    value={formData.adminNotes}
                    onChange={(e) => {
                      setIsFormDirty(true);
                      setFormData({ ...formData, adminNotes: e.target.value });
                    }}
                    className="w-full px-4 py-2 border border-amber-200 rounded focus:outline-none focus:border-amber-400 h-24"
                    placeholder="Internal notes..."
                  />
                </div>

                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="w-full px-4 py-2 bg-amber-900 text-white rounded hover:bg-amber-800 disabled:opacity-50 transition"
                >
                  {isUpdating ? 'Updating...' : 'Update'}
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
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-amber-700">Order Number</span>
                  <span className="font-semibold text-amber-900">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Source</span>
                  <span className="font-semibold text-amber-900">{order.source === 'google-sheet' ? 'Google Sheet' : 'Portal'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Courier</span>
                  <span className="font-semibold text-amber-900">{order.courier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Status</span>
                  <span className="font-semibold text-amber-900">{order.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Product</span>
                  <span className="font-semibold text-amber-900">{order.productName}</span>
                </div>
                {order.productSent && (
                  <div className="flex justify-between">
                    <span className="text-amber-700">Product Sent</span>
                    <span className="font-semibold text-amber-900">{order.productSent}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-amber-700">Quantity</span>
                  <span className="font-semibold text-amber-900">{order.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700">Weight</span>
                  <span className="font-semibold text-amber-900">{order.weight} kg</span>
                </div>
                <div className="flex justify-between">
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
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-amber-900">
                {displayName}
              </p>
              <p className="text-amber-700">{order.receiverAddress} {order.receiverHouseNumber}</p>
              <p className="text-amber-700">
                {order.receiverPostalCode} {order.receiverCity} {order.receiverState} {order.receiverCountry}
              </p>
              <p className="text-amber-700">{order.receiverEmail}</p>
              <p className="text-amber-700">{order.receiverPhone}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
