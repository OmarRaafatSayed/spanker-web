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
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, UserMinus, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

interface BookingAssignmentProps {
  bookingId: string;
  currentAssignee?: {
    id: string;
    name: string;
  } | null;
  staffMembers: { id: string; name: string }[];
  onAssignmentChange?: () => void;
}

export function BookingAssignment({
  bookingId,
  currentAssignee,
  staffMembers,
  onAssignmentChange,
}: BookingAssignmentProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(currentAssignee?.id || '');
  const [notes, setNotes] = useState('');

  const handleAssign = async () => {
    if (!selectedStaff && currentAssignee) {
      // Unassign
      await handleUnassign();
      return;
    }

    if (!selectedStaff) {
      toast.error('Please select a staff member');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: selectedStaff,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Assignment failed');
      }

      toast.success('تم تعيين الحجز بنجاح');
      setOpen(false);
      setNotes('');
      onAssignmentChange?.();
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error(
        error instanceof Error ? error.message : 'فشل تعيين الحجز'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassign = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: null,
          notes: 'Unassigned',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unassignment failed');
      }

      toast.success('تم إلغاء التعيين بنجاح');
      setOpen(false);
      setSelectedStaff('');
      setNotes('');
      onAssignmentChange?.();
    } catch (error) {
      console.error('Unassignment error:', error);
      toast.error(
        error instanceof Error ? error.message : 'فشل إلغاء التعيين'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {currentAssignee ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
          <User className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            {currentAssignee.name}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">غير مُسند</span>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedStaff(currentAssignee?.id || '');
              setNotes('');
            }}
          >
            {currentAssignee ? (
              <>
                <UserMinus className="h-4 w-4 mr-2" />
                إعادة تعيين
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                تعيين
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعيين الحجز</DialogTitle>
            <DialogDescription>
              اختر موظف لتعيين هذا الحجز له، أو قم بإلغاء التعيين
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="staff-select">الموظف</Label>
              <select
                id="staff-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
              >
                <option value="">-- إلغاء التعيين --</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                placeholder="سبب التعيين أو ملاحظات إضافية..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button onClick={handleAssign} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري التعيين...
                </>
              ) : selectedStaff ? (
                'تأكيد التعيين'
              ) : (
                'إلغاء التعيين'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
