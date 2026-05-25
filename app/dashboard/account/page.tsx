'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/Card';
import { useAuth } from '@/components/useAuth';

export default function AccountPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-amber-900">Account Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-amber-700">Email</label>
                <p className="font-semibold text-amber-900">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm text-amber-700">Name</label>
                <p className="font-semibold text-amber-900">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
