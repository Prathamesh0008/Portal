import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Recipient from '@/models/Recipient';
import { createLocalRecipient, listLocalRecipients, useLocalData } from '@/lib/localData';
import { errorResponse, getPayloadFromToken, getTokenFromRequest, successResponse } from '@/lib/response';

function dedupeRecipients<T extends { email?: string; address?: string; postalCode?: string; houseNumber?: string }>(items: T[]) {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const item of items) {
    const key = `${String(item.email || '').toLowerCase()}|${String(item.address || '').toLowerCase()}|${String(item.postalCode || '').toLowerCase()}|${String(item.houseNumber || '').toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!payload || payload.role !== 'CUSTOMER') {
      return errorResponse('Unauthorized', 401);
    }

    if (!mongoose.Types.ObjectId.isValid(payload.userId)) {
      return errorResponse('Unauthorized', 401);
    }

    if (useLocalData) {
      return successResponse(listLocalRecipients(payload.userId), 'Recipients retrieved successfully');
    }

    await dbConnect();
    const recipients = await Recipient.find({ customerId: payload.userId }).sort({ createdAt: -1 });
    return successResponse(dedupeRecipients(recipients), 'Recipients retrieved successfully');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve recipients';
    return errorResponse('Failed to retrieve recipients', 500, message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!payload || payload.role !== 'CUSTOMER') {
      return errorResponse('Unauthorized', 401);
    }

    if (!mongoose.Types.ObjectId.isValid(payload.userId)) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { firstName, lastName, country, city, postalCode, address, email, phone } = body;

    if (!firstName || !lastName || !country || !city || !postalCode || !address || !email || !phone) {
      return errorResponse('Missing required recipient fields', 400);
    }

    if (useLocalData) {
      const recipient = createLocalRecipient(payload.userId, body);
      return successResponse(recipient, 'Recipient saved successfully', 201);
    }

    await dbConnect();
    const recipient = await Recipient.findOneAndUpdate(
      {
        customerId: payload.userId,
        email: String(email).toLowerCase(),
        address: String(address).trim(),
        postalCode: String(postalCode).trim(),
        houseNumber: String(body.houseNumber || '').trim(),
      },
      {
        $set: {
          customerId: payload.userId,
          ...body,
          email: String(email).toLowerCase(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return successResponse(recipient, 'Recipient saved successfully', 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save recipient';
    return errorResponse('Failed to save recipient', 500, message);
  }
}
