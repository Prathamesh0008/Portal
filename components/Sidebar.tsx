'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from './useAuth';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'DB' },
  { label: 'New Order', href: '/dashboard/new-order', icon: '+' },
  { label: 'Your Orders', href: '/dashboard/orders', icon: '#' },
  { label: 'Recipients', href: '/dashboard/recipients', icon: '@' },
  { label: 'Inbox', href: '/dashboard/inbox', icon: 'IN' },
  { label: 'Support', href: '/dashboard/support', icon: '?' },
  { label: 'Account', href: '/dashboard/account', icon: '*' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 inline-flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-900 rounded border border-amber-200"
          aria-label="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <span>Menu</span>
        </button>
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-amber-50 text-amber-900 border-r border-amber-200 p-6 flex flex-col transition-transform md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } z-40 md:z-auto`}
      >
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 inline-flex items-center justify-center h-9 w-9 rounded border border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
          aria-label="Close menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mb-8 pb-6 border-b border-amber-200">
          <Image
            src="/parcelpilot-logo.svg"
            alt="ParcelPilot"
            width={220}
            height={56}
            className="h-14 w-auto"
            priority
          />
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
              <span className="flex items-center gap-3 px-4 py-3 rounded hover:bg-amber-100 text-amber-900 transition">
                <span className="w-6 text-xs font-bold text-amber-700">{item.icon}</span>
                <span>{item.label}</span>
              </span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-amber-200 pt-4">
          <div className="bg-white text-amber-900 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-900 text-white flex items-center justify-center">
                {user?.firstName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-amber-900 text-sm">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-amber-700">{user?.email}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded bg-red-100 text-red-900 hover:bg-red-200 font-medium text-sm"
          >
            <span>Exit</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
