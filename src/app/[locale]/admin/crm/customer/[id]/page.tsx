import { Suspense } from 'react';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { CustomerDetailView } from '@/components/crm/CustomerDetailView';

export const metadata = {
  title: 'Customer Details | CRM',
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const supabase = await createServerClient();
  await requireStaff(supabase);
  
  const { id } = await params;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<LoadingSkeleton />}>
        <CustomerDetailView customerId={id} />
      </Suspense>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 bg-muted animate-pulse rounded-lg" />
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}
