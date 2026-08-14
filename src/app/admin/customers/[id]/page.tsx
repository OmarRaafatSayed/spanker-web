"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CustomerDetail {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  role: "admin" | "staff" | "customer";
  created_at: string;
  updated_at: string;
  sync_status?: "synced" | "pending" | "failed";
  sync_error?: string;
}

interface TravelRequest {
  id: string;
  destination_country: string;
  travel_type: "visa_only" | "visa_flight" | "visa_hotel" | "full_package";
  status: "pending_documents" | "documents_review" | "docs_approved" | "in_progress" | "completed" | "cancelled";
  traveler_count: number;
  departure_date?: string;
  created_at: string;
  documents_completion_percent: number;
}

interface CustomerDocument {
  id: string;
  travel_request_id: string;
  document_type: string;
  file_name?: string;
  status: "uploaded" | "under_review" | "approved" | "rejected" | "expired";
  created_at: string;
  file_path?: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending_documents: { label: "بانتظار المستندات", cls: "bg-yellow-100 text-yellow-700" },
  documents_review: { label: "قيد المراجعة", cls: "bg-blue-100 text-blue-700" },
  docs_approved: { label: "مستندات مقبولة", cls: "bg-indigo-100 text-indigo-700" },
  in_progress: { label: "جاري التنفيذ", cls: "bg-purple-100 text-purple-700" },
  completed: { label: "مكتمل", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "ملغي", cls: "bg-gray-100 text-gray-600" },
};

const DOCUMENT_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  uploaded: { label: "مرفوع", cls: "bg-blue-100 text-blue-700" },
  under_review: { label: "قيد المراجعة", cls: "bg-yellow-100 text-yellow-700" },
  approved: { label: "موافق عليه", cls: "bg-green-100 text-green-700" },
  rejected: { label: "مرفوض", cls: "bg-red-100 text-red-700" },
  expired: { label: "منتهي الصلاحية", cls: "bg-gray-100 text-gray-700" },
};

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  async function fetchCustomerData() {
    try {
      setLoading(true);
      setError(null);

      const [customerRes, requestsRes, documentsRes] = await Promise.all([
        fetch(`/api/admin/customers/${customerId}`),
        fetch(`/api/admin/customers/${customerId}/travel-requests`),
        fetch(`/api/admin/customers/${customerId}/documents`),
      ]);

      if (!customerRes.ok) {
        throw new Error("فشل في جلب بيانات العميل");
      }

      const customerData = await customerRes.json();
      setCustomer(customerData.customer);

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setRequests(requestsData.requests || []);
      }

      if (documentsRes.ok) {
        const documentsData = await documentsRes.json();
        setDocuments(documentsData.documents || []);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-border-light p-8 text-center">
        <p className="text-text-secondary">جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700 font-medium">⚠️ {error || "لم يتم العثور على العميل"}</p>
        <Link href="/admin/customers" className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          العودة إلى القائمة
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/customers" className="text-primary-600 hover:text-primary-700">
          ← العودة
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{customer.full_name}</h1>
          <p className="text-text-secondary mt-1">معرف العميل: {customer.user_id}</p>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-lg border border-border-light p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-text-secondary font-medium mb-1">الهاتف</p>
            <p className="text-lg text-text-primary font-semibold">{customer.phone}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium mb-1">الدور</p>
            <p className="text-lg text-text-primary font-semibold">
              {customer.role === "customer" ? "عميل" : customer.role === "staff" ? "موظف" : "مسؤول"}
            </p>
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium mb-1">تاريخ الانضمام</p>
            <p className="text-lg text-text-primary font-semibold">
              {new Date(customer.created_at).toLocaleDateString("ar-EG")}
            </p>
          </div>
        </div>

        {/* Sync Status */}
        {customer.sync_status && (
          <div className="mt-6 pt-6 border-t border-border-light">
            <p className="text-sm text-text-secondary font-medium mb-2">حالة المزامنة</p>
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                customer.sync_status === "synced"
                  ? "bg-green-100 text-green-700"
                  : customer.sync_status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              )}>
                {customer.sync_status === "synced" ? "✓ مزامن" : customer.sync_status === "pending" ? "⏳ قيد الانتظار" : "✗ فشل"}
              </span>
              {customer.sync_error && (
                <span className="text-xs text-red-600">{customer.sync_error}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Travel Requests Section */}
      <div className="bg-white rounded-lg border border-border-light p-6 mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-4">طلبات السفر</h2>

        {requests.length === 0 ? (
          <p className="text-text-secondary py-8 text-center">لا توجد طلبات سفر</p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border border-border-light rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-text-primary">
                        {request.destination_country}
                      </h3>
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                        STATUS_CONFIG[request.status].cls
                      )}>
                        {STATUS_CONFIG[request.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">
                      نوع الرحلة: {request.travel_type === "visa_only" ? "فيزا فقط" : request.travel_type === "visa_flight" ? "فيزا + طيران" : request.travel_type === "visa_hotel" ? "فيزا + فندق" : "باقة كاملة"}
                    </p>
                    <p className="text-sm text-text-secondary">
                      عدد المسافرين: {request.traveler_count}
                    </p>
                    {request.departure_date && (
                      <p className="text-sm text-text-secondary">
                        تاريخ المغادرة: {new Date(request.departure_date).toLocaleDateString("ar-EG")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-xs text-text-secondary">اكتمال المستندات</p>
                      <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-primary-500 transition-all"
                          style={{ width: `${request.documents_completion_percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-text-secondary mt-1">{request.documents_completion_percent}%</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg border border-border-light p-6">
        <h2 className="text-2xl font-bold text-text-primary mb-4">المستندات المرفوعة</h2>

        {documents.length === 0 ? (
          <p className="text-text-secondary py-8 text-center">لم يتم رفع أي مستندات</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-border-light">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary">نوع المستند</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary">اسم الملف</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary">الحالة</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary">تاريخ الرفع</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-text-secondary">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-text-primary font-medium">{doc.document_type}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{doc.file_name || "—"}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                        DOCUMENT_STATUS_CONFIG[doc.status].cls
                      )}>
                        {DOCUMENT_STATUS_CONFIG[doc.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {new Date(doc.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {doc.file_path ? (
                        <a
                          href={doc.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          تحميل
                        </a>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
