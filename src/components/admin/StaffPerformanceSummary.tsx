'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface StaffSummary {
  staff_name: string;
  total_assigned: number;
  completion_rate: number;
}

export function StaffPerformanceSummary() {
  const [topPerformers, setTopPerformers] = useState<StaffSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopPerformers();
  }, []);

  async function fetchTopPerformers() {
    try {
      const response = await fetch('/api/admin/analytics/staff-performance?period=30');
      const result = await response.json();
      
      if (result.success && result.data.staff_performance) {
        // Get top 3 performers
        const top3 = result.data.staff_performance.slice(0, 3).map((staff: any) => ({
          staff_name: staff.staff_name,
          total_assigned: staff.metrics.total_assigned,
          completion_rate: staff.metrics.completion_rate,
        }));
        setTopPerformers(top3);
      }
    } catch (error) {
      console.error('Failed to fetch top performers:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            أفضل الموظفين أداءً
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          أفضل الموظفين أداءً
        </CardTitle>
        <Link href="/admin/analytics">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-3 w-3" />
            عرض الكل
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {topPerformers.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">
            لا توجد بيانات متاحة
          </p>
        ) : (
          <div className="space-y-3">
            {topPerformers.map((staff, index) => (
              <div
                key={staff.staff_name}
                className="flex items-center justify-between p-3 rounded-lg border border-border-default hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : index === 1
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{staff.staff_name}</p>
                    <p className="text-xs text-text-muted">
                      معدل الإنجاز: {staff.completion_rate}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-green">
                    {staff.total_assigned}
                  </p>
                  <p className="text-xs text-text-muted">حجز</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
