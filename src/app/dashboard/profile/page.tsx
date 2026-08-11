"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { crmAdapter } from "@/lib/services/crm-adapter";
import type { CustomerProfile } from "@/types/flights";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  first_name: z.string().min(2, "الاسم الأول مطلوب (حرفين على الأقل)"),
  last_name:  z.string().min(2, "الاسم الأخير مطلوب (حرفين على الأقل)"),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]*$/, "رقم غير صحيح")
    .optional()
    .or(z.literal("")),
});
type ProfileFields = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "أدخل كلمة المرور الحالية"),
    new_password:     z.string().min(8, "8 أحرف على الأقل"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirm_password"],
  });
type PasswordFields = z.infer<typeof passwordSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return cn(
    "w-full h-11 px-3 border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 transition bg-white placeholder:text-text-muted",
    hasError
      ? "border-red-400 focus:ring-red-300"
      : "border-border-light focus:border-brand-green focus:ring-brand-green/30"
  );
}

function Avatar({ name, email }: { name: string; email: string }) {
  const src = name || email;
  const initials = src
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || src[0]?.toUpperCase() || "?";
  return (
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-green to-brand-green-dark flex items-center justify-center text-white text-xl font-bold shadow-sm shrink-0">
      {initials}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { locale } = useI18n();
  const { user, updateUserProfile } = useAuth();
  const isAr = locale === "ar";

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Profile form state
  const [saving, setSaving]           = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);

  // Password form state
  const [savingPwd, setSavingPwd]         = useState(false);
  const [pwdSuccess, setPwdSuccess]       = useState(false);
  const [pwdError, setPwdError]           = useState<string | null>(null);
  const [showPwdSection, setShowPwdSection] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFields>({
    resolver: zodResolver(profileSchema),
    defaultValues: { first_name: "", last_name: "", phone: "" },
  });

  const {
    register: regPwd,
    handleSubmit: handlePwd,
    reset: resetPwd,
    formState: { errors: pwdErrors },
  } = useForm<PasswordFields>({ resolver: zodResolver(passwordSchema) });

  // On mount: try to fetch profile from backend, fall back to session data
  useEffect(() => {
    crmAdapter.getProfile()
      .then((result) => {
        if (!result.ok) throw new Error(result.error);
        const p = result.data;
        setProfile(p);
        reset({
          first_name: p.first_name ?? "",
          last_name:  p.last_name  ?? "",
          phone:      p.phone      ?? "",
        });
      })
      .catch(() => {
        // Backend /profile not available — use session data
        if (user) {
          reset({
            first_name: user.first_name ?? "",
            last_name:  user.last_name  ?? "",
            phone:      user.phone      ?? "",
          });
        }
      })
      .finally(() => setLoadingProfile(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSaveProfile(data: ProfileFields) {
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);
    try {
      const result = await crmAdapter.updateProfile({
        first_name: data.first_name,
        last_name:  data.last_name,
        phone:      data.phone || undefined,
      });

      if (result.ok) {
        setProfile(result.data);
        reset({
          first_name: result.data.first_name,
          last_name:  result.data.last_name,
          phone:      result.data.phone ?? "",
        });
      } else {
        // Backend unavailable — save locally only
        reset({ first_name: data.first_name, last_name: data.last_name, phone: data.phone ?? "" });
      }
      // Always update auth context & localStorage
      updateUserProfile({ first_name: data.first_name, last_name: data.last_name, phone: data.phone || undefined });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : isAr ? "فشل الحفظ" : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onChangePassword(data: PasswordFields) {
    setPwdError(null);
    setPwdSuccess(false);
    setSavingPwd(true);
    try {
      const result = await crmAdapter.changePassword(data.current_password, data.new_password);
      if (!result.ok) throw new Error(result.error);
      setPwdSuccess(true);
      resetPwd();
      setTimeout(() => setPwdSuccess(false), 4000);
    } catch (e) {
      setPwdError(e instanceof Error ? e.message : isAr ? "فشل تغيير كلمة المرور" : "Failed to change password");
    } finally {
      setSavingPwd(false);
    }
  }

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : user?.first_name
      ? `${user.first_name} ${user.last_name ?? ""}`.trim()
      : "";
  const displayEmail = profile?.email ?? user?.email ?? "";

  return (
    <div className="space-y-5 max-w-lg w-full mx-auto">
      <div>
        <h1 className="text-xl font-bold text-text-primary">{isAr ? "الملف الشخصي" : "My Profile"}</h1>
        <p className="text-sm text-text-muted mt-0.5">
          {isAr ? "تعديل بياناتك الشخصية" : "Manage your personal information"}
        </p>
      </div>

      {/* Avatar card */}
      {!loadingProfile && (
        <div className="flex items-center gap-4 bg-white rounded-2xl border border-border-light p-5">
          <Avatar name={displayName} email={displayEmail} />
          <div className="min-w-0">
            <p className="text-base font-bold text-text-primary truncate">{displayName || displayEmail}</p>
            <p className="text-sm text-text-muted truncate">{displayEmail}</p>
            <span className="mt-1.5 inline-block text-xs px-2.5 py-0.5 rounded-full bg-brand-green/10 text-brand-green font-semibold">
              {isAr ? "عميل" : "Customer"}
            </span>
          </div>
        </div>
      )}
      {loadingProfile && (
        <div className="flex items-center gap-4 bg-white rounded-2xl border border-border-light p-5">
          <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-48" />
          </div>
        </div>
      )}

      {/* Edit form */}
      <div className="bg-white rounded-2xl border border-border-light p-5">
        <h2 className="text-base font-bold text-text-primary mb-4">
          {isAr ? "تعديل البيانات" : "Edit information"}
        </h2>

        {saveSuccess && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {isAr ? "تم حفظ البيانات بنجاح" : "Profile saved successfully"}
          </div>
        )}
        {saveError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{saveError}</div>
        )}

        {loadingProfile ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-11 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSaveProfile)} noValidate className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? "الاسم الأول" : "First name"} <span className="text-red-500">*</span>
                </label>
                <input {...register("first_name")} type="text" autoComplete="given-name"
                  className={inputCls(!!errors.first_name)} />
                {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? "الاسم الأخير" : "Last name"} <span className="text-red-500">*</span>
                </label>
                <input {...register("last_name")} type="text" autoComplete="family-name"
                  className={inputCls(!!errors.last_name)} />
                {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {isAr ? "رقم الهاتف (واتساب)" : "Phone (WhatsApp)"}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 start-3 flex items-center pointer-events-none">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-green-500">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" fill="currentColor"/>
                  </svg>
                </span>
                <input {...register("phone")} type="tel" dir="ltr" autoComplete="tel"
                  placeholder={isAr ? "01xxxxxxxxx" : "+201xxxxxxxxx"}
                  className={cn(inputCls(!!errors.phone), "ps-9")} />
              </div>
              {errors.phone
                ? <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                : <p className="mt-1 text-xs text-text-muted">{isAr ? "سيُستخدم للتواصل عبر واتساب" : "Used to contact you via WhatsApp"}</p>
              }
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {isAr ? "البريد الإلكتروني" : "Email address"}
              </label>
              <input type="email" value={displayEmail} readOnly dir="ltr"
                className="w-full h-11 px-3 border border-border-light rounded-xl text-sm text-text-muted bg-bg-alt cursor-not-allowed" />
              <p className="mt-1 text-xs text-text-muted">
                {isAr ? "لا يمكن تغيير البريد الإلكتروني حالياً" : "Email cannot be changed at this time"}
              </p>
            </div>

            <button type="submit" disabled={saving || !isDirty}
              className={cn(
                "w-full h-11 rounded-xl text-white text-sm font-bold transition-all",
                saving || !isDirty
                  ? "bg-brand-green/40 cursor-not-allowed"
                  : "bg-brand-green hover:bg-brand-green-dark active:scale-[0.98]"
              )}>
              {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save changes")}
            </button>
          </form>
        )}
      </div>

      {/* Change password section */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        <button
          onClick={() => setShowPwdSection(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-start hover:bg-bg-alt transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">{isAr ? "تغيير كلمة المرور" : "Change password"}</p>
              <p className="text-xs text-text-muted">{isAr ? "تحديث كلمة المرور الخاصة بك" : "Update your password"}</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={cn("text-text-muted transition-transform shrink-0", showPwdSection && "rotate-180")}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {showPwdSection && (
          <div className="border-t border-border-light px-5 pb-5 pt-4">
            {pwdSuccess && (
              <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                {isAr ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully"}
              </div>
            )}
            {pwdError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{pwdError}</div>
            )}

            <form onSubmit={handlePwd(onChangePassword)} noValidate className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? "كلمة المرور الحالية" : "Current password"} <span className="text-red-500">*</span>
                </label>
                <input {...regPwd("current_password")} type="password" autoComplete="current-password"
                  placeholder="••••••••" className={inputCls(!!pwdErrors.current_password)} />
                {pwdErrors.current_password && <p className="mt-1 text-xs text-red-500">{pwdErrors.current_password.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? "كلمة المرور الجديدة" : "New password"} <span className="text-red-500">*</span>
                </label>
                <input {...regPwd("new_password")} type="password" autoComplete="new-password"
                  placeholder="••••••••" className={inputCls(!!pwdErrors.new_password)} />
                {pwdErrors.new_password
                  ? <p className="mt-1 text-xs text-red-500">{pwdErrors.new_password.message}</p>
                  : <p className="mt-1 text-xs text-text-muted">{isAr ? "8 أحرف على الأقل" : "At least 8 characters"}</p>
                }
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {isAr ? "تأكيد كلمة المرور الجديدة" : "Confirm new password"} <span className="text-red-500">*</span>
                </label>
                <input {...regPwd("confirm_password")} type="password" autoComplete="new-password"
                  placeholder="••••••••" className={inputCls(!!pwdErrors.confirm_password)} />
                {pwdErrors.confirm_password && <p className="mt-1 text-xs text-red-500">{pwdErrors.confirm_password.message}</p>}
              </div>
              <button type="submit" disabled={savingPwd}
                className={cn(
                  "w-full h-11 rounded-xl text-white text-sm font-bold transition-all mt-1",
                  savingPwd ? "bg-orange-300 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 active:scale-[0.98]"
                )}>
                {savingPwd ? (isAr ? "جاري التغيير..." : "Changing...") : (isAr ? "تغيير كلمة المرور" : "Change password")}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Account info */}
      {!loadingProfile && (
        <div className="bg-white rounded-2xl border border-border-light p-5">
          <h2 className="text-base font-bold text-text-primary mb-3">{isAr ? "معلومات الحساب" : "Account info"}</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted shrink-0">{isAr ? "نوع الحساب" : "Account type"}</dt>
              <dd className="font-semibold text-text-primary">{isAr ? "عميل" : "Customer"}</dd>
            </div>
            {(profile?.user_id ?? user?.id) && (
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted shrink-0">{isAr ? "المعرّف" : "User ID"}</dt>
                <dd className="font-mono text-xs text-text-muted truncate">{profile?.user_id ?? user?.id}</dd>
              </div>
            )}
            {profile?.created_at && (
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted shrink-0">{isAr ? "تاريخ التسجيل" : "Member since"}</dt>
                <dd className="font-semibold text-text-primary">
                  {new Date(profile.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
