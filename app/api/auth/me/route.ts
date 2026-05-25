import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { errorResponse, getPayloadFromToken, getTokenFromRequest, successResponse } from '@/lib/response';
import { findLocalUserById, sanitizeUser, useLocalData } from '@/lib/localData';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!token || !payload) {
      return errorResponse('Unauthorized', 401);
    }

    if (useLocalData) {
      const user = findLocalUserById(payload.userId);

      if (!user || !user.isActive) {
        return errorResponse('Unauthorized', 401);
      }

      return successResponse(
        {
          user: sanitizeUser(user),
          token,
        },
        'Session restored'
      );
    }

    await dbConnect();

    const user = await User.findById(payload.userId).select('-password');
    if (!user || !user.isActive) {
      return errorResponse('Unauthorized', 401);
    }

    return successResponse(
      {
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
      'Session restored'
    );
  } catch (error: any) {
    console.error('Session restore error:', error);
    return errorResponse('Failed to restore session', 500, error.message);
  }
}
