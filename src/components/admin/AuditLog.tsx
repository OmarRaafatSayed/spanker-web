'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Package,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface LogEntry {
  id: string;
  action: string;
  timestamp: string;
  actor: string;
  actorRole?: string;
  details: {
    message?: string;
    reference?: string;
    from?: string;
    to?: string;
    notes?: string;
  };
}

interface AuditLogProps {
  bookingId: string;
}

export function AuditLog({ bookingId }: AuditLogProps) {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLog();
  }, [bookingId]);

  async function fetchAuditLog() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/audit-log`);
      const result = await response.json();
      
      if (result.success) {
        setLogEntries(result.data.log_entries);
      } else {
        setError(result.error?.message || 'فشل تحميل السجل');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          سجل الإجراءات ({logEntries.length})
        </CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : logEntries.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد إجراءات مسجلة</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute right-[23px] top-6 bottom-6 w-0.5 bg-border-light" />

            {/* Log Entries */}
            <div className="space-y-6">
              {logEntries.map((entry, index) => (
                <LogEntryCard
                  key={entry.id}
                  entry={entry}
                  isFirst={index === 0}
                  isLast={index === logEntries.length - 1}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LogEntryCard({
  entry,
  isFirst,
  isLast,
}: {
  entry: LogEntry;
  isFirst: boolean;
  isLast: boolean;
}) {
  const actionConfig = getActionConfig(entry.action, entry.details);

  return (
    <div className="flex gap-4 relative">
      {/* Timeline Dot */}
      <div
        className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${actionConfig.bgColor} border-4 border-white shadow`}
      >
        {actionConfig.icon}
      </div>

      {/* Content */}
      <div className="flex-1 pb-2">
        <div className="bg-white border border-border-light rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{actionConfig.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-3 w-3 text-text-muted" />
                <span className="text-xs text-text-muted">
                  {entry.actor}
                  {entry.actorRole && (
                    <Badge variant="secondary" className="mr-2 text-xs">
                      {getRoleLabel(entry.actorRole)}
                    </Badge>
                  )}
                </span>
              </div>
            </div>

            <Badge variant={actionConfig.badgeVariant} className={actionConfig.badgeColor}>
              {actionConfig.badge}
            </Badge>
          </div>

          {/* Details */}
          {entry.action === 'status_changed' && entry.details.from && entry.details.to && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-muted/30 rounded-lg">
              <StatusBadge status={entry.details.from} />
              <ArrowRight className="h-4 w-4 text-text-muted" />
              <StatusBadge status={entry.details.to} />
            </div>
          )}

          {entry.details.notes && (
            <div className="mt-3 text-sm text-text-secondary bg-blue-50 border border-blue-100 rounded p-3">
              <FileText className="h-4 w-4 inline mr-2 text-blue-600" />
              {entry.details.notes}
            </div>
          )}

          {entry.details.message && (
            <p className="mt-2 text-sm text-text-secondary">{entry.details.message}</p>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
            <Clock className="h-3 w-3" />
            {formatTimestamp(entry.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<
    string,
    { label: string; color: string }
  > = {
    pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700' },
    pending_payment: { label: 'في انتظار الدفع', color: 'bg-orange-100 text-orange-700' },
    confirmed: { label: 'مؤكد', color: 'bg-green-100 text-green-700' },
    cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700' },
    expired: { label: 'منتهي', color: 'bg-gray-100 text-gray-700' },
    completed: { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-700' },
  };

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' };

  return (
    <Badge variant="secondary" className={`${config.color} font-medium`}>
      {config.label}
    </Badge>
  );
}

function getActionConfig(action: string, details: any) {
  const configs: Record<
    string,
    {
      title: string;
      icon: React.ReactNode;
      badge: string;
      badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
      badgeColor: string;
      bgColor: string;
    }
  > = {
    booking_created: {
      title: 'تم إنشاء الحجز',
      icon: <Package className="h-5 w-5 text-blue-600" />,
      badge: 'إنشاء',
      badgeVariant: 'secondary',
      badgeColor: 'bg-blue-100 text-blue-700',
      bgColor: 'bg-blue-100',
    },
    status_changed: {
      title: details.to === 'confirmed' ? 'تم تأكيد الحجز' :
             details.to === 'cancelled' ? 'تم إلغاء الحجز' :
             details.to === 'expired' ? 'انتهى الحجز' :
             details.to === 'completed' ? 'تم إكمال الحجز' :
             'تم تغيير الحالة',
      icon: details.to === 'confirmed' ? <CheckCircle className="h-5 w-5 text-green-600" /> :
            details.to === 'cancelled' ? <XCircle className="h-5 w-5 text-red-600" /> :
            <Activity className="h-5 w-5 text-orange-600" />,
      badge: 'تغيير حالة',
      badgeVariant: 'secondary',
      badgeColor: details.to === 'confirmed' ? 'bg-green-100 text-green-700' :
                 details.to === 'cancelled' ? 'bg-red-100 text-red-700' :
                 'bg-orange-100 text-orange-700',
      bgColor: details.to === 'confirmed' ? 'bg-green-100' :
               details.to === 'cancelled' ? 'bg-red-100' :
               'bg-orange-100',
    },
  };

  return configs[action] || {
    title: action,
    icon: <Activity className="h-5 w-5 text-gray-600" />,
    badge: 'إجراء',
    badgeVariant: 'secondary',
    badgeColor: 'bg-gray-100 text-gray-700',
    bgColor: 'bg-gray-100',
  };
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'مدير',
    agent: 'وكيل',
    reviewer: 'مراجع',
    staff: 'موظف',
  };
  return labels[role] || role;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'منذ لحظات';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;

  return date.toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
