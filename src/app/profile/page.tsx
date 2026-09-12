"use client"

import { useAuth, supabase } from "@/modules/auth"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

function StatCard({ label, value, color, icon }: {
  label: string
  value: string | number
  color: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 flex items-start gap-2 sm:gap-3 hover:shadow-md transition-shadow">
      <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0", color)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs font-medium text-gray-600 mt-0.5 sm:mt-1">{label}</p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  })
  const router = useRouter()

  useEffect(() => {
    if (user) {
      void supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setProfile(data)
          if (data) {
            setEditData({
              first_name: data.first_name || "",
              last_name: data.last_name || "",
              phone: data.phone || "",
            })
          }
          setLoading(false)
        })
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(editData)
        .eq("user_id", user.id)
        .select()
        .single()

      if (!error && data) {
        setProfile(data)
        setEditing(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-sm sm:text-base">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email || ""

  const initial = (profile?.first_name?.[0] || user?.email?.[0] || "U").toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 sm:pt-24 pb-4 px-3 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="relative bg-gradient-to-br from-green-600 via-green-600 to-emerald-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 text-white overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 sm:w-64 sm:h-64 bg-white/10 rounded-full -translate-y-20 translate-x-20 sm:-translate-y-32 sm:translate-x-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-black/10 rounded-full translate-y-32 -translate-x-32 sm:translate-y-48 sm:-translate-x-48 blur-3xl" />
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl font-bold border-4 border-white/30 shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm opacity-90 mb-0.5 sm:mb-1">مرحبا بك</p>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 truncate">{displayName}</h1>
              <p className="text-xs sm:text-sm opacity-80 flex items-center gap-2 truncate">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span className="truncate">{user?.email}</span>
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 lg:px-5 py-2 lg:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all border border-white/30 font-semibold text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span className="hidden lg:inline">الموقع الرئيسي</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 lg:px-5 py-2 lg:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl transition-all border border-white/30 font-semibold text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="hidden lg:inline">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="طلبات الفيزا"
            value={0}
            color="bg-blue-50 text-blue-600"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            }
          />
          <StatCard
            label="المستندات"
            value={0}
            color="bg-purple-50 text-purple-600"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            }
          />
          <StatCard
            label="الإشعارات"
            value={0}
            color="bg-amber-50 text-amber-600"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            }
          />
          <StatCard
            label="الطلبات النشطة"
            value={0}
            color="bg-green-50 text-green-600"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>معلومات الحساب</span>
                </h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-green-600 hover:bg-green-50 rounded-lg transition-colors w-full sm:w-auto"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    تعديل
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(false)
                        setEditData({
                          first_name: profile?.first_name || "",
                          last_name: profile?.last_name || "",
                          phone: profile?.phone || "",
                        })
                      }}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {saving ? "جاري الحفظ..." : "حفظ"}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="text-right">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">الاسم الأول</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editData.first_name}
                      onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors text-gray-900 font-medium text-sm sm:text-base"
                      placeholder="أدخل الاسم الأول"
                    />
                  ) : (
                    <p className="text-sm sm:text-base font-semibold text-gray-900 bg-gray-50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl truncate">
                      {profile?.first_name || "-"}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">الاسم الأخير</label>
                  {editing ? (
                    <input
                      type="text"
                      value={editData.last_name}
                      onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors text-gray-900 font-medium text-sm sm:text-base"
                      placeholder="أدخل الاسم الأخير"
                    />
                  ) : (
                    <p className="text-sm sm:text-base font-semibold text-gray-900 bg-gray-50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl truncate">
                      {profile?.last_name || "-"}
                    </p>
                  )}
                </div>

                <div className="text-right sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني</label>
                  <p className="text-sm sm:text-base font-semibold text-gray-500 bg-gray-50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl flex items-center gap-2 truncate">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <span className="truncate">{user?.email}</span>
                  </p>
                </div>

                <div className="text-right sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">رقم الهاتف</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors text-gray-900 font-medium text-sm sm:text-base"
                      placeholder="أدخل رقم الهاتف"
                    />
                  ) : (
                    <p className="text-sm sm:text-base font-semibold text-gray-900 bg-gray-50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl">
                      {profile?.phone || "-"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                الأمان
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">كلمة المرور</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">آخر تغيير منذ 30 يوم</p>
                  </div>
                  <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-green-600 hover:bg-green-50 rounded-lg transition-colors w-full sm:w-auto">
                    تغيير
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">المصادقة الثنائية</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">غير مفعلة</p>
                  </div>
                  <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-green-600 hover:bg-green-50 rounded-lg transition-colors w-full sm:w-auto">
                    تفعيل
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                وصول سريع
              </h3>
              <div className="space-y-2">
                {[
                  {
                    href: "/requests",
                    label: "طلباتي",
                    icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>,
                    badge: "0"
                  },
                  {
                    href: "/notifications",
                    label: "الإشعارات",
                    icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
                    badge: "0"
                  },
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between p-2.5 sm:p-3 hover:bg-gray-50 rounded-lg sm:rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {item.icon}
                        </svg>
                      </div>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">{item.badge}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">النشاط الأخير</h3>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1 sm:mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">تسجيل دخول جديد</p>
                    <p className="text-gray-600 text-xs mt-0.5 sm:mt-1">منذ بضع دقائق</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sm:hidden flex gap-3">
              <Link
                href="/"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-semibold shadow-lg"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                الموقع الرئيسي
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-semibold shadow-lg"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}