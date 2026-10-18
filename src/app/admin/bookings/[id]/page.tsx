'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookingNotes } from '@/components/admin/BookingNotes';
import { AuditLog } from '@/components/admin/AuditLog';
import { BookingAssignment } from '@/components/admin/BookingAssignment';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface BookingDetail {
  id: string;
  booking_reference: string;
  vertical: string;
  booking_status: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  departure_date?: string;
  return_date?: string;
  destination_country?: string;
  traveler_count?: number;
  assigned_to?: string;
  contact?: {
    email: string;
    phone: string;
    full_name?: string;
  };
  profiles?: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  flight_details?: any;
  hotel_details?: any;
  visa_details?: any;
  trip_details?: any;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staffMembers, setStaffMembers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchBookingDetail();
    fetchStaff();
  }, [bookingId]);

  async function fetchStaff() {
    try {
      const res = await fetch('/api/admin/staff');
      if (res.ok) {
        const json = await res.json();
        setStaffMembers(json.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch staff:', e);
    }
  }

  async function fetchBookingDetail() {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/bookings/${bookingId}`);
      const result = await response.json();
      
      if (result.success) {
        setBooking(result.data);
      } else {
        setError(result.error?.message || 'فشل تحميل البيانات');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6 animate-pulse">
          <div className="h-16 bg-muted rounded-lg" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">خطأ</h2>
            <p className="text-text-muted mb-4">{error || 'الحجز غير موجود'}</p>
            <Link href="/admin/bookings">
              <Button>العودة للحجوزات</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    pending_payment: 'bg-orange-100 text-orange-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };

  const statusLabels: Record<string, string> = {
    pending: 'قيد الانتظار',
    pending_payment: 'في انتظار الدفع',
    confirmed: 'مؤكد',
    cancelled: 'ملغي',
    expired: 'منتهي',
    completed: 'مكتمل',
  };

  const verticalLabels: Record<string, string> = {
    flight: 'رحلة طيران',
    hotel: 'حجز فندق',
    visa: 'تأشيرة',
    trip: 'رحلة سياحية',
  };

  const customerName =
    booking.profiles
      ? `${booking.profiles.first_name || ''} ${booking.profiles.last_name || ''}`.trim() ||
        booking.profiles.email
      : booking.contact?.full_name || booking.contact?.email || 'عميل';

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/bookings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-text-primary">تفاصيل الحجز</h1>
          <p className="text-text-muted mt-1">{booking.booking_reference}</p>
        </div>
        <Badge className={statusColors[booking.booking_status]} variant="secondary">
          {statusLabels[booking.booking_status]}
        </Badge>
      </div>

      {/* Main Info Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              معلومات العميل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={<User />} label="الاسم" value={customerName} />
            <InfoRow
              icon={<Mail />}
              label="البريد"
              value={booking.profiles?.email || booking.contact?.email || '-'}
            />
            <InfoRow
              icon={<Phone />}
              label="الهاتف"
              value={booking.profiles?.phone || booking.contact?.phone || '-'}
            />
          </CardContent>
        </Card>

        {/* Booking Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              معلومات الحجز
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              icon={<Package />}
              label="النوع"
              value={verticalLabels[booking.vertical]}
            />
            <InfoRow
              icon={<DollarSign />}
              label="المبلغ"
              value={`${booking.total_amount?.toLocaleString() || 0} ${booking.currency}`}
            />
            <InfoRow
              icon={<Calendar />}
              label="تاريخ الإنشاء"
              value={new Date(booking.created_at).toLocaleString('ar-EG')}
            />
            {booking.destination_country && (
              <InfoRow
                icon={<MapPin />}
                label="الوجهة"
                value={booking.destination_country}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assignment Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            تعيين الحجز
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BookingAssignment
            bookingId={bookingId}
            currentAssignee={
              booking.assigned_to
                ? {
                    id: booking.assigned_to,
                    name: staffMembers.find((s) => s.id === booking.assigned_to)?.name || 'موظف',
                  }
                : null
            }
            staffMembers={staffMembers}
            onAssignmentChange={fetchBookingDetail}
          />
        </CardContent>
      </Card>

      {/* Booking Details by Type */}
      {booking.flight_details && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>تفاصيل الرحلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <InfoRow label="الخطوط الجوية" value={booking.flight_details.airline} />
              <InfoRow label="رقم الرحلة" value={booking.flight_details.flight_number} />
              <InfoRow label="من" value={booking.flight_details.origin} />
              <InfoRow label="إلى" value={booking.flight_details.destination} />
              <InfoRow
                label="الركاب"
                value={`${booking.flight_details.passengers?.length || 0} راكب`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {booking.hotel_details && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>تفاصيل الفندق</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <InfoRow label="اسم الفندق" value={booking.hotel_details.hotel_name} />
              <InfoRow label="نوع الغرفة" value={booking.hotel_details.room_type} />
              <InfoRow label="عدد الغرف" value={booking.hotel_details.rooms_count} />
              <InfoRow label="تاريخ الوصول" value={booking.hotel_details.checkin_date} />
              <InfoRow label="تاريخ المغادرة" value={booking.hotel_details.checkout_date} />
              <InfoRow label="عدد الليالي" value={`${booking.hotel_details.nights} ليلة`} />
            </div>
          </CardContent>
        </Card>
      )}

      {booking.visa_details && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>تفاصيل التأشيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <InfoRow label="الدولة" value={booking.visa_details.destination_country} />
              <InfoRow label="نوع التأشيرة" value={booking.visa_details.visa_type} />
              <InfoRow label="المتقدم" value={booking.visa_details.applicant_name} />
              <InfoRow label="رقم الجواز" value={booking.visa_details.passport_number} />
              <InfoRow label="حالة المراجعة" value={booking.visa_details.review_status} />
            </div>
          </CardContent>
        </Card>
      )}

      {booking.trip_details && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>تفاصيل الرحلة السياحية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <InfoRow label="اسم الرحلة" value={booking.trip_details.trip_title} />
              <InfoRow label="تاريخ البدء" value={booking.trip_details.start_date} />
              <InfoRow
                label="المسافرون"
                value={`${booking.trip_details.travelers_count} مسافر`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Internal Notes */}
      <div className="mb-6">
        <BookingNotes bookingId={bookingId} />
      </div>

      {/* Audit Log */}
      <AuditLog bookingId={bookingId} />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon && <div className="text-text-muted mt-0.5">{icon}</div>}
      <div className="flex-1">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="font-medium text-sm">{value}</p>
      </div>
    </div>
  );
}
