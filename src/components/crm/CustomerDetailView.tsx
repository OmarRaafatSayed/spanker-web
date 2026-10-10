'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import { CRMBookingsList } from './CRMBookingsList';

interface CustomerData {
  customer: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    created_at: string;
    role: string;
  };
  bookings: any[];
  communications: any[];
  documents: any[];
}

export function CustomerDetailView({ customerId }: { customerId: string }) {
  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  async function fetchCustomerData() {
    setLoading(true);
    try {
      const response = await fetch(`/api/crm/customer/${customerId}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return <div className="p-8 text-center">Loading customer details...</div>;
  }

  const { customer, bookings, communications, documents } = data;
  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'N/A';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/crm">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CRM
          </Button>
        </Link>
      </div>

      {/* Customer Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Profile
            </CardTitle>
            <Badge variant="secondary">{customer.role}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <InfoItem icon={<User />} label="Name" value={fullName} />
            <InfoItem icon={<Mail />} label="Email" value={customer.email} />
            {customer.phone && (
              <InfoItem icon={<Phone />} label="Phone" value={customer.phone} />
            )}
            <InfoItem
              icon={<Calendar />}
              label="Member Since"
              value={new Date(customer.created_at).toLocaleDateString()}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard title="Total Bookings" value={bookings.length} />
        <StatCard title="Communications" value={communications.length} />
        <StatCard title="Documents" value={documents.length} />
      </div>

      {/* Bookings */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Booking History</h2>
        <CRMBookingsList bookings={bookings} />
      </div>

      {/* Communications */}
      {communications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Communications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {communications.slice(0, 5).map((comm: any) => (
                <div key={comm.id} className="border-l-2 border-primary pl-4 py-2">
                  <div className="text-sm font-medium">{comm.subject || 'No subject'}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(comm.sent_at).toLocaleString()} • {comm.channel}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium">{doc.document_type}</div>
                    <div className="text-xs text-muted-foreground">
                      Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={doc.verification_status === 'verified' ? 'default' : 'secondary'}>
                    {doc.verification_status || 'pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-1">{icon}</div>
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
