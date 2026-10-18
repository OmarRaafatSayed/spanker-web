'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FilterValues } from './AdvancedFilters';

interface ExportButtonProps {
  filters: FilterValues;
  disabled?: boolean;
}

export function ExportButton({ filters, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'xlsx' | 'csv') => {
    setIsExporting(true);
    try {
      // Build query string from filters
      const params = new URLSearchParams({
        format,
        ...(filters.status && { status: filters.status }),
        ...(filters.vertical && { vertical: filters.vertical }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to }),
        ...(filters.amount_min && { amount_min: filters.amount_min }),
        ...(filters.amount_max && { amount_max: filters.amount_max }),
        ...(filters.assigned_to && { assigned_to: filters.assigned_to }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/admin/bookings/export?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Export failed');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `bookings-export-${new Date().toISOString().split('T')[0]}.${format}`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`تم تصدير ${format.toUpperCase()} بنجاح`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(
        error instanceof Error ? error.message : 'فشل التصدير'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting}
          className="gap-2"
          data-export-trigger
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري التصدير...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              تصدير
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('xlsx')}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          تصدير Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          تصدير CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
