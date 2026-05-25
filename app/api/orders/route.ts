import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import { successResponse, errorResponse, getTokenFromRequest, getPayloadFromToken } from '@/lib/response';
import { createLocalOrder, createLocalRecipient, findLocalUserById, listLocalOrders, useLocalData } from '@/lib/localData';
import Recipient from '@/models/Recipient';
import { appendGoogleSheetOrders, filterSheetOrders, getGoogleSheetOrders } from '@/lib/googleSheetsOrders';

const productDefaults = {
  weight: 1,
  length: 10,
  width: 10,
  height: 10,
  parcelCount: 1,
};

function normalizeParcels(body: any) {
  const source = Array.isArray(body.parcels) && body.parcels.length > 0 ? body.parcels : [body];
  return source.map((parcel: any) => ({
    ...body,
    ...parcel,
    routeType: parcel.routeType || body.routeType,
    quantity: Number(parcel.quantity || body.quantity || 1),
    weight: Number(parcel.weight || body.weight || productDefaults.weight),
    length: Number(parcel.length || body.length || productDefaults.length),
    width: Number(parcel.width || body.width || productDefaults.width),
    height: Number(parcel.height || body.height || productDefaults.height),
    parcelCount: Number(parcel.parcelCount || body.parcelCount || productDefaults.parcelCount),
  }));
}

function validateParcel(parcel: any) {
  const requiredFields = [
    'receiverFirstName',
    'receiverLastName',
    'receiverCountry',
    'routeType',
    'receiverPostalCode',
    'receiverCity',
    'receiverAddress',
    'receiverHouseNumber',
    'receiverEmail',
    'productName',
  ];

  return requiredFields.every((field) => String(parcel[field] || '').trim());
}

