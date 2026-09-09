"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [checking, setChecking] = useState(true);
  const [staffInfo, setStaffInfo] = useState<any>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/admin/login");
        return;
      }

      const { data: staffRecord } = await supabase
        .from("staff")
        .select("role, is_active, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!staffRecord || !staffRecord.is_active) {
        router.push("/admin/login");
        return;
      }

      setStaffInfo(staffRecord);
      setChecking(false);
    } catch (err) {
      console.error("Access check error:", err);
      router.push("/admin/login");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-bg-alt flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-text-muted">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-alt">
      {/* Admin Header */}
      <header className="bg-white border-b border-border-light sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/visas" className="flex items-center gap-2">
                <img 
                  src="/assets/brand/icone-LOGO.png" 
                  alt="Spanker Logo" 
                  className="w-8 h-8 object-contain"
                />
                <span className="text-brand-dark font-bold">سبانكر</span>
              </Link>
              <span className="text-xs px-2 py-1 rounded-full bg-brand-green/10 text-brand-green font-medium">
                لوحة الإدارة
              </span>
            </div>

            <nav className="flex items-center gap-6">
              <Link 
                href="/admin/visas" 
                className="text-sm text-text-secondary hover:text-brand-green transition-colors font-medium"
              >
                إدارة التأشيرات
              </Link>
              <Link 
                href="/admin/bookings/visas" 
                className="text-sm text-text-secondary hover:text-brand-green transition-colors font-medium"
              >
                الحجوزات
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="text-sm text-right">
                <p className="font-medium text-text-primary">{staffInfo?.full_name || "موظف"}</p>
                <p className="text-xs text-text-muted">
                  {staffInfo?.role === "admin" ? "مدير" : staffInfo?.role === "reviewer" ? "مراجع" : "وكيل"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-muted transition-colors"
                title="تسجيل الخروج"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
