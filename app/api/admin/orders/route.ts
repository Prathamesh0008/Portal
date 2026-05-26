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
    if (bTime !== aTime) return bTime - aTime;

    const aRow = Number((a as { sheetRowNumber?: number }).sheetRowNumber || 0);
    const bRow = Number((b as { sheetRowNumber?: number }).sheetRowNumber || 0);
    if (bRow !== aRow) return bRow - aRow;

    return 0;
  });
}

function dedupeByOrderNumber<T extends { orderNumber?: string; _id?: string; id?: string }>(orders: T[]) {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const order of orders) {
    const key = String(order.orderNumber || order._id || order.id || '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(order);
  }

  return unique;
}

function matchesUserFilter(
  order: { customerId?: string | { firstName?: string; lastName?: string; email?: string } },
  userFilter: string
) {
  if (!userFilter) return true;

  const term = userFilter.trim().toLowerCase();
  if (!term) return true;

  const customer = typeof order.customerId === 'string' ? null : order.customerId;
  if (!customer) return false;

  const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim().toLowerCase();
  const email = String(customer.email || '').toLowerCase();
  return fullName.includes(term) || email.includes(term);
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
    const user = searchParams.get('user') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const sheetOrders = filterSheetOrders(await getGoogleSheetOrders(), {
      routeType: routeType || undefined,
      courier: courier || undefined,
      status: status || undefined,
    });

    if (useLocalData) {
      const filteredOrders = dedupeByOrderNumber(sortNewestFirst([
        ...listLocalOrdersWithCustomers({
        customerId: customerId || undefined,
        routeType: routeType === 'EU_TO_EU' || routeType === 'EU_TO_US' ? routeType : undefined,
        courier: courier === 'DPD' || courier === 'FEDEX' ? courier : undefined,
        status: status || undefined,
        }),
        ...sheetOrders,
      ])).filter((order) => matchesUserFilter(order, user));
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

    const mergedOrders = dedupeByOrderNumber(sortNewestFirst([...dbOrders, ...sheetOrders]))
      .filter((order) => matchesUserFilter(order, user));
    const orders = mergedOrders.slice(skip, skip + limit);
    const total = mergedOrders.length;

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
