'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/useAuth';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('customer@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push(redirect);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 to-amber-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">ParcelPilot</h1>
          <p className="text-amber-700">Customer Portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg border-2 border-amber-200 p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-amber-900 mb-6">Login</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-amber-200 rounded focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-amber-200 rounded focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                placeholder="********"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-900 text-white py-2 rounded font-medium hover:bg-amber-800 disabled:opacity-50 transition"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-amber-700 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-amber-900 hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 bg-amber-100 border border-amber-300 rounded-lg p-4 text-sm text-amber-900">
          <p className="font-semibold mb-2">Demo Credentials:</p>
          <p>Email: customer@example.com</p>
          <p>Password: password123</p>
        </div>
      </div>
    </div>
  );
}
