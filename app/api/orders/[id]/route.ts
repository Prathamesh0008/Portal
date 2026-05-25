import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { successResponse, errorResponse, getTokenFromRequest, getPayloadFromToken } from '@/lib/response';
import { findLocalOrder, updateLocalOrder, useLocalData } from '@/lib/localData';
import { getGoogleSheetOrders } from '@/lib/googleSheetsOrders';

function hasOrderAccess(payload: { role: string; userId: string; email: string }, order: { courier?: string; customerId?: unknown }) {
  if (payload.role === 'CUSTOMER') {
    const customer = typeof order.customerId === 'string' ? null : order.customerId;
    const customerEmail = customer && typeof customer === 'object' && 'email' in customer ? String(customer.email || '') : '';
    // Legacy sheet rows may not have customer email; allow those for now to avoid false "not found".
    if (customerEmail && customerEmail.toLowerCase() !== payload.email.toLowerCase()) {
      return false;
    }
  }

  if (payload.role === 'SHIPPING_DPD' && order.courier !== 'DPD') return false;
  if (payload.role === 'SHIPPING_FEDEX' && order.courier !== 'FEDEX') return false;
  return true;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const token = getTokenFromRequest(request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!payload) {
      return errorResponse('Unauthorized', 401);
    }

    const sheetOrder = (await getGoogleSheetOrders()).find(
      (order) =>
        order._id === params.id ||
        order.id === params.id ||
        order.orderNumber === params.id ||
        `sheet-${order.orderNumber}` === params.id
    );
    if (sheetOrder) {
      if (!hasOrderAccess(payload, sheetOrder)) {
        return errorResponse('Access denied', 403);
      }
      return successResponse(sheetOrder, 'Order retrieved successfully');
    }

    if (useLocalData) {
      const order = findLocalOrder(params.id);

      if (!order) {
        return errorResponse('Order not found', 404);
      }

      if (payload.role === 'CUSTOMER' && order.customerId !== payload.userId) {
        return errorResponse('Access denied', 403);
      }

      if (payload.role === 'SHIPPING_DPD' && order.courier !== 'DPD') {
        return errorResponse('Access denied', 403);
      }

      if (payload.role === 'SHIPPING_FEDEX' && order.courier !== 'FEDEX') {
        return errorResponse('Access denied', 403);
      }

      return successResponse(order, 'Order retrieved successfully');
    }

    await dbConnect();

    const order = await Order.findById(params.id);

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Check permissions
    if (payload.role === 'CUSTOMER' && order.customerId.toString() !== payload.userId) {
      return errorResponse('Access denied', 403);
    }

    if (payload.role === 'SHIPPING_DPD' && order.courier !== 'DPD') {
      return errorResponse('Access denied', 403);
    }

    if (payload.role === 'SHIPPING_FEDEX' && order.courier !== 'FEDEX') {
      return errorResponse('Access denied', 403);
    }

    return successResponse(order, 'Order retrieved successfully');
  } catch (error: any) {
    console.error('Order retrieval error:', error);
    return errorResponse('Failed to retrieve order', 500, error.message);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const token = getTokenFromRequest(request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!payload) {
      return errorResponse('Unauthorized', 401);
    }

    if (payload.role === 'CUSTOMER') {
      return errorResponse('Customers cannot update order status directly', 403);
    }

    const body = await request.json();

    if (useLocalData) {
      const order = findLocalOrder(params.id);

      if (!order) {
        return errorResponse('Order not found', 404);
      }

      if (payload.role === 'CUSTOMER' && order.customerId !== payload.userId) {
        return errorResponse('Access denied', 403);
      }

      if (payload.role === 'SHIPPING_DPD' && order.courier !== 'DPD') {
        return errorResponse('Access denied', 403);
      }

      if (payload.role === 'SHIPPING_FEDEX' && order.courier !== 'FEDEX') {
        return errorResponse('Access denied', 403);
      }

      const updates: Record<string, unknown> = {};

      if (payload.role === 'ADMIN' || payload.role === 'SHIPPING_DPD' || payload.role === 'SHIPPING_FEDEX') {
        if (body.status) updates.status = body.status;
        if (body.trackingId) updates.trackingId = body.trackingId;
        if (body.labelUrl) updates.labelUrl = body.labelUrl;
        if (body.estimatedDeliveryDate) updates.estimatedDeliveryDate = body.estimatedDeliveryDate;
        if (body.shippingNotes) updates.shippingNotes = body.shippingNotes;
      }

      if (payload.role === 'ADMIN' && body.adminNotes) {
        updates.adminNotes = body.adminNotes;
      }

      const updatedOrder = updateLocalOrder(params.id, updates);
      return successResponse(updatedOrder, 'Order updated successfully');
    }

    await dbConnect();

    const order = await Order.findById(params.id);

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Check permissions
    if (payload.role === 'CUSTOMER' && order.customerId.toString() !== payload.userId) {
      return errorResponse('Access denied', 403);
    }

    if (payload.role === 'SHIPPING_DPD' && order.courier !== 'DPD') {
      return errorResponse('Access denied', 403);
    }

    if (payload.role === 'SHIPPING_FEDEX' && order.courier !== 'FEDEX') {
      return errorResponse('Access denied', 403);
    }

    const { status, trackingId, labelUrl, estimatedDeliveryDate, shippingNotes, adminNotes } = body;

    // Update allowed fields based on role
    if (payload.role === 'ADMIN' || payload.role === 'SHIPPING_DPD' || payload.role === 'SHIPPING_FEDEX') {
      if (status) order.status = status;
      if (trackingId) order.trackingId = trackingId;
      if (labelUrl) order.labelUrl = labelUrl;
      if (estimatedDeliveryDate) order.estimatedDeliveryDate = estimatedDeliveryDate;
      if (shippingNotes) order.shippingNotes = shippingNotes;
    }

    if (payload.role === 'ADMIN' && adminNotes) {
      order.adminNotes = adminNotes;
    }

    await order.save();

    return successResponse(order, 'Order updated successfully');
  } catch (error: any) {
    console.error('Order update error:', error);
    return errorResponse('Failed to update order', 500, error.message);
  }
}
