import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/password';
import { createToken } from '@/lib/jwt';
import { successResponse, errorResponse } from '@/lib/response';
import { createLocalUser, findLocalUserByEmail, sanitizeUser, useLocalData } from '@/lib/localData';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role = 'CUSTOMER' } = body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return errorResponse('Missing required fields', 400);
    }

    if (useLocalData) {
      if (findLocalUserByEmail(email)) {
        return errorResponse('Email already registered', 400);
      }

      const user = createLocalUser({ email, password, firstName, lastName });
      const token = createToken({
        userId: user._id,
        role: user.role,
        email: user.email,
      });

      const response = successResponse(
        {
          user: sanitizeUser(user),
          token,
        },
        'User registered successfully',
        201
      );
      response.cookies.set('token', token, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    await dbConnect();

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role: role === 'CUSTOMER' ? 'CUSTOMER' : role,
    });

    // Create token
    const token = createToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    const response = successResponse(
      {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
      'User registered successfully',
      201
    );
    response.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Register error:', error);
    return errorResponse('Registration failed', 500, error.message);
  }
}
