'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, Hotel, FileText, MapPin } from 'lucide-react';

interface Booking {
  id: string;
  vertical: string;
  booking_status: string;
  total_amount: number | null;
  created_at: string;
  profiles: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export function CRMBookingsList({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No recent bookings
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const customerName = [booking.profiles.first_name, booking.profiles.last_name]
    .filter(Boolean)
    .join(' ') || booking.profiles.email;

  const icons = {
    flight: <Plane className="h-4 w-4" />,
    hotel: <Hotel className="h-4 w-4" />,
    visa: <FileText className="h-4 w-4" />,
    trip: <MapPin className="h-4 w-4" />,
  };

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    confirmed: 'bg-green-500/10 text-green-500 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    expired: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          {icons[booking.vertical as keyof typeof icons] || icons.flight}
        </div>
        
        <div>
          <div className="font-semibold capitalize">{booking.vertical} Booking</div>
          <div className="text-sm text-muted-foreground">{customerName}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(booking.created_at).toLocaleDateString()} at{' '}
            {new Date(booking.created_at).toLocaleTimeString()}
          </div>
        </div>
      </div>
      
      <div className="text-right space-y-2">
        <Badge className={statusColors[booking.booking_status as keyof typeof statusColors] || ''}>
          {booking.booking_status}
        </Badge>
        {booking.total_amount && (
          <div className="text-sm font-semibold">
            ${booking.total_amount.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}
