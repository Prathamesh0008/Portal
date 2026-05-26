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

    if (!payload || payload.role !== 'ADMIN') {
      return errorResponse('Unauthorized', 401);
    }

    const sheetOrder = (await getGoogleSheetOrders()).find((order) => order._id === params.id || order.id === params.id);
    if (sheetOrder) {
      return successResponse(sheetOrder, 'Order retrieved successfully');
    }

    if (useLocalData) {
      const order = findLocalOrderWithCustomer(params.id);

      if (!order) {
        return errorResponse('Order not found', 404);
      }

      return successResponse(order, 'Order retrieved successfully');
    }

    await dbConnect();

    const order = await Order.findById(params.id).populate('customerId', 'firstName lastName email phone');

    if (!order) {
      return errorResponse('Order not found', 404);
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

    if (!payload || payload.role !== 'ADMIN') {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const sheetOrder = (await getGoogleSheetOrders()).find((order) => order._id === params.id || order.id === params.id);
    if (sheetOrder) {
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

      const updatedOrder = updateLocalOrder(params.id, body);
      return successResponse(updatedOrder, 'Order updated successfully');
    }

    await dbConnect();

    const order = await Order.findById(params.id);

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'status')) order.status = body.status;
    if (Object.prototype.hasOwnProperty.call(body, 'trackingId')) order.trackingId = body.trackingId;
    if (Object.prototype.hasOwnProperty.call(body, 'labelUrl')) order.labelUrl = body.labelUrl;
    if (Object.prototype.hasOwnProperty.call(body, 'productSent')) order.productSent = body.productSent;
    if (Object.prototype.hasOwnProperty.call(body, 'estimatedDeliveryDate')) {
      order.estimatedDeliveryDate = body.estimatedDeliveryDate;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'adminNotes')) order.adminNotes = body.adminNotes;
    if (Object.prototype.hasOwnProperty.call(body, 'assignedTo')) order.assignedTo = body.assignedTo;
    if (Object.prototype.hasOwnProperty.call(body, 'courier') && ['DPD', 'FEDEX'].includes(body.courier)) {
      order.courier = body.courier;
    }

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
      console.error('Google Sheet sync error (admin update):', error);
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
