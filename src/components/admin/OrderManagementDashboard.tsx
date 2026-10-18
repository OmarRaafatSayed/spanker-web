'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  Plane,
  Hotel,
  FileCheck,
  Map,
  Wifi,
  WifiOff,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardExportButton } from './DashboardExportButton';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { StaffPerformanceSummary } from './StaffPerformanceSummary';

interface DashboardStats {
  period: {
    days: number;
    start: string;
    end: string;
  };
  bookings: {
    total: number;
    inPeriod: number;
    byStatus: {
      pending: number;
      confirmed: number;
      cancelled: number;
      expired: number;
      pending_payment: number;
      completed: number;
    };
    byVertical: {
      flight: number;
      hotel: number;
      visa: number;
      trip: number;
    };
    dailyTrend: Array<{ date: string; count: number }>;
  };
  revenue: {
    total: number;
    pending: number;
    currency: string;
  };
  documents: {
    pending: number;
    approved: number;
    rejected: number;
  };
  customers: {
    total: number;
    new: number;
  };
  recentActivity: any[];
}

export function OrderManagementDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  // Refresh dashboard on any booking change
  const { isConnected } = useRealtimeBookings({
    onInsert: () => fetchDashboardData(),
    onUpdate: () => fetchDashboardData(),
  });

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/dashboard?period=${period}`);
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

  const { bookings, revenue, documents, customers } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">نظام إدارة الطلبات</h1>
            <p className="text-text-muted mt-1 text-sm">
              البيانات من {new Date(data.period.start).toLocaleDateString('ar-EG')} إلى{' '}
              {new Date(data.period.end).toLocaleDateString('ar-EG')}
            </p>
          </div>
          {/* Real-time indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted text-xs">
            {isConnected ? (
              <><Wifi className="h-3 w-3 text-green-600" /><span className="text-green-600">تحديثات فورية</span></>
            ) : (
              <><WifiOff className="h-3 w-3 text-gray-400" /><span className="text-gray-400">غير متصل</span></>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DashboardExportButton period={period} />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border-default bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          >
            <option value="7">7 أيام</option>
            <option value="30">30 يوم</option>
            <option value="90">90 يوم</option>
            <option value="365">سنة</option>
          </select>
        </div>
      </div>

      {/* Key Metrics — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="إجمالي الطلبات"
          value={bookings.inPeriod}
          subtitle={`من أصل ${bookings.total}`}
          icon={<Package className="h-5 w-5" />}
          trend="+12%"
          href="/admin/bookings"
        />
        <MetricCard
          title="قيد الانتظار"
          value={bookings.byStatus.pending + (bookings.byStatus.pending_payment ?? 0)}
          subtitle="يحتاج إجراء"
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
          href="/admin/bookings?status=pending"
        />
        <MetricCard
          title="مؤكد"
          value={bookings.byStatus.confirmed + bookings.byStatus.completed}
          subtitle="مكتمل"
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
          href="/admin/bookings?status=confirmed"
        />
        <MetricCard
          title="ملغي"
          value={bookings.byStatus.cancelled}
          subtitle="تم الإلغاء"
          icon={<XCircle className="h-5 w-5" />}
          variant="danger"
          href="/admin/bookings?status=cancelled"
        />
      </div>

      {/* Revenue and Documents Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-text-muted">الإيرادات المؤكدة</p>
              <p className="text-3xl font-bold text-green-600">
                {revenue.total.toLocaleString()} {revenue.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted">قيد الانتظار</p>
              <p className="text-xl font-semibold text-orange-600">
                {revenue.pending.toLocaleString()} {revenue.currency}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              المستندات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">قيد المراجعة</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                {documents.pending}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">تمت الموافقة</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {documents.approved}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">مرفوضة</span>
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                {documents.rejected}
              </Badge>
            </div>
            {documents.pending > 0 && (
              <Link href="/admin/documents">
                <Button variant="outline" className="w-full mt-2" size="sm">
                  مراجعة المستندات
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bookings by Type */}
      <Card>
        <CardHeader>
          <CardTitle>الطلبات حسب النوع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TypeCard
              icon={<Plane className="h-6 w-6" />}
              type="رحلات طيران"
              count={bookings.byVertical.flight}
              color="blue"
            />
            <TypeCard
              icon={<Hotel className="h-6 w-6" />}
              type="حجوزات فنادق"
              count={bookings.byVertical.hotel}
              color="purple"
            />
            <TypeCard
              icon={<FileCheck className="h-6 w-6" />}
              type="تأشيرات"
              count={bookings.byVertical.visa}
              color="green"
            />
            <TypeCard
              icon={<Map className="h-6 w-6" />}
              type="رحلات سياحية"
              count={bookings.byVertical.trip}
              color="orange"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            العملاء
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-muted">إجمالي العملاء</p>
              <p className="text-2xl font-bold">{customers.total}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">عملاء جدد</p>
              <p className="text-2xl font-bold text-green-600">+{customers.new}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>آخر الطلبات</CardTitle>
            <Link href="/admin/bookings">
              <Button variant="outline" size="sm">
                عرض الكل
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <RecentActivityList activities={data.recentActivity} />
        </CardContent>
      </Card>

      {/* Staff Performance Summary */}
      <StaffPerformanceSummary />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
  variant?: 'default' | 'warning' | 'success' | 'danger';
}) {
  const variantStyles = {
    default: 'text-blue-600 bg-blue-50',
    warning: 'text-orange-600 bg-orange-50',
    success: 'text-green-600 bg-green-50',
    danger: 'text-red-600 bg-red-50',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-text-muted">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${variantStyles[variant]}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value.toLocaleString()}</div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-text-muted">{subtitle}</p>
          {trend && <span className="text-xs text-green-600 font-medium">{trend}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function TypeCard({
  icon,
  type,
  count,
  color,
}: {
  icon: React.ReactNode;
  type: string;
  count: number;
  color: 'blue' | 'purple' | 'green' | 'orange';
}) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  return (
    <div
      className={`text-center p-3 sm:p-6 border-2 rounded-xl ${colorStyles[color]} transition-all hover:scale-105`}
    >
      <div className="flex justify-center mb-2 sm:mb-3">{icon}</div>
      <div className="text-2xl sm:text-3xl font-bold mb-1">{count}</div>
      <div className="text-xs sm:text-sm font-medium">{type}</div>
    </div>
  );
}

function RecentActivityList({ activities }: { activities: any[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>لا توجد أنشطة حديثة</p>
      </div>
    );
  }

  const verticalIcons: Record<string, React.ReactNode> = {
    flight: <Plane className="h-4 w-4" />,
    hotel: <Hotel className="h-4 w-4" />,
    visa: <FileCheck className="h-4 w-4" />,
    trip: <Map className="h-4 w-4" />,
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    pending_payment: 'bg-orange-100 text-orange-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const customerName =
          activity.profiles?.first_name && activity.profiles?.last_name
            ? `${activity.profiles.first_name} ${activity.profiles.last_name}`
            : activity.profiles?.email || 'عميل';

        return (
          <div
            key={activity.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                {verticalIcons[activity.vertical] ?? <Package className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{activity.booking_reference}</div>
                <div className="text-xs text-text-muted truncate">{customerName}</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <Badge
                className={statusColors[activity.booking_status] ?? ''}
                variant="secondary"
              >
                {activity.booking_status}
              </Badge>
              <div className="text-xs text-text-muted mt-1">
                {activity.total_amount?.toLocaleString()} ج.م
              </div>
            </div>
          </div>
        );
      })}
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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-48 bg-muted rounded-lg" />
        <div className="h-48 bg-muted rounded-lg" />
      </div>
      <div className="h-64 bg-muted rounded-lg" />
    </div>
  );
}
