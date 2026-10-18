import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { OrderManagementDashboard } from '@/components/admin/OrderManagementDashboard';

export const metadata = {
  title: 'لوحة التحكم | نظام إدارة الطلبات',
  description: 'نظام شامل لإدارة طلبات الحجز والعملاء',
};

export default async function AdminDashboardPage() {
  const supabase = await createServerClient();
  await requireStaff(supabase);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<DashboardSkeleton />}>
        <OrderManagementDashboard />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-muted rounded-lg" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="h-96 bg-muted rounded-lg" />
    </div>
  );
}
