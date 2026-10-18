'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Filter, X } from 'lucide-react';

export interface FilterValues {
  status?: string;
  vertical?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: string;
  amount_max?: string;
  assigned_to?: string;
  search?: string;
}

interface AdvancedFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  staffMembers: { id: string; name: string }[];
}

const STATUS_OPTIONS = [
  { value: '', label: 'كل الحالات' },
  { value: 'draft', label: 'مسودة' },
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'cancelled', label: 'ملغي' },
  { value: 'expired', label: 'منتهي' },
  { value: 'refunded', label: 'مسترد' },
  { value: 'completed', label: 'مكتمل' },
];

const VERTICAL_OPTIONS = [
  { value: '', label: 'كل الأنواع' },
  { value: 'flight', label: 'رحلات' },
  { value: 'hotel', label: 'فنادق' },
  { value: 'visa', label: 'تأشيرات' },
  { value: 'trip', label: 'رحلات سياحية' },
];

const INPUT_CLASS =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:border-brand-green disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-950 dark:text-white';

export function AdvancedFilters({
  filters,
  onFiltersChange,
  staffMembers,
}: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleReset = () => {
    const resetFilters: FilterValues = {};
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    setOpen(false);
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== ''
  ).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-filter-button>
          <Filter className="h-4 w-4" />
          فلترة متقدمة
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-brand-green text-white text-xs px-2 py-0.5">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>فلترة متقدمة للحجوزات</DialogTitle>
          <DialogDescription>
            استخدم الفلاتر المتقدمة للبحث عن حجوزات محددة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">بحث (رقم المرجع، اسم العميل، البريد)</Label>
            <input
              id="search"
              type="text"
              placeholder="ابحث..."
              value={localFilters.search || ''}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, search: e.target.value })
              }
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <select
                id="status"
                value={localFilters.status || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, status: e.target.value })
                }
                className={INPUT_CLASS}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Vertical Filter */}
            <div className="space-y-2">
              <Label htmlFor="vertical">نوع الحجز</Label>
              <select
                id="vertical"
                value={localFilters.vertical || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, vertical: e.target.value })
                }
                className={INPUT_CLASS}
              >
                {VERTICAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_from">من تاريخ</Label>
              <input
                id="date_from"
                type="date"
                value={localFilters.date_from || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, date_from: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_to">إلى تاريخ</Label>
              <input
                id="date_to"
                type="date"
                value={localFilters.date_to || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, date_to: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount_min">أقل مبلغ (ج.م)</Label>
              <input
                id="amount_min"
                type="number"
                min="0"
                step="100"
                placeholder="0"
                value={localFilters.amount_min || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, amount_min: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount_max">أعلى مبلغ (ج.م)</Label>
              <input
                id="amount_max"
                type="number"
                min="0"
                step="100"
                placeholder="غير محدود"
                value={localFilters.amount_max || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, amount_max: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          {/* Assigned Staff */}
          <div className="space-y-2">
            <Label htmlFor="assigned_to">مُسند إلى</Label>
            <select
              id="assigned_to"
              value={localFilters.assigned_to || ''}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  assigned_to: e.target.value,
                })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">الكل</option>
              <option value="_unassigned">غير مُسند</option>
              {staffMembers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            <X className="h-4 w-4" />
            إعادة تعيين
          </Button>
          <Button onClick={handleApply}>
            <Filter className="h-4 w-4" />
            تطبيق الفلاتر
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
