import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { comparePassword } from '@/lib/password';
import { createToken } from '@/lib/jwt';
import { successResponse, errorResponse } from '@/lib/response';
import { findLocalUserByEmail, sanitizeUser, useLocalData } from '@/lib/localData';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return errorResponse('Email and password required', 400);
    }

    if (useLocalData) {
      const user = findLocalUserByEmail(email);
      if (!user || user.password !== password) {
        return errorResponse('Invalid credentials', 401);
      }

      if (!user.isActive) {
        return errorResponse('User account is inactive', 403);
      }

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
        'Login successful'
      );
      response.cookies.set('token', token, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    await dbConnect();

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return errorResponse('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse('User account is inactive', 403);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

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
      'Login successful'
    );
    response.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return errorResponse('Login failed', 500, error.message);
  }
}
