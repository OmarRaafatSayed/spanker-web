'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search,
  Home,
  Package,
  FileText,
  Users,
  Settings,
  Download,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  UserPlus,
  Bell,
  BarChart3,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Navigation commands
  const navigationCommands: Command[] = [
    {
      id: 'nav-dashboard',
      label: 'لوحة التحكم',
      description: 'الذهاب إلى الصفحة الرئيسية',
      icon: <Home className="h-4 w-4" />,
      action: () => {
        router.push('/admin');
        onOpenChange(false);
      },
      keywords: ['dashboard', 'home', 'الرئيسية'],
    },
    {
      id: 'nav-bookings',
      label: 'الحجوزات',
      description: 'عرض جميع الحجوزات',
      icon: <Package className="h-4 w-4" />,
      action: () => {
        router.push('/admin/bookings');
        onOpenChange(false);
      },
      keywords: ['bookings', 'orders', 'حجوزات', 'طلبات'],
    },
    {
      id: 'nav-my-assignments',
      label: 'حجوزاتي',
      description: 'الحجوزات المُسندة إليك',
      icon: <UserPlus className="h-4 w-4" />,
      action: () => {
        router.push('/admin/my-assignments');
        onOpenChange(false);
      },
      keywords: ['assignments', 'my bookings', 'حجوزاتي'],
    },
    {
      id: 'nav-documents',
      label: 'المستندات',
      description: 'إدارة المستندات',
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        router.push('/admin/documents');
        onOpenChange(false);
      },
      keywords: ['documents', 'files', 'مستندات'],
    },
    {
      id: 'nav-analytics',
      label: 'التحليلات',
      description: 'عرض تحليلات الأداء',
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => {
        router.push('/admin/analytics');
        onOpenChange(false);
      },
      keywords: ['analytics', 'performance', 'reports', 'تحليلات', 'أداء'],
    },
    {
      id: 'nav-workflows',
      label: 'سير العمل التلقائي',
      description: 'إعدادات الأتمتة والمشغّلات',
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        router.push('/admin/workflows');
        onOpenChange(false);
      },
      keywords: ['workflows', 'automation', 'cron', 'triggers', 'أتمتة'],
    },
  ];

  // Quick action commands
  const quickActionCommands: Command[] = [
    {
      id: 'action-export',
      label: 'تصدير الحجوزات',
      description: 'تصدير قائمة الحجوزات إلى Excel',
      icon: <Download className="h-4 w-4" />,
      action: () => {
        // Trigger export from current page
        const exportBtn = document.querySelector('[data-export-button]') as HTMLButtonElement;
        if (exportBtn) exportBtn.click();
        onOpenChange(false);
      },
      keywords: ['export', 'download', 'تصدير', 'تنزيل'],
    },
    {
      id: 'action-filter',
      label: 'فتح الفلاتر المتقدمة',
      description: 'فتح نافذة الفلاتر المتقدمة',
      icon: <Filter className="h-4 w-4" />,
      action: () => {
        const filterBtn = document.querySelector('[data-filter-button]') as HTMLButtonElement;
        if (filterBtn) filterBtn.click();
        onOpenChange(false);
      },
      keywords: ['filter', 'search', 'فلتر', 'بحث'],
    },
  ];

  // Status filter commands
  const statusCommands: Command[] = [
    {
      id: 'filter-pending',
      label: 'عرض الحجوزات قيد الانتظار',
      icon: <Bell className="h-4 w-4" />,
      action: () => {
        router.push('/admin/bookings?status=pending');
        onOpenChange(false);
      },
      keywords: ['pending', 'waiting', 'قيد الانتظار'],
    },
    {
      id: 'filter-confirmed',
      label: 'عرض الحجوزات المؤكدة',
      icon: <CheckCircle2 className="h-4 w-4" />,
      action: () => {
        router.push('/admin/bookings?status=confirmed');
        onOpenChange(false);
      },
      keywords: ['confirmed', 'approved', 'مؤكدة'],
    },
    {
      id: 'filter-cancelled',
      label: 'عرض الحجوزات الملغية',
      icon: <XCircle className="h-4 w-4" />,
      action: () => {
        router.push('/admin/bookings?status=cancelled');
        onOpenChange(false);
      },
      keywords: ['cancelled', 'rejected', 'ملغية'],
    },
  ];

  const allCommands = [
    ...navigationCommands,
    ...quickActionCommands,
    ...statusCommands,
  ];

  // Keyboard shortcut to open palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 mr-2 opacity-50" />
            <Command.Input
              placeholder="ابحث عن أمر أو صفحة..."
              value={search}
              onValueChange={setSearch}
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              لا توجد نتائج
            </Command.Empty>

            <Command.Group heading="التنقل">
              {navigationCommands.map((cmd) => (
                <Command.Item
                  key={cmd.id}
                  value={`${cmd.label} ${cmd.keywords?.join(' ')}`}
                  onSelect={cmd.action}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md hover:bg-muted aria-selected:bg-muted"
                >
                  {cmd.icon}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{cmd.label}</p>
                    {cmd.description && (
                      <p className="text-xs text-muted-foreground">
                        {cmd.description}
                      </p>
                    )}
                  </div>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Separator className="my-2 h-px bg-border" />

            <Command.Group heading="إجراءات سريعة">
              {quickActionCommands.map((cmd) => (
                <Command.Item
                  key={cmd.id}
                  value={`${cmd.label} ${cmd.keywords?.join(' ')}`}
                  onSelect={cmd.action}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md hover:bg-muted aria-selected:bg-muted"
                >
                  {cmd.icon}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{cmd.label}</p>
                    {cmd.description && (
                      <p className="text-xs text-muted-foreground">
                        {cmd.description}
                      </p>
                    )}
                  </div>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Separator className="my-2 h-px bg-border" />

            <Command.Group heading="فلاتر سريعة">
              {statusCommands.map((cmd) => (
                <Command.Item
                  key={cmd.id}
                  value={`${cmd.label} ${cmd.keywords?.join(' ')}`}
                  onSelect={cmd.action}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md hover:bg-muted aria-selected:bg-muted"
                >
                  {cmd.icon}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{cmd.label}</p>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">Ctrl+K</span>
            </kbd>{' '}
            لفتح القائمة
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
