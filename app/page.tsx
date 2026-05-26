'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 via-amber-100 to-amber-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl bg-white border border-amber-200 rounded-3xl shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-6 sm:p-10 bg-amber-900 text-white">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">ParcelPilot</h1>
            <p className="text-amber-200 text-lg leading-relaxed">
              A professional multi-portal logistics platform for Customers, Admins, and Shipping Partners.
            </p>
          </div>
          <div className="p-6 sm:p-10 space-y-6 bg-amber-50">
            <div>
              <h2 className="text-2xl font-semibold text-amber-900 mb-2">Choose your portal</h2>
              <p className="text-amber-700">Login to the portal that matches your role.</p>
            </div>
            <div className="grid gap-4">
              <Link href="/login" className="block px-6 py-4 bg-amber-900 text-white rounded-lg text-center font-semibold hover:bg-amber-800 transition">
                Customer Portal
              </Link>
              <Link href="/admin/login" className="block px-6 py-4 bg-amber-100 text-amber-900 rounded-lg text-center font-semibold hover:bg-amber-200 transition">
                Admin Portal
              </Link>
              <Link href="/shipping/login" className="block px-6 py-4 bg-amber-100 text-amber-900 rounded-lg text-center font-semibold hover:bg-amber-200 transition">
                Shipping Partner Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
