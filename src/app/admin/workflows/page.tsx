'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Settings, RotateCw, CheckCircle2, Loader2, Play } from 'lucide-react';

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

const LABELS: Record<string, { label: string; unit?: string; type: 'toggle' | 'number' }> = {
  booking_expiry_hours:  { label: 'مدة انتهاء صلاحية الحجز', unit: 'ساعة', type: 'number' },
  escalation_hours:      { label: 'مدة التصعيد للمشرف',       unit: 'ساعة', type: 'number' },
  reminder_hours:        { label: 'مدة إرسال التذكير للعميل', unit: 'ساعة', type: 'number' },
  auto_expire_enabled:   { label: 'تفعيل انتهاء الصلاحية التلقائي',  type: 'toggle' },
  escalation_enabled:    { label: 'تفعيل تنبيهات التصعيد',            type: 'toggle' },
  reminders_enabled:     { label: 'تفعيل تذكيرات الدفع للعملاء',     type: 'toggle' },
};

const CRONS = [
  { label: 'انتهاء الصلاحية',    endpoint: '/api/cron/expire-bookings',    color: 'red' },
  { label: 'تصعيد غير المُسند',  endpoint: '/api/cron/escalate-unassigned', color: 'orange' },
  { label: 'إرسال التذكيرات',   endpoint: '/api/cron/send-reminders',      color: 'blue' },
] as const;

export default function WorkflowsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/workflow-settings');
      const json = await res.json();
      if (json.success) setSettings(json.data);
    } finally {
      setLoading(false);
    }
  }

  async function save(key: string, value: string) {
    setSaving(key);
    try {
      const res = await fetch('/api/admin/workflow-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value } : s))
      );
      toast.success('تم الحفظ');
    } catch (e: any) {
      toast.error(e.message ?? 'فشل الحفظ');
    } finally {
      setSaving(null);
    }
  }

  async function runCron(endpoint: string, label: string) {
    setRunning(endpoint);
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'فشل التشغيل');
      toast.success(`${label}: ${JSON.stringify(json)}`);
    } catch (e: any) {
      toast.error(e.message ?? 'فشل التشغيل');
    } finally {
      setRunning(null);
    }
  }

  const toggles = settings.filter((s) => LABELS[s.key]?.type === 'toggle');
  const numbers = settings.filter((s) => LABELS[s.key]?.type === 'number');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
          <Settings className="h-7 w-7" /> سير العمل التلقائي
        </h1>
        <p className="text-text-muted mt-1">
          إعدادات الأتمتة والمشغّلات التلقائية
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Toggle switches */}
          <Card>
            <CardHeader>
              <CardTitle>تفعيل / تعطيل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {toggles.map((s) => {
                const meta = LABELS[s.key];
                const enabled = s.value === 'true';
                return (
                  <div key={s.key} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{meta?.label ?? s.key}</p>
                      <p className="text-xs text-text-muted">{s.description}</p>
                    </div>
                    <button
                      disabled={saving === s.key}
                      onClick={() => save(s.key, enabled ? 'false' : 'true')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        enabled ? 'bg-brand-green' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Number inputs */}
          <Card>
            <CardHeader>
              <CardTitle>مدد الوقت</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {numbers.map((s) => {
                const meta = LABELS[s.key];
                return (
                  <div key={s.key} className="space-y-1">
                    <label className="text-sm font-medium">{meta?.label ?? s.key}</label>
                    <p className="text-xs text-text-muted">{s.description}</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        defaultValue={s.value}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val && val !== s.value) save(s.key, val);
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                      />
                      <span className="flex items-center text-xs text-text-muted whitespace-nowrap">
                        {meta?.unit}
                      </span>
                    </div>
                    {saving === s.key && (
                      <p className="text-xs text-brand-green">جاري الحفظ...</p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Manual cron triggers */}
          <Card>
            <CardHeader>
              <CardTitle>تشغيل يدوي</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {CRONS.map((cron) => (
                <Button
                  key={cron.endpoint}
                  variant="outline"
                  size="sm"
                  disabled={running === cron.endpoint}
                  onClick={() => runCron(cron.endpoint, cron.label)}
                  className="gap-2"
                >
                  {running === cron.endpoint ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {cron.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Vercel cron config hint */}
          <Card className="bg-muted/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <RotateCw className="h-4 w-4" /> جدولة تلقائية (Vercel Cron)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-text-muted mb-2">
                أضف هذا إلى <code className="bg-muted px-1 rounded">vercel.json</code> لتشغيل المهام تلقائياً:
              </p>
              <pre className="text-xs bg-white border border-border-default rounded-lg p-4 overflow-x-auto leading-relaxed">
{`{
  "crons": [
    { "path": "/api/cron/expire-bookings",    "schedule": "0 * * * *"   },
    { "path": "/api/cron/escalate-unassigned","schedule": "*/30 * * * *"},
    { "path": "/api/cron/send-reminders",     "schedule": "0 */4 * * *" }
  ]
}`}
              </pre>
              <p className="text-xs text-text-muted mt-2">
                أضف متغير البيئة <code className="bg-muted px-1 rounded">CRON_SECRET</code> وأرسله في رأس الطلب
                <code className="bg-muted px-1 rounded">Authorization: Bearer &lt;secret&gt;</code>.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
