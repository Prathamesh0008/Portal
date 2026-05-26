import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { errorResponse, getPayloadFromToken, getTokenFromRequest } from '@/lib/response';
import { filterSheetOrders, getGoogleSheetOrders } from '@/lib/googleSheetsOrders';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function toSafeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_');
}

function isPdfContent(contentType: string, url: string) {
  return contentType.toLowerCase().includes('application/pdf') || /\.pdf($|\?)/i.test(url);
}

function isJpeg(contentType: string, url: string) {
  const type = contentType.toLowerCase();
  return type.includes('image/jpeg') || type.includes('image/jpg') || /\.(jpe?g)($|\?)/i.test(url);
}

function isPng(contentType: string, url: string) {
  const type = contentType.toLowerCase();
  return type.includes('image/png') || /\.png($|\?)/i.test(url);
}

async function imageToPdf(imageBytes: Uint8Array, type: 'jpeg' | 'png') {
  const pdfDoc = await PDFDocument.create();
  const image =
    type === 'jpeg' ? await pdfDoc.embedJpg(imageBytes) : await pdfDoc.embedPng(imageBytes);

  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  return pdfDoc.save();
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token ? getPayloadFromToken(token) : null;

    if (!payload || payload.role !== 'CUSTOMER') {
      return errorResponse('Unauthorized', 401);
    }

    const params = await context.params;
    const orderId = params.id;
    let labelUrl = '';
    let orderNumber = 'label';

    await dbConnect();
    const dbOrder = await Order.findOne({ _id: orderId, customerId: payload.userId }).select(
      'labelUrl orderNumber'
    );

    if (dbOrder) {
      labelUrl = String(dbOrder.labelUrl || '');
      orderNumber = String(dbOrder.orderNumber || 'label');
    } else {
      const sheetOrders = await getGoogleSheetOrders();
      const customerSheetOrders = filterSheetOrders(sheetOrders, { customerEmail: payload.email });
      const sheetOrder = customerSheetOrders.find((order) => order._id === orderId || order.id === orderId);

      if (!sheetOrder) {
        return errorResponse('Order not found', 404);
      }

      labelUrl = String(sheetOrder.labelUrl || '');
      orderNumber = String(sheetOrder.orderNumber || 'label');
    }

    if (!labelUrl) {
      return errorResponse('Label is not available for this order', 404);
    }

    const upstream = await fetch(labelUrl, { cache: 'no-store' });
    if (!upstream.ok) {
      return errorResponse(`Failed to fetch label file (${upstream.status})`, 502);
    }

    const contentType = upstream.headers.get('content-type') || '';
    const bytes = new Uint8Array(await upstream.arrayBuffer());
    const filename = `${toSafeFileName(orderNumber)}-label.pdf`;

    if (isPdfContent(contentType, labelUrl)) {
      return new NextResponse(bytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=\"${filename}\"`,
        },
      });
    }

    if (isJpeg(contentType, labelUrl) || isPng(contentType, labelUrl)) {
      const pdfBytes = await imageToPdf(bytes, isJpeg(contentType, labelUrl) ? 'jpeg' : 'png');
      return new NextResponse(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=\"${filename}\"`,
        },
      });
    }

    return errorResponse('Unsupported label format. Please upload PDF, PNG, or JPG.', 400);
  } catch (error: any) {
    console.error('Label PDF download error:', error);
    return errorResponse('Failed to download label as PDF', 500, error?.message);
  }
}
