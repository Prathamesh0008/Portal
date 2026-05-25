import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { successResponse, errorResponse, getTokenFromRequest, getPayloadFromToken } from '@/lib/response';
import { findLocalOrder, updateLocalOrder, useLocalData } from '@/lib/localData';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const token = getTokenFromRequest(request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!payload) {
      return errorResponse('Unauthorized', 401);
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

      const body = await request.json();
      const updatedOrder = updateLocalOrder(params.id, body);
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

    const body = await request.json();
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
