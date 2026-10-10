'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  travel_requests: { count: number }[];
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function CRMCustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const response = await fetch(`/api/crm/customers?page=${page}&limit=20&search=${search}`);
      const result = await response.json();
      if (result.success) {
        setCustomers(result.data.customers);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  if (loading && customers.length === 0) {
    return <div className="p-8 text-center">Loading customers...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Directory</CardTitle>
        <div className="flex items-center gap-2 mt-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
          
          {customers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No customers found
            </div>
          )}
          
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerCard({ customer }: { customer: any }) {
  const bookingCount = customer.booking_count || 0;
  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'N/A';
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex-1">
        <div className="font-semibold">{fullName}</div>
        <div className="text-sm text-muted-foreground">{customer.email}</div>
        {customer.phone && (
          <div className="text-sm text-muted-foreground">{customer.phone}</div>
        )}
        <div className="text-xs text-muted-foreground mt-1">
          Joined: {new Date(customer.created_at).toLocaleDateString()}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Badge variant="secondary">
          {bookingCount} booking{bookingCount !== 1 ? 's' : ''}
        </Badge>
        
        <Link href={`/admin/crm/customer/${customer.id}`}>
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
