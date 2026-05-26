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

export default function PortalNav({ title, subtitle, homeHref }: PortalNavProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-900">{title}</h1>
        {subtitle && <p className="text-amber-700 mt-2">{subtitle}</p>}
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
        <Link
          href={homeHref}
          className="w-full sm:w-auto px-4 py-2 rounded border border-amber-300 bg-white text-amber-900 hover:bg-amber-100 transition text-center"
        >
          Home
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full sm:w-auto px-4 py-2 rounded bg-red-100 text-red-900 hover:bg-red-200 transition text-center"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
