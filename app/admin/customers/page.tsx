'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import PortalNav from '@/components/PortalNav';

type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/users');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to fetch customers');
        }

        setCustomers(data.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load customers');
      } finally {
        setIsLoading(false);
      }
    }

    loadCustomers();
  }, []);

  return (
    <div className="min-h-screen bg-amber-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PortalNav title="Customers" subtitle="Customer directory" homeHref="/admin" backHref="/admin" />
        <Card>
          <CardHeader>
            <CardTitle>Customer Directory</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-amber-700">Loading customers...</p>
            ) : error ? (
              <p className="text-rose-600">{error}</p>
            ) : customers.length === 0 ? (
              <p className="text-amber-700">No customers found.</p>
            ) : (
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div key={customer.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="font-semibold text-amber-900">{customer.firstName} {customer.lastName}</p>
                    <p className="text-amber-700">{customer.email}</p>
                    <p className="text-xs uppercase tracking-wide text-amber-500">{customer.role}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
