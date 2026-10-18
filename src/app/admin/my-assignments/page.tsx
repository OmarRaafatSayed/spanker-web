'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Clock, 
  DollarSign, 
  User,
  AlertCircle,
  CheckCircle2,
  Wifi,
  WifiOff
} from 'lucide-react';
import Link from 'next/link';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { toast } from 'sonner';

interface AssignedBooking {
  id: string;
  reference_number: string;
  vertical: string;
  booking_status: string;
  total_amount: number;
  created_at: string;
  client_name?: string;
  client_email?: string;
}

export default function MyAssignmentsPage() {
  const [bookings, setBookings] = useState<AssignedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
  });

  useEffect(() => {
    fetchMyAssignments();
  }, []);

  // Setup real-time subscription for assignments
  const { isConnected } = useRealtimeBookings({
    onInsert: (newBooking) => {
      // Check if this booking is assigned to current user
      toast.info('تم تعيين حجز جديد لك');
      fetchMyAssignments();
    },
    onUpdate: (updatedBooking) => {
      // Update the booking in the list or refetch if assignment changed
      fetchMyAssignments();
    },
  });

  async function fetchMyAssignments() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/my-assignments');
      const result = await response.json();
      
      if (result.success) {
        const data = result.data || [];
        setBookings(data);
        
        // Calculate stats
        setStats({
          total: data.length,
          pending: data.filter((b: AssignedBooking) => b.booking_status === 'pending').length,
          confirmed: data.filter((b: AssignedBooking) => b.booking_status === 'confirmed').length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };

  const statusLabels: Record<string, string> = {
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    cancelled: 'ملغي',
    expired: 'منتهي',
    completed: 'مكتمل',
  };

  const verticalIcons: Record<string, string> = {
    flight: '✈️',
    hotel: '🏨',
    visa: '🛂',
    trip: '🗺️',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">حجوزاتي</h1>
            <p className="text-text-muted mt-1">الحجوزات المُسندة إليك</p>
          </div>
          {/* Real-time connection indicator */}
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted">
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">متصل</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-400">غير متصل</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">إجمالي الحجوزات</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">قيد الانتظار</p>
                <p className="text-3xl font-bold mt-1 text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">مؤكدة</p>
                <p className="text-3xl font-bold mt-1 text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted" />
              <h3 className="text-lg font-semibold mb-2">لا توجد حجوزات مُسندة</h3>
              <p className="text-text-muted">لم يتم تعيين أي حجوزات لك بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/admin/bookings/${booking.id}`}
                  className="block"
                >
                  <div className="p-4 border border-border-default rounded-lg hover:border-brand-green hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">
                            {verticalIcons[booking.vertical]}
                          </span>
                          <div>
                            <p className="font-bold text-brand-green">
                              {booking.reference_number}
                            </p>
                            <p className="text-sm text-text-muted">
                              {booking.vertical}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-text-muted">
                            <User className="h-4 w-4" />
                            {booking.client_name || booking.client_email || 'عميل'}
                          </div>
                          <div className="flex items-center gap-1 text-text-muted">
                            <DollarSign className="h-4 w-4" />
                            {booking.total_amount?.toLocaleString()} ج.م
                          </div>
                          <div className="flex items-center gap-1 text-text-muted">
                            <Clock className="h-4 w-4" />
                            {new Date(booking.created_at).toLocaleDateString('ar-EG')}
                          </div>
                        </div>
                      </div>
                      
                      <Badge
                        className={statusColors[booking.booking_status]}
                        variant="secondary"
                      >
                        {statusLabels[booking.booking_status]}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
