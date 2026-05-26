import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable');
}

const JWT_SECRET: Secret = process.env.JWT_SECRET;

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export function createToken(
  payload: TokenPayload,
  expiresIn: SignOptions['expiresIn'] = '7d'
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}
