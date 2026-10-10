"use client"

import { useAuth, supabase } from "@/modules/auth"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Camera, Save, X, Upload, Trash2, CheckCircle, AlertCircle, 
  Plane, Hotel, FileCheck, Map, User, Phone, Globe, Calendar, Languages, Mail, Zap
} from "lucide-react"

export default function ProfileAccountPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    nationality: "",
    date_of_birth: "",
    locale: "ar" as "ar" | "en",
  })

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
              nationality: data.nationality || "",
              date_of_birth: data.date_of_birth || "",
              locale: data.locale || "ar",
            })
          }
          setLoading(false)
        })
    }
  }, [user])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !profile?.id) return

    if (!file.type.startsWith('image/')) {
      setError("الرجاء اختيار صورة صالحة")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة يجب أن يكون أقل من 5 ميجابايت")
      return
    }

    setUploadingAvatar(true)
    setError("")

    try {
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`])
        }
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id)
        .select()
        .single()

      if (updateError) throw updateError
      
      setProfile(data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || "فشل رفع الصورة")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (!user || !profile?.id) return
    setSaving(true)
    setSuccess(false)
    setError("")
    
    try {
      // Clean data: convert empty strings to null for database compatibility
      const cleanData = {
        first_name: editData.first_name.trim() || null,
        last_name: editData.last_name.trim() || null,
        phone: editData.phone.trim() || null,
        nationality: editData.nationality.trim() || null,
        date_of_birth: editData.date_of_birth.trim() || null,
        locale: editData.locale,
      }

      // Calculate completion status
      const requiredFields = ['first_name', 'last_name', 'phone', 'nationality', 'date_of_birth']
      const filledCount = requiredFields.filter(field => cleanData[field as keyof typeof cleanData]).length
      const is_profile_complete = filledCount === requiredFields.length

      // Use profile.id (primary key) instead of user_id for UPDATE
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({ 
          ...cleanData, 
          is_profile_complete,
          updated_at: new Date().toISOString()
        })
        .eq("id", profile.id)
        .select()
        .single()

      if (updateError) throw updateError
      
      setProfile(data)
      setEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Profile update error:', err)
      setError(err.message || "فشل حفظ التعديلات")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-brand-green/20" />
            <div className="absolute inset-0 rounded-full border-4 border-brand-green border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-600 font-semibold">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  const completionPercentage = () => {
    const fields = ['first_name', 'last_name', 'phone', 'nationality', 'date_of_birth']
    // Count only non-empty values (not null, not empty string, not just whitespace)
    const filled = fields.filter(f => {
      const value = profile?.[f]
      return value && String(value).trim() !== ''
    }).length
    return Math.round((filled / fields.length) * 100)
  }

  const getCompletionColor = (percent: number) => {
    if (percent === 100) return { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-200' }
    if (percent >= 60) return { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200' }
    return { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-200' }
  }

  const completion = completionPercentage()
  const colors = getCompletionColor(completion)

  const quickActions = [
    { label: "حجز رحلة", href: "/book-flight", icon: Plane, color: "from-blue-500 to-blue-600" },
    { label: "حجز فندق", href: "/hotel-booking", icon: Hotel, color: "from-purple-500 to-purple-600" },
    { label: "طلب تأشيرة", href: "/visa-application", icon: FileCheck, color: "from-emerald-500 to-emerald-600" },
    { label: "رحلة سياحية", href: "/tours", icon: Map, color: "from-amber-500 to-amber-600" },
  ]

  const countries = [
    "مصر", "السعودية", "الإمارات", "الكويت", "قطر", "البحرين", "عمان", 
    "الأردن", "لبنان", "العراق", "سوريا", "فلسطين", "اليمن", "المغرب", 
    "الجزائر", "تونس", "ليبيا", "السودان", "الصومال", "جيبوتي", "موريتانيا"
  ]

  return (
    <div className="p-3 sm:p-6 md:p-8" dir="rtl">
      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center text-white shadow-sm">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-brand-green">تم الحفظ بنجاح!</p>
            <p className="text-sm text-green-700">تم تحديث معلومات حسابك</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white shadow-sm">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-red-600">حدث خطأ!</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Profile Completion Banner */}
      <div className={`mb-6 p-5 rounded-2xl border-2 ${colors.border} bg-gradient-to-r from-white to-gray-50`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center text-white shadow-lg`}>
              {completion === 100 ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">اكتمال الملف الشخصي</h3>
              <p className="text-sm text-gray-600">أكمل معلوماتك للاستفادة من جميع الخدمات</p>
            </div>
          </div>
          <div className="text-left">
            <p className={`text-3xl font-black ${colors.text}`}>{completion}%</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full ${colors.bg} transition-all duration-500 rounded-full`}
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      {/* Avatar Section */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-gray-600" />
          <span>الصورة الشخصية</span>
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="الصورة الشخصية"
                width={120}
                height={120}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-brand-green to-emerald-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-white">
                {(profile?.first_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-right">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              حمّل صورة واضحة لك (يفضل أن تكون رسمية)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="flex items-center gap-2 h-10 px-5 text-sm font-bold text-white bg-gradient-to-r from-brand-green to-emerald-600 hover:from-brand-green-dark hover:to-emerald-700 rounded-xl transition-all shadow-md shadow-brand-green/30 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{uploadingAvatar ? 'جاري الرفع...' : 'رفع صورة'}</span>
              </button>
              {profile?.avatar_url && (
                <button
                  onClick={async () => {
                    if (!confirm('هل تريد حذف الصورة الشخصية؟')) return
                    try {
                      const { error } = await supabase
                        .from("profiles")
                        .update({ avatar_url: null })
                        .eq("user_id", user!.id)
                      if (!error) {
                        setProfile({ ...profile, avatar_url: null })
                        setSuccess(true)
                        setTimeout(() => setSuccess(false), 3000)
                      }
                    } catch (err) {
                      setError('فشل حذف الصورة')
                    }
                  }}
                  className="flex items-center gap-2 h-10 px-4 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all border-2 border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              الحد الأقصى: 5 ميجابايت • الصيغ المدعومة: JPG, PNG, GIF
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">المعلومات الشخصية</h2>
          <p className="text-sm text-gray-500">قم بتحديث بياناتك الشخصية</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 h-10 px-5 text-sm font-bold text-white bg-gradient-to-r from-brand-green to-emerald-600 hover:from-brand-green-dark hover:to-emerald-700 rounded-xl transition-all shadow-md shadow-brand-green/30 hover:shadow-lg hover:shadow-brand-green/40"
          >
            <Save className="w-4 h-4" />
            <span>تعديل</span>
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
                  nationality: profile?.nationality || "",
                  date_of_birth: profile?.date_of_birth || "",
                  locale: profile?.locale || "ar",
                })
              }}
              className="flex items-center gap-2 h-10 px-5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
              <span>إلغاء</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 h-10 px-5 text-sm font-bold text-white bg-gradient-to-r from-brand-green to-emerald-600 hover:from-brand-green-dark hover:to-emerald-700 rounded-xl transition-all shadow-md shadow-brand-green/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Form Section */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <User className="w-4 h-4 text-gray-600" />
              <span>الاسم الأول</span>
            </label>
            {editing ? (
              <input
                type="text"
                value={editData.first_name}
                onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all text-gray-900 font-semibold placeholder:text-gray-400"
                placeholder="أدخل الاسم الأول"
              />
            ) : (
              <div className="h-12 px-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl flex items-center">
                <p className="text-base font-bold text-gray-900">
                  {profile?.first_name || "—"}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <User className="w-4 h-4 text-gray-600" />
              <span>الاسم الأخير</span>
            </label>
            {editing ? (
              <input
                type="text"
                value={editData.last_name}
                onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all text-gray-900 font-semibold placeholder:text-gray-400"
                placeholder="أدخل الاسم الأخير"
              />
            ) : (
              <div className="h-12 px-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl flex items-center">
                <p className="text-base font-bold text-gray-900">
                  {profile?.last_name || "—"}
                </p>
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Mail className="w-4 h-4 text-gray-600" />
              <span>البريد الإلكتروني</span>
            </label>
            <div className="h-12 px-4 bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-xl flex items-center gap-3">
              <p className="flex-1 text-base font-bold text-gray-600">{user?.email}</p>
              <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-md">غير قابل للتعديل</span>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Phone className="w-4 h-4 text-gray-600" />
              <span>رقم الهاتف</span>
            </label>
            {editing ? (
              <input
                type="tel"
                dir="ltr"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all text-gray-900 font-semibold placeholder:text-gray-400 text-left"
                placeholder="+20 xxx xxx xxxx"
              />
            ) : (
              <div className="h-12 px-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl flex items-center">
                <p className="text-base font-bold text-gray-900" dir="ltr">
                  {profile?.phone || "—"}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Globe className="w-4 h-4 text-gray-600" />
              <span>الجنسية</span>
            </label>
            {editing ? (
              <select
                value={editData.nationality}
                onChange={(e) => setEditData({ ...editData, nationality: e.target.value })}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all text-gray-900 font-semibold bg-white"
              >
                <option value="">اختر الجنسية</option>
                {countries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            ) : (
              <div className="h-12 px-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl flex items-center">
                <p className="text-base font-bold text-gray-900">
                  {profile?.nationality || "—"}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span>تاريخ الميلاد</span>
            </label>
            {editing ? (
              <input
                type="date"
                value={editData.date_of_birth}
                onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all text-gray-900 font-semibold"
              />
            ) : (
              <div className="h-12 px-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl flex items-center">
                <p className="text-base font-bold text-gray-900">
                  {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('ar-EG') : "—"}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Languages className="w-4 h-4 text-gray-600" />
              <span>اللغة المفضلة</span>
            </label>
            {editing ? (
              <select
                value={editData.locale}
                onChange={(e) => setEditData({ ...editData, locale: e.target.value as "ar" | "en" })}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all text-gray-900 font-semibold bg-white"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            ) : (
              <div className="h-12 px-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl flex items-center">
                <p className="text-base font-bold text-gray-900">
                  {profile?.locale === 'ar' ? 'العربية' : 'English'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 pt-8 border-t border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand-green" />
          <span>إجراءات سريعة</span>
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-transparent hover:shadow-xl transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative p-4 text-center">
                  <div className="flex items-center justify-center mb-2 transform group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 group-hover:text-white transition-colors">
                    {action.label}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
