'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/useAuth';

export default function ShippingLoginPage() {
  return (
    <Suspense fallback={null}>
      <ShippingLoginForm />
    </Suspense>
  );
}

function ShippingLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/shipping';

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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">ParcelPilot</h1>
          <p className="text-amber-700">Shipping Partner Portal</p>
        </div>

        <div className="bg-white rounded-lg border-2 border-amber-200 p-6 sm:p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-amber-900 mb-6">Shipping Login</h2>

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
                className="w-full px-4 py-2 border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                placeholder="shipping@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-amber-200 rounded focus:outline-none focus:border-amber-400"
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
        </div>
      </div>
    </div>
  );
}
