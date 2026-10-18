'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  Award,
  Target,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StaffPerformance {
  staff_id: string;
  staff_name: string;
  staff_email: string;
  role: string;
  metrics: {
    total_assigned: number;
    completed: number;
    confirmed: number;
    cancelled: number;
    pending: number;
    completion_rate: number;
    cancellation_rate: number;
    avg_response_time_hours: number;
    total_revenue: number;
  };
}

interface AnalyticsData {
  period: {
    days: number;
    start: string;
    end: string;
  };
  staff_performance: StaffPerformance[];
  team_totals: {
    total_assigned: number;
    completed: number;
    confirmed: number;
    cancelled: number;
    pending: number;
    total_revenue: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/staff-performance?period=${period}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded-lg" />
      </div>
    );
  }

  const { staff_performance, team_totals } = data;

  // Find top performers
  const topPerformer = staff_performance[0];
  const fastestResponder = [...staff_performance].sort(
    (a, b) => a.metrics.avg_response_time_hours - b.metrics.avg_response_time_hours
  )[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">تحليل أداء الموظفين</h1>
          <p className="text-text-muted mt-1 text-sm">
            البيانات من {new Date(data.period.start).toLocaleDateString('ar-EG')} إلى{' '}
            {new Date(data.period.end).toLocaleDateString('ar-EG')}
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="h-9 px-3 rounded-lg border border-border-default bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 w-full sm:w-auto"
        >
          <option value="7">آخر 7 أيام</option>
          <option value="30">آخر 30 يوم</option>
          <option value="90">آخر 90 يوم</option>
          <option value="365">آخر سنة</option>
        </select>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">إجمالي الحجوزات</p>
                <p className="text-3xl font-bold mt-1">{team_totals.total_assigned}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">مؤكدة ومكتملة</p>
                <p className="text-3xl font-bold mt-1 text-green-600">
                  {team_totals.completed + team_totals.confirmed}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">ملغية</p>
                <p className="text-3xl font-bold mt-1 text-red-600">
                  {team_totals.cancelled}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">الإيرادات</p>
                <p className="text-2xl font-bold mt-1">
                  {team_totals.total_revenue.toLocaleString()}
                </p>
                <p className="text-xs text-text-muted">ج.م</p>
              </div>
              <DollarSign className="h-8 w-8 text-brand-green" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {topPerformer && fastestResponder && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-brand-green">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-brand-green" />
                الأكثر إنتاجية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{topPerformer.staff_name}</p>
                  <p className="text-sm text-text-muted">{topPerformer.staff_email}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-brand-green">
                    {topPerformer.metrics.total_assigned}
                  </p>
                  <p className="text-xs text-text-muted">حجز</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                الأسرع استجابة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{fastestResponder.staff_name}</p>
                  <p className="text-sm text-text-muted">{fastestResponder.staff_email}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {fastestResponder.metrics.avg_response_time_hours}
                  </p>
                  <p className="text-xs text-text-muted">ساعة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Staff Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>أداء الموظفين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-right px-4 py-3 font-semibold text-sm">الموظف</th>
                  <th className="text-right px-4 py-3 font-semibold text-sm">إجمالي</th>
                  <th className="text-right px-4 py-3 font-semibold text-sm">مؤكدة</th>
                  <th className="text-right px-4 py-3 font-semibold text-sm">ملغية</th>
                  <th className="text-right px-4 py-3 font-semibold text-sm">قيد الانتظار</th>
                  <th className="text-right px-4 py-3 font-semibold text-sm">نسبة الإنجاز</th>
                  <th className="text-right px-4 py-3 font-semibold text-sm">وقت الاستجابة</th>
                  <th className="text-right px-4 py-3 font-semibold text-sm">الإيرادات</th>
                </tr>
              </thead>
              <tbody>
                {staff_performance.map((staff, index) => (
                  <tr
                    key={staff.staff_id}
                    className={`border-b border-border-light hover:bg-muted/30 transition-colors ${
                      index === 0 ? 'bg-brand-green/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{staff.staff_name}</p>
                        <p className="text-xs text-text-muted">{staff.staff_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold">{staff.metrics.total_assigned}</td>
                    <td className="px-4 py-3 text-green-600">
                      {staff.metrics.confirmed + staff.metrics.completed}
                    </td>
                    <td className="px-4 py-3 text-red-600">{staff.metrics.cancelled}</td>
                    <td className="px-4 py-3 text-yellow-600">{staff.metrics.pending}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={
                          staff.metrics.completion_rate >= 80
                            ? 'bg-green-100 text-green-700'
                            : staff.metrics.completion_rate >= 60
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }
                      >
                        {staff.metrics.completion_rate}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {staff.metrics.avg_response_time_hours > 0
                        ? `${staff.metrics.avg_response_time_hours} ساعة`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {staff.metrics.total_revenue.toLocaleString()} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
