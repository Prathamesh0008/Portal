import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from './jwt';

export function successResponse<T>(data: T, message: string = 'Success', status: number = 200) {
  return NextResponse.json(
    { success: true, message, data },
    { status }
  );
}

export function errorResponse(message: string, status: number = 400, errors?: any) {
  return NextResponse.json(
    { success: false, message, errors },
    { status }
  );
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const tokenCookie = request.cookies.get('token')?.value;
  if (tokenCookie) {
    return tokenCookie;
  }

  return null;
}

export function getPayloadFromToken(token: string): TokenPayload | null {
  return verifyToken(token);
}
