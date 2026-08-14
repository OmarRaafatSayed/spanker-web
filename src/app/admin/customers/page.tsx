"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

type CustomerRole = "admin" | "staff" | "customer";

interface Customer {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  role: CustomerRole;
  created_at: string;
  updated_at: string;
  travel_requests_count?: number;
  documents_count?: number;
  sync_status?: "synced" | "pending" | "failed";
}

const ROLE_LABELS: Record<CustomerRole, { label: string; cls: string }> = {
  customer: { label: "عميل", cls: "bg-blue-100 text-blue-700" },
  staff: { label: "موظف", cls: "bg-purple-100 text-purple-700" },
  admin: { label: "مسؤول", cls: "bg-red-100 text-red-700" },
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "customer" | "staff" | "admin">("all");
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/admin/customers");
      if (!response.ok) {
        throw new Error(`خطأ في جلب العملاء: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      setError(message);
      console.error("[admin/customers] Error:", message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = customers.filter(customer => {
    const matchSearch = !search || 
      customer.full_name.includes(search) || 
      customer.phone.includes(search) ||
      customer.user_id.includes(search);
    
    const matchFilter = filter === "all" || customer.role === filter;
    
    return matchSearch && matchFilter;
  });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">إدارة العملاء</h1>
        <p className="text-text-secondary mt-2">عرض وإدارة جميع العملاء والموظفين في النظام</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="إجمالي العملاء"
          value={customers.filter(c => c.role === "customer").length}
          cls="bg-blue-50"
        />
        <StatCard
          label="الموظفون"
          value={customers.filter(c => c.role === "staff").length}
          cls="bg-purple-50"
        />
        <StatCard
          label="المسؤولون"
          value={customers.filter(c => c.role === "admin").length}
          cls="bg-red-50"
        />
        <StatCard
          label="جديد هذا الشهر"
          value={customers.filter(c => {
            const created = new Date(c.created_at);
            const now = new Date();
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
          }).length}
          cls="bg-green-50"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-border-light p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="ابحث عن اسم، هاتف، أو معرف المستخدم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "customer", "staff", "admin"] as const).map((role) => (
              <button
                key={role}
                onClick={() => setFilter(role)}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  filter === role
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-text-secondary hover:bg-gray-200"
                )}
              >
                {role === "all" ? "الكل" : ROLE_LABELS[role as Exclude<typeof role, "all">].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg border border-border-light p-8 text-center">
          <p className="text-text-secondary">جاري تحميل البيانات...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 font-medium">⚠️ {error}</p>
          <button
            onClick={fetchCustomers}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-lg border border-border-light p-8 text-center">
          <p className="text-text-secondary">لا توجد عملاء تطابق معايير البحث</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="bg-white rounded-lg border border-border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-border-light">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary">الاسم الكامل</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary">الهاتف</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary">الدور</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary">الطلبات</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary">المستندات</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-text-secondary">تاريخ الإنشاء</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-text-secondary">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-text-primary font-medium">{customer.full_name}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{customer.phone}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                        ROLE_LABELS[customer.role].cls
                      )}>
                        {ROLE_LABELS[customer.role].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary text-center">
                      {customer.travel_requests_count || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary text-center">
                      {customer.documents_count || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {new Date(customer.created_at).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors font-medium"
                      >
                        عرض التفاصيل
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer Info */}
      {!loading && !error && (
        <div className="mt-6 text-sm text-text-secondary">
          عرض {filtered.length} من {customers.length} عميل
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  cls,
}: {
  label: string;
  value: number | string;
  cls: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border-light p-6", cls)}>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm text-text-secondary mt-2">{label}</p>
    </div>
  );
}
