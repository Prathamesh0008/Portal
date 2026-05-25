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

    const { status, trackingId, labelUrl, estimatedDeliveryDate, adminNotes, assignedTo, courier, productSent } = body;

    if (status) order.status = status;
    if (trackingId) order.trackingId = trackingId;
    if (labelUrl) order.labelUrl = labelUrl;
    if (productSent) order.productSent = productSent;
    if (estimatedDeliveryDate) order.estimatedDeliveryDate = estimatedDeliveryDate;
    if (adminNotes) order.adminNotes = adminNotes;
    if (assignedTo) order.assignedTo = assignedTo;
    if (courier && ['DPD', 'FEDEX'].includes(courier)) {
      order.courier = courier;
    }

    await order.save();

    return successResponse(order, 'Order updated successfully');
  } catch (error: any) {
    console.error('Order update error:', error);
    return errorResponse(error.message || 'Failed to update order', 500);
  }
}
