import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { successResponse, errorResponse, getTokenFromRequest, getPayloadFromToken } from '@/lib/response';
import { listLocalOrdersWithCustomers, useLocalData } from '@/lib/localData';
import { filterSheetOrders, getGoogleSheetOrders } from '@/lib/googleSheetsOrders';

function sortNewestFirst<T extends { createdAt?: string }>(orders: T[]) {
  return [...orders].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!payload || !['SHIPPING_DPD', 'SHIPPING_FEDEX'].includes(payload.role)) {
      return errorResponse('Unauthorized', 401);
    }

    // DPD sees only DPD orders, FedEx sees only FedEx orders
    const courier = payload.role === 'SHIPPING_DPD' ? 'DPD' : 'FEDEX';
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const sheetOrders = filterSheetOrders(await getGoogleSheetOrders(), {
      courier,
      status: status || undefined,
    });

    if (useLocalData) {
      const filteredOrders = sortNewestFirst([
        ...listLocalOrdersWithCustomers({
        courier,
        status: status || undefined,
        }),
        ...sheetOrders,
      ]);
      const skip = (page - 1) * limit;
      const orders = filteredOrders.slice(skip, skip + limit);

      return successResponse(
        {
          orders,
          pagination: {
            page,
            limit,
            total: filteredOrders.length,
            pages: Math.ceil(filteredOrders.length / limit),
          },
        },
        'Orders retrieved successfully'
      );
    }

    await dbConnect();

    const filter: any = { courier };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const dbOrders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('customerId', 'firstName lastName email phone');

    const dbTotal = await Order.countDocuments(filter);
    const mergedOrders = sortNewestFirst([...dbOrders, ...sheetOrders]);
    const orders = mergedOrders.slice(skip, skip + limit);
    const total = dbTotal + sheetOrders.length;

    return successResponse(
      {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      'Orders retrieved successfully'
    );
  } catch (error: any) {
    console.error('Shipping orders retrieval error:', error);
    return errorResponse('Failed to retrieve orders', 500, error.message);
  }
}
