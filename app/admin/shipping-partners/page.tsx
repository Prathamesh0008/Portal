'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import PortalNav from '@/components/PortalNav';
export default function ShippingPartnersPage() {
  return (
    <div className="min-h-screen bg-amber-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PortalNav title="Shipping Partners" subtitle="Manage shipping partner access" homeHref="/admin" backHref="/admin" />
        <Card>
          <CardContent>
            <p className="text-amber-700">Shipping partner management coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
