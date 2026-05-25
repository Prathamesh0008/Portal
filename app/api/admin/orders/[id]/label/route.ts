import { NextRequest } from 'next/server';
import { errorResponse, getPayloadFromToken, getTokenFromRequest, successResponse } from '@/lib/response';
import { uploadLabelToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!payload || payload.role !== 'ADMIN') {
      return errorResponse('Unauthorized', 401);
    }

    const form = await request.formData();
    const fileValue = form.get('file');
    if (!(fileValue instanceof File)) {
      return errorResponse('Label file is required', 400);
    }

    const url = await uploadLabelToCloudinary(fileValue);
    return successResponse({ labelUrl: url }, 'Label uploaded successfully');
  } catch (error: any) {
    console.error('Label upload error:', error);
    return errorResponse(error.message || 'Failed to upload label', 500);
  }
}
