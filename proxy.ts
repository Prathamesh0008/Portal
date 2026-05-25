import { NextRequest, NextResponse } from 'next/server';

interface TokenPayload {
  userId: string;
  role: string;
  email: string;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'kva_logistics_secret_key';

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function base64UrlToText(value: string) {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return null;
  }

  try {
    const header = JSON.parse(base64UrlToText(encodedHeader));
    if (header.alg !== 'HS256') {
      return null;
    }

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToBytes(encodedSignature),
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    );

    if (!isValid) {
      return null;
    }

    const payload = JSON.parse(base64UrlToText(encodedPayload)) as TokenPayload;
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function redirectToLogin(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL(`/admin/login?redirect=${encodeURIComponent(pathname)}`, request.url));
  }

  if (pathname.startsWith('/shipping')) {
    return NextResponse.redirect(new URL(`/shipping/login?redirect=${encodeURIComponent(pathname)}`, request.url));
  }

  return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const publicRoutes = ['/login', '/register', '/admin/login', '/shipping/login'];
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  const token =
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.cookies.get('token')?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return redirectToLogin(request);
  }

  if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/shipping') && !['SHIPPING_DPD', 'SHIPPING_FEDEX'].includes(payload.role)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/dashboard') && payload.role !== 'CUSTOMER') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-email', payload.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/shipping/:path*', '/api/:path*'],
};
