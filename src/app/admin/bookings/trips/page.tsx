"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUS_LABELS: Record<string, { ar: string; color: string }> = {
  draft: { ar: "مسودة", color: "bg-gray-100 text-gray-600" },
  pending: { ar: "قيد الانتظار", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { ar: "مؤكد", color: "bg-green-100 text-green-700" },
  cancelled: { ar: "ملغي", color: "bg-red-100 text-red-600" },
  expired: { ar: "منتهي", color: "bg-gray-100 text-gray-500" },
  refunded: { ar: "مسترد", color: "bg-blue-100 text-blue-600" },
  completed: { ar: "مكتمل", color: "bg-emerald-100 text-emerald-700" },
};

export default function AdminTripBookingsPage() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [filterStatus]);

  async function fetchBookings() {
    setLoading(true);
    try {
      let query = supabase
        .from("travel_requests")
        .select(`
          *,
          trip_details:trip_booking_details(
            *,
            trip:trips(*)
          )
        `)
        .eq("vertical", "trip")
        .order("created_at", { ascending: false });

      if (filterStatus) {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      setBookings(data || []);
    } catch (e: any) {
      console.error("Error fetching trip bookings:", e);
    } finally {
      setLoading(false);
    }
  }

  async function confirmBooking(bookingId: string) {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "تأكيد من الإدارة" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setActionSuccess("تم تأكيد الحجز بنجاح ✓");
      setSelectedBooking(null);
      fetchBookings();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelBooking(bookingId: string) {
    if (!confirm("هل أنت متأكد من إلغاء هذا الحجز؟")) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "إلغاء من الإدارة" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setActionSuccess(
        `تم الإلغاء بنجاح — مبلغ الاسترداد: ${json.data?.refund_amount?.toLocaleString() ?? 0} ج.م`
      );
      setSelectedBooking(null);
      fetchBookings();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  function calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  const filteredBookings = bookings.filter((b) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const tripDetail = b.trip_details?.[0];
    return (
      b.reference?.toLowerCase().includes(searchLower) ||
      tripDetail?.trip?.title?.toLowerCase().includes(searchLower) ||
      tripDetail?.trip?.destination?.toLowerCase().includes(searchLower) ||
      tripDetail?.lead_traveler?.first_name?.toLowerCase().includes(searchLower) ||
      tripDetail?.lead_traveler?.last_name?.toLowerCase().includes(searchLower) ||
      b.contact?.email?.toLowerCase().includes(searchLower) ||
      b.contact?.phone?.includes(search)
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            حجوزات الرحلات السياحية
          </h1>
          <p className="text-sm text-text-muted mt-1">
            إجمالي: {bookings.length} حجز رحلة سياحية
          </p>
        </div>
        {actionSuccess && (
          <div className="text-sm bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl font-medium">
            {actionSuccess}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white"
        >
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_LABELS).map(([v, { ar }]) => (
            <option key={v} value={v}>
              {ar}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث برقم الحجز، الرحلة، الوجهة، المسافر..."
          className="flex-1 min-w-[250px] h-10 px-4 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white"
        />

        <button
          onClick={() => fetchBookings()}
          className="h-10 px-4 rounded-xl border border-border-default text-sm hover:bg-muted transition-all flex items-center gap-2"
        >
          <span>🔄</span> تحديث
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-muted/50">
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">
                  رقم الحجز
                </th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">
                  الرحلة
                </th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">
                  الوجهة
                </th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">
                  التاريخ
                </th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">
                  المدة
                </th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">
                  المسافرون
                </th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">
                  المبلغ
                </th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">
                  الحالة
                </th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-light animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 text-text-muted"
                  >
                    لا توجد حجوزات رحلات سياحية
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking: any) => {
                  const tripDetail = booking.trip_details?.[0];
                  const trip = tripDetail?.trip;
                  const status = STATUS_LABELS[booking.status];
                  const duration =
                    trip?.start_date && trip?.end_date
                      ? calculateDuration(trip.start_date, trip.end_date)
                      : 0;

                  return (
                    <tr
                      key={booking.id}
                      className={`border-b border-border-light hover:bg-muted/30 transition-colors cursor-pointer ${
                        selectedBooking?.id === booking.id
                          ? "bg-brand-green/5"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedBooking(
                          selectedBooking?.id === booking.id ? null : booking
                        )
                      }
                    >
                      <td className="px-4 py-3 font-mono font-bold text-xs text-brand-green">
                        {booking.reference}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-text-primary">
                          {trip?.title || "—"}
                        </p>
                        {trip?.trip_type && (
                          <p className="text-xs text-text-muted capitalize">
                            {trip.trip_type}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {trip?.destination || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {trip?.start_date ? (
                          <>
                            {new Date(trip.start_date).toLocaleDateString("ar-EG")}
                            <br />→{" "}
                            {new Date(trip.end_date).toLocaleDateString("ar-EG")}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-brand-green">
                          {duration}
                        </span>
                        <span className="text-xs text-text-muted block">
                          {duration === 1 ? "يوم" : "أيام"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        {tripDetail?.travelers || 0}
                      </td>
                      <td className="px-4 py-3 font-bold text-text-primary">
                        {booking.total_amount?.toLocaleString() || 0} ج.م
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${status?.color}`}
                        >
                          {status?.ar}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {booking.status === "pending" && (
                            <button
                              onClick={() => confirmBooking(booking.id)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg bg-brand-green text-white text-xs font-medium hover:bg-brand-green-dark transition-all disabled:opacity-50"
                            >
                              تأكيد
                            </button>
                          )}
                          {["pending", "confirmed"].includes(booking.status) && (
                            <button
                              onClick={() => cancelBooking(booking.id)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-all disabled:opacity-50"
                            >
                              إلغاء
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Expanded Details */}
        {selectedBooking && (
          <div className="border-t border-border-light p-5 bg-gradient-to-b from-brand-green/5 to-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trip Details */}
              <div className="space-y-3">
                <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                  <span className="text-lg">🗺️</span>
                  تفاصيل الرحلة
                </h3>
                {selectedBooking.trip_details?.[0] && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">عنوان الرحلة:</span>
                      <span className="font-semibold">
                        {selectedBooking.trip_details[0].trip?.title}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">الوجهة:</span>
                      <span className="font-semibold">
                        {selectedBooking.trip_details[0].trip?.destination}
                      </span>
                    </div>
                    {selectedBooking.trip_details[0].trip?.trip_type && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">نوع الرحلة:</span>
                        <span className="font-semibold capitalize">
                          {selectedBooking.trip_details[0].trip.trip_type}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">تاريخ البداية:</span>
                      <span className="font-semibold">
                        {new Date(
                          selectedBooking.trip_details[0].trip?.start_date
                        ).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">تاريخ النهاية:</span>
                      <span className="font-semibold">
                        {new Date(
                          selectedBooking.trip_details[0].trip?.end_date
                        ).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">المدة:</span>
                      <span className="font-bold text-brand-green">
                        {calculateDuration(
                          selectedBooking.trip_details[0].trip?.start_date,
                          selectedBooking.trip_details[0].trip?.end_date
                        )}{" "}
                        {calculateDuration(
                          selectedBooking.trip_details[0].trip?.start_date,
                          selectedBooking.trip_details[0].trip?.end_date
                        ) === 1
                          ? "يوم"
                          : "أيام"}
                      </span>
                    </div>
                    {selectedBooking.trip_details[0].trip?.difficulty && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">مستوى الصعوبة:</span>
                        <span className="font-semibold capitalize">
                          {selectedBooking.trip_details[0].trip.difficulty}
                        </span>
                      </div>
                    )}

                    {/* Trip Description */}
                    {selectedBooking.trip_details[0].trip?.description_ar && (
                      <div className="mt-4 pt-4 border-t border-border-light">
                        <p className="font-semibold text-text-primary mb-2">
                          وصف الرحلة
                        </p>
                        <p className="text-sm text-text-secondary bg-white p-3 rounded-lg leading-relaxed">
                          {selectedBooking.trip_details[0].trip.description_ar}
                        </p>
                      </div>
                    )}

                    {/* Itinerary */}
                    {selectedBooking.trip_details[0].trip?.itinerary &&
                      selectedBooking.trip_details[0].trip.itinerary.length >
                        0 && (
                        <div className="mt-4 pt-4 border-t border-border-light">
                          <p className="font-semibold text-text-primary mb-2">
                            البرنامج اليومي
                          </p>
                          <div className="space-y-2">
                            {selectedBooking.trip_details[0].trip.itinerary.map(
                              (day: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="bg-white p-3 rounded-lg text-xs"
                                >
                                  <p className="font-semibold text-brand-green">
                                    اليوم {day.day_number}:{" "}
                                    {day.title || "بدون عنوان"}
                                  </p>
                                  <p className="text-text-muted mt-1">
                                    {day.description || "—"}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Inclusions & Exclusions */}
                    <div className="mt-4 pt-4 border-t border-border-light">
                      {selectedBooking.trip_details[0].trip?.inclusions &&
                        selectedBooking.trip_details[0].trip.inclusions.length >
                          0 && (
                          <div className="mb-3">
                            <p className="font-semibold text-text-primary mb-1 text-xs">
                              ✓ يشمل:
                            </p>
                            <ul className="text-xs text-text-secondary space-y-1">
                              {selectedBooking.trip_details[0].trip.inclusions.map(
                                (item: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span className="text-green-600">•</span>
                                    <span>{item}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      {selectedBooking.trip_details[0].trip?.exclusions &&
                        selectedBooking.trip_details[0].trip.exclusions.length >
                          0 && (
                          <div>
                            <p className="font-semibold text-text-primary mb-1 text-xs">
                              ✗ لا يشمل:
                            </p>
                            <ul className="text-xs text-text-secondary space-y-1">
                              {selectedBooking.trip_details[0].trip.exclusions.map(
                                (item: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span className="text-red-600">•</span>
                                    <span>{item}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </>
                )}
              </div>

              {/* Booking & Traveler Info */}
              <div className="space-y-3">
                <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  معلومات الحجز
                </h3>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">رقم المرجع:</span>
                  <span className="font-mono font-bold text-brand-green">
                    {selectedBooking.reference}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">عدد المسافرين:</span>
                  <span className="font-bold text-brand-green text-lg">
                    {selectedBooking.trip_details?.[0]?.travelers || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">المبلغ الإجمالي:</span>
                  <span className="font-bold text-lg text-brand-green">
                    {selectedBooking.total_amount?.toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">تاريخ الحجز:</span>
                  <span className="font-semibold">
                    {new Date(selectedBooking.created_at).toLocaleString("ar-EG")}
                  </span>
                </div>
                {selectedBooking.expires_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">ينتهي في:</span>
                    <span className="font-semibold text-yellow-600">
                      {new Date(selectedBooking.expires_at).toLocaleString("ar-EG")}
                    </span>
                  </div>
                )}

                {/* Lead Traveler */}
                {selectedBooking.trip_details?.[0]?.lead_traveler && (
                  <div className="mt-4 pt-4 border-t border-border-light">
                    <p className="font-semibold text-text-primary mb-2">
                      المسافر الرئيسي
                    </p>
                    <div className="bg-white p-3 rounded-lg text-sm space-y-1">
                      <p className="font-semibold">
                        {selectedBooking.trip_details[0].lead_traveler.first_name}{" "}
                        {selectedBooking.trip_details[0].lead_traveler.last_name}
                      </p>
                      {selectedBooking.trip_details[0].lead_traveler.email && (
                        <p className="text-text-muted text-xs">
                          {selectedBooking.trip_details[0].lead_traveler.email}
                        </p>
                      )}
                      {selectedBooking.trip_details[0].lead_traveler.phone && (
                        <p className="text-text-muted text-xs">
                          {selectedBooking.trip_details[0].lead_traveler.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="mt-4 pt-4 border-t border-border-light">
                  <h4 className="font-semibold text-text-primary mb-2">
                    بيانات التواصل
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">البريد:</span>
                      <span className="font-semibold">
                        {selectedBooking.contact?.email || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">الهاتف:</span>
                      <span className="font-semibold">
                        {selectedBooking.contact?.phone || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                {selectedBooking.trip_details?.[0]?.special_requests && (
                  <div className="mt-4 pt-4 border-t border-border-light">
                    <p className="font-semibold text-text-primary mb-2">
                      طلبات خاصة
                    </p>
                    <p className="text-sm text-text-secondary bg-yellow-50 p-3 rounded-lg">
                      {selectedBooking.trip_details[0].special_requests}
                    </p>
                  </div>
                )}

                {/* Pricing Breakdown */}
                {selectedBooking.trip_details?.[0]?.trip && (
                  <div className="mt-4 pt-4 border-t border-border-light">
                    <h4 className="font-semibold text-text-primary mb-2">
                      تفاصيل السعر
                    </h4>
                    <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-text-muted">سعر الفرد:</span>
                        <span className="font-semibold">
                          {selectedBooking.trip_details[0].trip.price_per_person?.toLocaleString()}{" "}
                          ج.م
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">عدد المسافرين:</span>
                        <span className="font-semibold">
                          {selectedBooking.trip_details[0].travelers}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border-light font-bold">
                        <span>الإجمالي:</span>
                        <span className="text-brand-green text-lg">
                          {selectedBooking.total_amount?.toLocaleString()} ج.م
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Spots Available */}
                {selectedBooking.trip_details?.[0]?.trip && (
                  <div className="mt-4 pt-4 border-t border-border-light">
                    <div className="flex justify-between text-sm bg-blue-50 p-3 rounded-lg">
                      <span className="text-text-muted">الأماكن المتبقية:</span>
                      <span className="font-bold text-blue-600">
                        {selectedBooking.trip_details[0].trip.spots_available} /{" "}
                        {selectedBooking.trip_details[0].trip.spots_total}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Error */}
            {actionError && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">
                ⚠️ {actionError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}