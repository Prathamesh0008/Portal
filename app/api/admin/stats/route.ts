import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import { successResponse, errorResponse, getTokenFromRequest, getPayloadFromToken } from '@/lib/response';
import { getLocalAdminStats, useLocalData } from '@/lib/localData';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!payload || payload.role !== 'ADMIN') {
      return errorResponse('Unauthorized', 401);
    }

    if (useLocalData) {
      return successResponse(getLocalAdminStats(), 'Dashboard stats retrieved successfully');
    }

    await dbConnect();

    const stats = {
      totalOrders: await Order.countDocuments(),
      pendingOrders: await Order.countDocuments({ status: 'PENDING' }),
      dpdOrders: await Order.countDocuments({ courier: 'DPD' }),
      fedexOrders: await Order.countDocuments({ courier: 'FEDEX' }),
      deliveredOrders: await Order.countDocuments({ status: 'DELIVERED' }),
      totalCustomers: await User.countDocuments({ role: 'CUSTOMER' }),
      totalShippingPartners: await User.countDocuments({
        role: { $in: ['SHIPPING_DPD', 'SHIPPING_FEDEX'] },
      }),
    };

    return successResponse(stats, 'Dashboard stats retrieved successfully');
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return errorResponse('Failed to retrieve stats', 500, error.message);
  }
}
