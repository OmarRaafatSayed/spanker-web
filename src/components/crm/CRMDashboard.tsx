'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { CRMCustomerList } from './CRMCustomerList';
import { CRMBookingsList } from './CRMBookingsList';

interface DashboardStats {
  totalCustomers: number;
  newCustomers: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
}

interface BookingsByVertical {
  flight: number;
  hotel: number;
  visa: number;
  trip: number;
}

interface DashboardData {
  stats: DashboardStats;
  bookingsByVertical: BookingsByVertical;
  recentBookings: any[];
}

export function CRMDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState<'customers' | 'bookings'>('customers');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const response = await fetch(`/api/crm/dashboard?period=${period}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={data.stats.totalCustomers}
          subtitle={`+${data.stats.newCustomers} this period`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Total Bookings"
          value={data.stats.totalBookings}
          subtitle="All time"
          icon={<BookOpen className="h-4 w-4" />}
        />
        <StatCard
          title="Pending Bookings"
          value={data.stats.pendingBookings}
          subtitle="Awaiting confirmation"
          icon={<Clock className="h-4 w-4" />}
          variant="warning"
        />
        <StatCard
          title="Confirmed Bookings"
          value={data.stats.confirmedBookings}
          subtitle="Completed"
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant="success"
        />
      </div>

      {/* Revenue Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue (Last {period} days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            ${data.stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      {/* Bookings by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings by Type (Last {period} days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TypeCard type="Flights" count={data.bookingsByVertical.flight} />
            <TypeCard type="Hotels" count={data.bookingsByVertical.hotel} />
            <TypeCard type="Visas" count={data.bookingsByVertical.visa} />
            <TypeCard type="Trips" count={data.bookingsByVertical.trip} />
          </div>
        </CardContent>
      </Card>

      {/* Simple Tabs */}
      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'customers' ? 'default' : 'outline'}
              onClick={() => setActiveTab('customers')}
            >
              Customers
            </Button>
            <Button
              variant={activeTab === 'bookings' ? 'default' : 'outline'}
              onClick={() => setActiveTab('bookings')}
            >
              Recent Bookings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'customers' && <CRMCustomerList />}
          {activeTab === 'bookings' && <CRMBookingsList bookings={data.recentBookings} />}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'success';
}) {
  const variantStyles = {
    default: 'text-blue-600',
    warning: 'text-orange-600',
    success: 'text-green-600',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={variantStyles[variant]}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function TypeCard({ type, count }: { type: string; count: number }) {
  return (
    <div className="text-center p-4 border rounded-lg">
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-sm text-muted-foreground">{type}</div>
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
