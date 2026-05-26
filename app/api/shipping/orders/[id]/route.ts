import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { successResponse, errorResponse, getTokenFromRequest, getPayloadFromToken } from '@/lib/response';
import { findLocalOrderWithCustomer, updateLocalOrder, useLocalData } from '@/lib/localData';
import { getGoogleSheetOrders, updateGoogleSheetOrder } from '@/lib/googleSheetsOrders';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const token = getTokenFromRequest(request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!payload || !['SHIPPING_DPD', 'SHIPPING_FEDEX'].includes(payload.role)) {
      return errorResponse('Unauthorized', 401);
    }

    const courier = payload.role === 'SHIPPING_DPD' ? 'DPD' : 'FEDEX';
    const sheetOrder = (await getGoogleSheetOrders()).find((order) => order._id === params.id || order.id === params.id);
    if (sheetOrder) {
      if (sheetOrder.courier !== courier) {
        return errorResponse('Access denied', 403);
      }

      return successResponse(sheetOrder, 'Order retrieved successfully');
    }

    if (useLocalData) {
      const order = findLocalOrderWithCustomer(params.id);

      if (!order) {
        return errorResponse('Order not found', 404);
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

    const order = await Order.findById(params.id).populate('customerId', 'firstName lastName email phone');

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Check courier access
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

    if (!payload || !['SHIPPING_DPD', 'SHIPPING_FEDEX'].includes(payload.role)) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const courier = payload.role === 'SHIPPING_DPD' ? 'DPD' : 'FEDEX';
    const sheetOrder = (await getGoogleSheetOrders()).find((order) => order._id === params.id || order.id === params.id);
    if (sheetOrder) {
      if (sheetOrder.courier !== courier) {
        return errorResponse('Access denied', 403);
      }

      const updatedOrder = await updateGoogleSheetOrder(params.id, {
        status: body.status,
        trackingId: body.trackingId,
        labelUrl: body.labelUrl,
        productSent: body.productSent,
      });
      return successResponse(updatedOrder, 'Google Sheet order updated successfully');
    }

    if (useLocalData) {
      const order = findLocalOrderWithCustomer(params.id);

      if (!order) {
        return errorResponse('Order not found', 404);
      }

      if (payload.role === 'SHIPPING_DPD' && order.courier !== 'DPD') {
        return errorResponse('Access denied', 403);
      }
      if (payload.role === 'SHIPPING_FEDEX' && order.courier !== 'FEDEX') {
        return errorResponse('Access denied', 403);
      }

      const updatedOrder = updateLocalOrder(params.id, body);
      return successResponse(updatedOrder, 'Order updated successfully');
    }

    await dbConnect();

    const order = await Order.findById(params.id);

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Check courier access
    if (payload.role === 'SHIPPING_DPD' && order.courier !== 'DPD') {
      return errorResponse('Access denied', 403);
    }
    if (payload.role === 'SHIPPING_FEDEX' && order.courier !== 'FEDEX') {
      return errorResponse('Access denied', 403);
    }

    const { status, trackingId, labelUrl, shippingNotes, productSent } = body;

    if (status) order.status = status;
    if (trackingId) order.trackingId = trackingId;
    if (labelUrl) order.labelUrl = labelUrl;
    if (productSent) order.productSent = productSent;
    if (shippingNotes) order.shippingNotes = shippingNotes;

    await order.save();

    let sheetSyncError: string | null = null;
    try {
      await updateGoogleSheetOrder(String(order.orderNumber), {
        status: order.status,
        trackingId: order.trackingId,
        labelUrl: order.labelUrl,
        productSent: order.productSent,
      });
    } catch (error: any) {
      sheetSyncError = error?.message || 'Google Sheet sync failed';
      console.error('Google Sheet sync error (shipping update):', error);
    }

    return successResponse(
      { order, sheetSynced: !sheetSyncError, sheetSyncError },
      sheetSyncError ? `Order updated, but Google Sheet sync failed: ${sheetSyncError}` : 'Order updated successfully'
    );
  } catch (error: any) {
    console.error('Order update error:', error);
    return errorResponse(error.message || 'Failed to update order', 500);
  }
}
