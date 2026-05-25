import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { successResponse, errorResponse, getTokenFromRequest, getPayloadFromToken } from '@/lib/response';
import { listLocalCustomers, useLocalData } from '@/lib/localData';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!payload || payload.role !== 'ADMIN') {
      return errorResponse('Unauthorized', 401);
    }

    if (useLocalData) {
      return successResponse(listLocalCustomers(), 'Customers retrieved successfully');
    }

    await dbConnect();

    const users = await User.find({ role: 'CUSTOMER' }).select('-password').sort({ createdAt: -1 });
    return successResponse(users, 'Customers retrieved successfully');
  } catch (error: any) {
    console.error('Customer list error:', error);
    return errorResponse('Failed to retrieve customers', 500, error.message);
  }
}
