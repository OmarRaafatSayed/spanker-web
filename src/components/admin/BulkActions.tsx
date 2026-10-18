'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckSquare, XSquare, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BulkActionsProps {
  selectedIds: string[];
  onActionComplete: () => void;
  staffMembers: { id: string; name: string }[];
}

export function BulkActions({
  selectedIds,
  onActionComplete,
  staffMembers,
}: BulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');

  const handleBulkAction = async (
    action: 'confirm' | 'cancel' | 'assign',
    extraData?: any
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/bookings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_ids: selectedIds,
          action,
          ...extraData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Bulk action failed');
      }

      toast.success(
        `${data.success} booking(s) ${action === 'confirm' ? 'confirmed' : action === 'cancel' ? 'cancelled' : 'assigned'} successfully` +
          (data.failed > 0 ? `. ${data.failed} failed.` : '')
      );

      onActionComplete();
      setShowCancelDialog(false);
      setShowAssignDialog(false);
      setCancelReason('');
      setSelectedStaff('');
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to perform bulk action'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    handleBulkAction('confirm');
  };

  const handleCancelConfirm = () => {
    handleBulkAction('cancel', { cancel_reason: cancelReason });
  };

  const handleAssignConfirm = () => {
    if (!selectedStaff) {
      toast.error('Please select a staff member');
      return;
    }
    handleBulkAction('assign', { assign_to: selectedStaff });
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
        <span className="text-sm font-medium">
          {selectedIds.length} booking(s) selected
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Bulk Actions'
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleConfirm}>
              <CheckSquare className="h-4 w-4 mr-2" />
              Confirm All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCancelDialog(true)}>
              <XSquare className="h-4 w-4 mr-2" />
              Cancel All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowAssignDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          onClick={onActionComplete}
          disabled={isLoading}
        >
          Clear Selection
        </Button>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Bookings</DialogTitle>
            <DialogDescription>
              You are about to cancel {selectedIds.length} booking(s). This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Cancellation Reason</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Enter reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Bookings</DialogTitle>
            <DialogDescription>
              Assign {selectedIds.length} booking(s) to a staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="staff-select">Staff Member</Label>
              <select
                id="staff-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
              >
                <option value="">Select staff member...</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssignDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignConfirm} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Confirm Assignment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