function sortNewestFirst<T extends { createdAt?: string }>(orders: T[]) {
  return [...orders].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

async function appendOrdersToSheet(orders: Array<Record<string, any>>, customerName: string) {
  try {
    await appendGoogleSheetOrders(orders, { customerName });
    return null;
  } catch (error: any) {
    console.error('Google Sheet append failed:', error);
    return error?.message || 'Google Sheet append failed';
  }
}

function localCustomerName(userId: string, fallback: string) {
  const user = findLocalUserById(userId);
  if (!user) return fallback;
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  return fullName || user.company || fallback;
}

async function databaseCustomerName(userId: string, fallback: string) {
  const user = await User.findById(userId).select('firstName lastName company email');
  if (!user) return fallback;

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return fullName || user.company || user.email || fallback;
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!payload || payload.role !== 'CUSTOMER') {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();

    const parcels = normalizeParcels(body);

    if (!parcels.every(validateParcel)) {
      return errorResponse('Please complete recipient and product details for every parcel', 400);
    }

    if (useLocalData) {
      if (parcels.some((parcel: any) => !['EU_TO_EU', 'EU_TO_US'].includes(parcel.routeType))) {
        return errorResponse('Invalid route type', 400);
      }

      const orders = parcels.map((parcel: any) => {
        if (body.saveRecipient) {
          createLocalRecipient(payload.userId, {
            firstName: parcel.receiverFirstName,
            lastName: parcel.receiverLastName,
            company: parcel.receiverCompany,
            country: parcel.receiverCountry,
            city: parcel.receiverCity,
            postalCode: parcel.receiverPostalCode,
            address: parcel.receiverAddress,
            houseNumber: parcel.receiverHouseNumber,
            email: parcel.receiverEmail,
            phone: parcel.receiverPhone,
          });
        }

        return createLocalOrder(payload.userId, {
          ...parcel,
          routeType: parcel.routeType,
          saveRecipient: body.saveRecipient,
        });
      });

      const sheetSyncError = await appendOrdersToSheet(orders, localCustomerName(payload.userId, payload.email));

      return successResponse(
        { orders, count: orders.length, _id: orders[0]?._id, sheetSynced: !sheetSyncError, sheetSyncError },
        sheetSyncError
          ? `Order created, but Google Sheet sync failed: ${sheetSyncError}`
          : orders.length > 1
            ? 'Orders created successfully'
            : 'Order created successfully',
        201
      );
    }

    await dbConnect();

    const {
      routeType,
      senderFirstName,
      senderLastName,
      senderCompany,
      senderCountry,
      senderCity,
      senderPostalCode,
      senderAddress,
      senderHouseNumber,
      senderAddition,
      senderExtraInfo,
      senderEmail,
      senderCountryCode,
      senderPhone,
      senderReference,
      receiverFirstName,
      receiverLastName,
      receiverCompany,
      receiverCountry,
      receiverCity,
      receiverPostalCode,
      receiverAddress,
      receiverHouseNumber,
      receiverAddition,
      receiverExtraInfo,
      receiverEmail,
      receiverCountryCode,
      receiverPhone,
      receiverReference,
      productName,
      quantity,
      weight,
      length,
      width,
      height,
      parcelCount,
      notes,
    } = body;

    // Validate required fields
    if (parcels.some((parcel: any) => !parcel.routeType)) {
      return errorResponse('Route type is required', 400);
    }

    if (parcels.some((parcel: any) => !['EU_TO_EU', 'EU_TO_US'].includes(parcel.routeType))) {
      return errorResponse('Invalid route type', 400);
    }

    const orders = [];
    for (const parcel of parcels) {
      const parcelRouteType = parcel.routeType;
      const courier = parcelRouteType === 'EU_TO_EU' ? 'DPD' : 'FEDEX';
      const order = await Order.create({
        customerId: payload.userId,
        routeType: parcelRouteType,
        courier,
        senderFirstName,
        senderLastName,
        senderCompany,
        senderCountry,
        senderCity,
        senderPostalCode,
        senderAddress,
        senderHouseNumber,
        senderAddition,
        senderExtraInfo,
        senderEmail,
        senderCountryCode,
        senderPhone,
        senderReference,
        receiverFirstName: parcel.receiverFirstName,
        receiverLastName: parcel.receiverLastName,
        receiverCompany: parcel.receiverCompany,
        receiverCountry: parcel.receiverCountry,
        receiverCity: parcel.receiverCity,
        receiverPostalCode: parcel.receiverPostalCode,
        receiverAddress: parcel.receiverAddress,
        receiverHouseNumber: parcel.receiverHouseNumber,
        receiverAddition: parcel.receiverAddition,
        receiverExtraInfo: parcel.receiverExtraInfo,
        receiverEmail: parcel.receiverEmail,
        receiverCountryCode: parcel.receiverCountryCode,
        receiverPhone: parcel.receiverPhone,
        receiverReference: parcel.receiverReference,
        productName: parcel.productName,
        quantity: parcel.quantity,
        weight: parcel.weight,
        length: parcel.length,
        width: parcel.width,
        height: parcel.height,
        parcelCount: parcel.parcelCount,
        notes: parcel.notes,
      });
      orders.push(order);
    }

    if (body.saveRecipient) {
      await Promise.all(
        parcels.map((parcel: any) =>
          Recipient.create({
            customerId: payload.userId,
            firstName: parcel.receiverFirstName,
            lastName: parcel.receiverLastName,
            company: parcel.receiverCompany,
            country: parcel.receiverCountry,
            city: parcel.receiverCity,
            postalCode: parcel.receiverPostalCode,
            address: parcel.receiverAddress,
            houseNumber: parcel.receiverHouseNumber,
            email: parcel.receiverEmail,
            phone: parcel.receiverPhone,
          })
        )
      );
    }

    const customerName = await databaseCustomerName(payload.userId, payload.email);
    const sheetSyncError = await appendOrdersToSheet(orders, customerName);

    return successResponse(
      { orders, count: orders.length, _id: orders[0]?._id, sheetSynced: !sheetSyncError, sheetSyncError },
      sheetSyncError
        ? `Order created, but Google Sheet sync failed: ${sheetSyncError}`
        : orders.length > 1
          ? 'Orders created successfully'
          : 'Order created successfully',
      201
    );
  } catch (error: any) {
    console.error('Order creation error:', error);
    return errorResponse('Failed to create order', 500, error.message);
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!payload || payload.role !== 'CUSTOMER') {
      return errorResponse('Unauthorized', 401);
    }

    const sheetOrders = await getGoogleSheetOrders();
    const customerSheetOrders = filterSheetOrders(sheetOrders, { customerEmail: payload.email });

    if (useLocalData) {
      const localOrders = listLocalOrders({ customerId: payload.userId });
      return successResponse(sortNewestFirst([...localOrders, ...customerSheetOrders]), 'Orders retrieved successfully');
    }

    await dbConnect();

    const orders = await Order.find({ customerId: payload.userId }).sort({ createdAt: -1 });

    return successResponse(sortNewestFirst([...orders, ...customerSheetOrders]), 'Orders retrieved successfully');
  } catch (error: any) {
    console.error('Order retrieval error:', error);
    return errorResponse('Failed to retrieve orders', 500, error.message);
  }
}
