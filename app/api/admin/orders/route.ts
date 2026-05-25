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

    if (!payload || payload.role !== 'ADMIN') {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const routeType = searchParams.get('routeType');
    const courier = searchParams.get('courier');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const sheetOrders = filterSheetOrders(await getGoogleSheetOrders(), {
      routeType: routeType || undefined,
      courier: courier || undefined,
      status: status || undefined,
    });

    if (useLocalData) {
      const filteredOrders = sortNewestFirst([
        ...listLocalOrdersWithCustomers({
        customerId: customerId || undefined,
        routeType: routeType === 'EU_TO_EU' || routeType === 'EU_TO_US' ? routeType : undefined,
        courier: courier === 'DPD' || courier === 'FEDEX' ? courier : undefined,
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

    // Build filter
    const filter: any = {};
    if (customerId) filter.customerId = customerId;
    if (routeType) filter.routeType = routeType;
    if (courier) filter.courier = courier;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const dbOrders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('customerId', 'firstName lastName email');

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
    console.error('Admin orders retrieval error:', error);
    return errorResponse('Failed to retrieve orders', 500, error.message);
  }
}
