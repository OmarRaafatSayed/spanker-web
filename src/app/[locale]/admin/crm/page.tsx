import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { CRMDashboard } from '@/components/crm/CRMDashboard';

export const metadata = {
  title: 'CRM Dashboard | Admin',
  description: 'Customer relationship management dashboard',
};

export default async function CRMPage() {
  const supabase = await createServerClient();
  await requireStaff(supabase);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">CRM Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage customers, bookings, and relationships
        </p>
      </div>
      
      <Suspense fallback={<DashboardSkeleton />}>
        <CRMDashboard />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}
