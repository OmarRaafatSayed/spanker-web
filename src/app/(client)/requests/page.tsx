"use client"

import { useState } from "react"
import Link from "next/link"
import { useRequests }    from "@/modules/portal/hooks/useRequests"
import { RequestCard }    from "@/modules/portal/components/RequestCard"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { Button }         from "@/components/ui/button"
import { AlertCircle, FileText, Package } from "lucide-react"
import type { RequestStatus } from "@/modules/portal/types/portal.types"

const STATUS_FILTERS: { value: string; label: string; labelAr: string }[] = [
  { value: "",           label: "All", labelAr: "الكل" },
  { value: "new",        label: "New", labelAr: "جديد" },
  { value: "in_review",  label: "In Review", labelAr: "قيد المراجعة" },
  { value: "quoted",     label: "Quoted", labelAr: "تم التسعير" },
  { value: "booked",     label: "Booked", labelAr: "محجوز" },
  { value: "completed",  label: "Completed", labelAr: "مكتمل" },
  { value: "cancelled",  label: "Cancelled", labelAr: "ملغي" },
]

export default function RequestsPage() {
  const [statusFilter, setStatusFilter] = useState("")
  const { requests, total, isLoading, error, refresh } = useRequests({
    status_filter: statusFilter || undefined,
    limit: 20,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 sm:pt-24 pb-4 px-3 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                طلباتي
              </h1>
              {!isLoading && (
                <p className="text-sm text-gray-600 mt-1">
                  {total} {total === 1 ? "طلب" : total === 2 ? "طلبان" : "طلبات"} إجمالا
                </p>
              )}
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm shadow-md hover:shadow-lg"
            >
              <Package className="w-4 h-4" />
              حجز جديد
            </Link>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">كيف تظهر الطلبات هنا</p>
              <p className="text-blue-700">
                عند حجزك لأي خدمة (طيران فنادق فيزا جولات سياحية) من الصفحة الرئيسية 
                سيتم إنشاء طلب تلقائيا وعرضه هنا لمتابعة حالته ورفع المستندات المطلوبة.
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  statusFilter === f.value
                    ? "bg-green-600 text-white border-green-600 shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:text-green-600 hover:border-green-600 hover:shadow-sm"
                }`}
              >
                {f.labelAr}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mb-4" />
              <p className="text-gray-600 font-medium">جاري التحميل...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-semibold">{error}</p>
              <Button variant="outline" onClick={refresh}>إعادة المحاولة</Button>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {statusFilter ? `لا توجد طلبات ${STATUS_FILTERS.find(f => f.value === statusFilter)?.labelAr}` : "لا توجد طلبات بعد"}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {statusFilter 
                    ? "جرب تغيير الفلتر لعرض طلبات أخرى"
                    : "ابدأ بحجز خدمة من الصفحة الرئيسية وسيظهر طلبك هنا تلقائيا"}
                </p>
              </div>
              {!statusFilter && (
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                >
                  <Package className="w-5 h-5" />
                  تصفح الخدمات المتاحة
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}