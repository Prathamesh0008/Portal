'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

interface PortalNavProps {
  title: string;
  subtitle?: string;
  homeHref: string;
  backHref?: string;
}

export default function PortalNav({ title, subtitle, homeHref, backHref }: PortalNavProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
      return;
    }

    router.back();
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-amber-900">{title}</h1>
        {subtitle && <p className="text-amber-700 mt-2">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 rounded border border-amber-300 bg-white text-amber-900 hover:bg-amber-100 transition"
        >
          Back
        </button>
        <Link
          href={homeHref}
          className="px-4 py-2 rounded border border-amber-300 bg-white text-amber-900 hover:bg-amber-100 transition"
        >
          Home
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2 rounded bg-red-100 text-red-900 hover:bg-red-200 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
