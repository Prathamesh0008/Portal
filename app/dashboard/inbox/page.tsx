'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/Card';

export default function InboxPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-amber-900">Inbox</h1>
        <Card>
          <CardContent>
            <p className="text-amber-700">Inbox coming soon</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
