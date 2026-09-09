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

const REVIEW_STATUS_LABELS: Record<string, { ar: string; color: string }> = {
  pending: { ar: "لم يُقدَّم", color: "bg-gray-100 text-gray-500" },
  submitted: { ar: "مُقدَّم", color: "bg-blue-100 text-blue-600" },
  under_review: { ar: "قيد المراجعة", color: "bg-yellow-100 text-yellow-700" },
  approved: { ar: "مقبول", color: "bg-green-100 text-green-700" },
  rejected: { ar: "مرفوض", color: "bg-red-100 text-red-600" },
  needs_more_info: { ar: "يحتاج مزيداً", color: "bg-orange-100 text-orange-600" },
};

const VISA_TYPE_AR: Record<string, string> = {
  tourist: "سياحية",
  business: "أعمال",
  student: "طالب",
  work: "عمل",
  transit: "عبور",
};

export default function AdminVisaBookingsPage() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterReviewStatus, setFilterReviewStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  
  // Review form
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    decision: "",
    notes: "",
    required_documents: "",
  });

  useEffect(() => {
    fetchBookings();
  }, [filterStatus, filterReviewStatus]);

  async function fetchBookings() {
    setLoading(true);
    try {
      let query = supabase
        .from("travel_requests")
        .select(`
          *,
          visa_details:visa_booking_details(
            *,
            visa:visas(*)
          )
        `)
        .eq("vertical", "visa")
        .order("created_at", { ascending: false });

      if (filterStatus) {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Apply review status filter in memory (since it's a nested field)
      let filtered = data || [];
      if (filterReviewStatus) {
        filtered = filtered.filter(
          (b: any) => b.visa_details?.[0]?.review_status === filterReviewStatus
        );
      }

      setBookings(filtered);
    } catch (e: any) {
      console.error("Error fetching visa bookings:", e);
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

  async function submitReview() {
    if (!selectedBooking || !reviewForm.decision) {
      setActionError("يرجى اختيار القرار");
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      const visaDetailId = selectedBooking.visa_details?.[0]?.id;
      if (!visaDetailId) throw new Error("معرف التأشيرة غير موجود");

      const body: any = {
        decision: reviewForm.decision,
        notes: reviewForm.notes || undefined,
      };

      if (
        reviewForm.decision === "needs_more_info" &&
        reviewForm.required_documents
      ) {
        body.required_documents = reviewForm.required_documents
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }

      const res = await fetch(`/api/v1/visas/${visaDetailId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);

      setActionSuccess("تم تسجيل قرار المراجعة بنجاح ✓");
      setShowReviewDialog(false);
      setReviewForm({ decision: "", notes: "", required_documents: "" });
      fetchBookings();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  function openReviewDialog(booking: any) {
    setSelectedBooking(booking);
    setReviewForm({ decision: "", notes: "", required_documents: "" });
    setActionError(null);
    setShowReviewDialog(true);
  }

  const filteredBookings = bookings.filter((b) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const visaDetail = b.visa_details?.[0];
    return (
      b.reference?.toLowerCase().includes(searchLower) ||
      visaDetail?.visa?.destination_country?.toLowerCase().includes(searchLower) ||
      visaDetail?.applicant?.first_name?.toLowerCase().includes(searchLower) ||
      visaDetail?.applicant?.last_name?.toLowerCase().includes(searchLower) ||
      visaDetail?.applicant?.passport_number?.toLowerCase().includes(searchLower) ||
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
            <span className="text-2xl">🛂</span>
            حجوزات التأشيرات
          </h1>
          <p className="text-sm text-text-muted mt-1">
            إجمالي: {bookings.length} طلب تأشيرة
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

        <select
          value={filterReviewStatus}
          onChange={(e) => setFilterReviewStatus(e.target.value)}
          className="h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white"
        >
          <option value="">كل حالات المراجعة</option>
          {Object.entries(REVIEW_STATUS_LABELS).map(([v, { ar }]) => (
            <option key={v} value={v}>
              {ar}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث برقم الحجز، الوجهة، المتقدم، الجواز..."
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
                  الوجهة
                </th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">
                  المتقدم
                </th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">
                  الجواز
                </th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary">
                  حالة المراجعة
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
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-text-muted">
                    لا توجد حجوزات تأشيرات
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking: any) => {
                  const visaDetail = booking.visa_details?.[0];
                  const visa = visaDetail?.visa;
                  const status = STATUS_LABELS[booking.status];
                  const reviewStatus =
                    REVIEW_STATUS_LABELS[visaDetail?.review_status];

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
                          {visa?.destination_country || "—"}
                        </p>
                        <p className="text-xs text-text-muted">
                          {VISA_TYPE_AR[visa?.visa_type] || visa?.visa_type}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-text-primary">
                          {visaDetail?.applicant?.first_name}{" "}
                          {visaDetail?.applicant?.last_name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {visaDetail?.applicant?.nationality}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                        {visaDetail?.applicant?.passport_number || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${reviewStatus?.color}`}
                        >
                          {reviewStatus?.ar}
                        </span>
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
                          className="flex gap-1.5 flex-wrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {["submitted", "under_review"].includes(
                            visaDetail?.review_status
                          ) && (
                            <button
                              onClick={() => openReviewDialog(booking)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                              مراجعة
                            </button>
                          )}
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
        {selectedBooking && !showReviewDialog && (
          <div className="border-t border-border-light p-5 bg-gradient-to-b from-brand-green/5 to-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Visa Details */}
              <div className="space-y-3">
                <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                  <span className="text-lg">🛂</span>
                  تفاصيل التأشيرة
                </h3>
                {selectedBooking.visa_details?.[0] && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">الوجهة:</span>
                      <span className="font-semibold">
                        {selectedBooking.visa_details[0].visa?.destination_country}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">نوع التأشيرة:</span>
                      <span className="font-semibold">
                        {VISA_TYPE_AR[
                          selectedBooking.visa_details[0].visa?.visa_type
                        ] || selectedBooking.visa_details[0].visa?.visa_type}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">مدة المعالجة:</span>
                      <span className="font-semibold">
                        {selectedBooking.visa_details[0].visa?.processing_days} يوم
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">الصلاحية:</span>
                      <span className="font-semibold">
                        {selectedBooking.visa_details[0].visa?.validity_months} شهر
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">مدة الإقامة:</span>
                      <span className="font-semibold">
                        {selectedBooking.visa_details[0].visa?.max_stay_days} يوم
                      </span>
                    </div>

                    {/* Applicant Info */}
                    <div className="mt-4 pt-4 border-t border-border-light">
                      <p className="font-semibold text-text-primary mb-2">
                        بيانات المتقدم
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-muted">الاسم:</span>
                          <span className="font-semibold">
                            {selectedBooking.visa_details[0].applicant?.first_name}{" "}
                            {selectedBooking.visa_details[0].applicant?.last_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">الجنسية:</span>
                          <span className="font-semibold">
                            {selectedBooking.visa_details[0].applicant?.nationality}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">تاريخ الميلاد:</span>
                          <span className="font-semibold">
                            {selectedBooking.visa_details[0].applicant
                              ?.date_of_birth
                              ? new Date(
                                  selectedBooking.visa_details[0].applicant.date_of_birth
                                ).toLocaleDateString("ar-EG")
                              : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">رقم الجواز:</span>
                          <span className="font-mono font-semibold">
                            {selectedBooking.visa_details[0].applicant?.passport_number}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">انتهاء الجواز:</span>
                          <span className="font-semibold">
                            {selectedBooking.visa_details[0].applicant?.passport_expiry
                              ? new Date(
                                  selectedBooking.visa_details[0].applicant.passport_expiry
                                ).toLocaleDateString("ar-EG")
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Travel Info */}
                    {selectedBooking.visa_details[0].purpose_of_travel && (
                      <div className="mt-4 pt-4 border-t border-border-light">
                        <p className="font-semibold text-text-primary mb-2">
                          معلومات السفر
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-text-muted">الغرض:</span>
                            <span className="font-semibold">
                              {selectedBooking.visa_details[0].purpose_of_travel}
                            </span>
                          </div>
                          {selectedBooking.visa_details[0].intended_travel_date && (
                            <div className="flex justify-between">
                              <span className="text-text-muted">تاريخ السفر:</span>
                              <span className="font-semibold">
                                {new Date(
                                  selectedBooking.visa_details[0].intended_travel_date
                                ).toLocaleDateString("ar-EG")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Review Notes */}
                    {selectedBooking.visa_details[0].review_notes && (
                      <div className="mt-4 pt-4 border-t border-border-light">
                        <p className="font-semibold text-text-primary mb-2">
                          ملاحظات المراجعة
                        </p>
                        <p className="text-sm text-text-secondary bg-yellow-50 p-3 rounded-lg">
                          {selectedBooking.visa_details[0].review_notes}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Booking Info */}
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
                {selectedBooking.visa_details?.[0]?.submitted_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">تاريخ التقديم:</span>
                    <span className="font-semibold">
                      {new Date(
                        selectedBooking.visa_details[0].submitted_at
                      ).toLocaleString("ar-EG")}
                    </span>
                  </div>
                )}
                {selectedBooking.expires_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">ينتهي في:</span>
                    <span className="font-semibold text-yellow-600">
                      {new Date(selectedBooking.expires_at).toLocaleString("ar-EG")}
                    </span>
                  </div>
                )}

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

                {/* Documents */}
                {selectedBooking.visa_details?.[0]?.documents &&
                  Object.keys(selectedBooking.visa_details[0].documents).length >
                    0 && (
                    <div className="mt-4 pt-4 border-t border-border-light">
                      <h4 className="font-semibold text-text-primary mb-2">
                        المستندات المرفقة
                      </h4>
                      <div className="space-y-1">
                        {Object.entries(
                          selectedBooking.visa_details[0].documents
                        ).map(([key, value]: [string, any]) => (
                          <div
                            key={key}
                            className="flex justify-between text-xs bg-white p-2 rounded-lg"
                          >
                            <span className="text-text-muted">{key}:</span>
                            <a
                              href={value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              عرض
                            </a>
                          </div>
                        ))}
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

      {/* Review Dialog */}
      {showReviewDialog && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">
                مراجعة طلب التأشيرة
              </h3>
              <button
                onClick={() => {
                  setShowReviewDialog(false);
                  setActionError(null);
                }}
                className="text-text-muted hover:text-text-primary text-xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-3 bg-muted/30 rounded-lg text-sm">
              <p>
                <strong>المرجع:</strong>{" "}
                <span className="text-brand-green font-mono">
                  {selectedBooking.reference}
                </span>
              </p>
              <p>
                <strong>المتقدم:</strong>{" "}
                {selectedBooking.visa_details?.[0]?.applicant?.first_name}{" "}
                {selectedBooking.visa_details?.[0]?.applicant?.last_name}
              </p>
              <p>
                <strong>الوجهة:</strong>{" "}
                {selectedBooking.visa_details?.[0]?.visa?.destination_country}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  القرار *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["approve", "قبول", "bg-green-50 border-green-300 text-green-700"],
                    ["reject", "رفض", "bg-red-50 border-red-300 text-red-600"],
                    [
                      "needs_more_info",
                      "يحتاج مزيداً",
                      "bg-orange-50 border-orange-300 text-orange-600",
                    ],
                  ].map(([v, l, cls]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        setReviewForm((f) => ({ ...f, decision: v }))
                      }
                      className={`py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                        reviewForm.decision === v
                          ? cls
                          : "border-border-light text-text-muted hover:bg-muted"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  ملاحظات
                </label>
                <textarea
                  rows={3}
                  value={reviewForm.notes}
                  onChange={(e) =>
                    setReviewForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none"
                  placeholder="أضف ملاحظاتك هنا..."
                />
              </div>

              {reviewForm.decision === "needs_more_info" && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">
                    المستندات المطلوبة (مفصولة بفاصلة)
                  </label>
                  <input
                    value={reviewForm.required_documents}
                    onChange={(e) =>
                      setReviewForm((f) => ({
                        ...f,
                        required_documents: e.target.value,
                      }))
                    }
                    placeholder="bank_statement, employment_letter"
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
              )}

              {actionError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
                  {actionError}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowReviewDialog(false);
                  setActionError(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-muted transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={submitReview}
                disabled={actionLoading || !reviewForm.decision}
                className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-all disabled:opacity-60"
              >
                {actionLoading ? "جاري الإرسال..." : "تأكيد القرار"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}