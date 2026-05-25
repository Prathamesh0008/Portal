import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Recipient from '@/models/Recipient';
import { deleteLocalRecipient, updateLocalRecipient, useLocalData } from '@/lib/localData';
import { errorResponse, getPayloadFromToken, getTokenFromRequest, successResponse } from '@/lib/response';

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!payload || payload.role !== 'CUSTOMER') {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await context.params;
    const body = await request.json();

    if (useLocalData) {
      const recipient = updateLocalRecipient(payload.userId, id, body);
      if (!recipient) {
        return errorResponse('Recipient not found', 404);
      }

      return successResponse(recipient, 'Recipient updated successfully');
    }

    await dbConnect();
    const recipient = await Recipient.findOneAndUpdate(
      { _id: id, customerId: payload.userId },
      body,
      { new: true }
    );

    if (!recipient) {
      return errorResponse('Recipient not found', 404);
    }

    return successResponse(recipient, 'Recipient updated successfully');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update recipient';
    return errorResponse('Failed to update recipient', 500, message);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const token = getTokenFromRequest(_request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!payload || payload.role !== 'CUSTOMER') {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await context.params;

    if (useLocalData) {
      const deleted = deleteLocalRecipient(payload.userId, id);
      if (!deleted) {
        return errorResponse('Recipient not found', 404);
      }

      return successResponse({ id }, 'Recipient deleted successfully');
    }

    await dbConnect();
    const recipient = await Recipient.findOneAndDelete({ _id: id, customerId: payload.userId });

    if (!recipient) {
      return errorResponse('Recipient not found', 404);
    }

    return successResponse({ id }, 'Recipient deleted successfully');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete recipient';
    return errorResponse('Failed to delete recipient', 500, message);
  }
}
