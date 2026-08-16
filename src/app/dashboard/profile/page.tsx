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
  first_name: z.string().min(2, "الاسم الأول مطلوب"),
  last_name:  z.string().min(2, "الاسم الأخير مطلوب"),
  phone: z.string().regex(/^[0-9+\-\s()]*$/, "رقم غير صحيح").optional().or(z.literal("")),
});
type ProfileFields = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  current_password: z.string().min(1, "أدخل كلمة المرور الحالية"),
  new_password:     z.string().min(8, "8 أحرف على الأقل"),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirm_password"],
});
type PasswordFields = z.infer<typeof passwordSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const iCls = (err: boolean) => cn(
  "w-full h-11 px-3 border rounded-xl text-sm bg-white transition-all outline-none",
  "focus:ring-2 placeholder:text-text-muted text-text-primary",
  err
    ? "border-red-400 focus:ring-red-200"
    : "border-border-light focus:border-brand-green focus:ring-brand-green/20"
);

function Alert({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div className={cn(
      "flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm mb-4",
      type === "success"
        ? "bg-green-50 border border-green-200 text-green-700"
        : "bg-red-50 border border-red-200 text-red-700"
    )}>
      {type === "success"
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      }
      {msg}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { locale } = useI18n();
  const { user, updateUserProfile } = useAuth();
  const isAr = locale === "ar";

  const [profile,        setProfile]        = useState<CustomerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [saveStatus,     setSaveStatus]     = useState<"success" | "error" | null>(null);
  const [saveMsg,        setSaveMsg]        = useState("");

  const [pwdOpen,    setPwdOpen]    = useState(false);
  const [savingPwd,  setSavingPwd]  = useState(false);
  const [pwdStatus,  setPwdStatus]  = useState<"success" | "error" | null>(null);
  const [pwdMsg,     setPwdMsg]     = useState("");

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFields>({
    resolver: zodResolver(profileSchema),
    defaultValues: { first_name: "", last_name: "", phone: "" },
  });

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { errors: pwdErrors } } =
    useForm<PasswordFields>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    crmAdapter.getProfile()
      .then((res) => {
        if (!res.ok) throw new Error();
        setProfile(res.data);
        reset({ first_name: res.data.first_name ?? "", last_name: res.data.last_name ?? "", phone: res.data.phone ?? "" });
      })
      .catch(() => {
        if (user) reset({ first_name: user.first_name ?? "", last_name: user.last_name ?? "", phone: user.phone ?? "" });
      })
      .finally(() => setLoadingProfile(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSave(data: ProfileFields) {
    setSaving(true); setSaveStatus(null);
    try {
      const res = await crmAdapter.updateProfile({ first_name: data.first_name, last_name: data.last_name, phone: data.phone || undefined });
      if (res.ok) { setProfile(res.data); reset({ first_name: res.data.first_name, last_name: res.data.last_name, phone: res.data.phone ?? "" }); }
      else reset(data);
      updateUserProfile({ first_name: data.first_name, last_name: data.last_name, phone: data.phone || undefined });
      setSaveStatus("success"); setSaveMsg(isAr ? "تم حفظ البيانات بنجاح" : "Saved successfully");
      setTimeout(() => setSaveStatus(null), 4000);
    } catch {
      setSaveStatus("error"); setSaveMsg(isAr ? "فشل الحفظ، حاول مجدداً" : "Save failed");
    } finally { setSaving(false); }
  }

  async function onChangePwd(data: PasswordFields) {
    setSavingPwd(true); setPwdStatus(null);
    try {
      const res = await crmAdapter.changePassword(data.current_password, data.new_password);
      if (!res.ok) throw new Error(res.error);
      setPwdStatus("success"); setPwdMsg(isAr ? "تم تغيير كلمة المرور" : "Password changed");
      resetPwd();
      setTimeout(() => setPwdStatus(null), 4000);
    } catch (e) {
      setPwdStatus("error"); setPwdMsg(e instanceof Error ? e.message : isAr ? "فشل التغيير" : "Failed");
    } finally { setSavingPwd(false); }
  }

  const displayName  = [profile?.first_name ?? user?.first_name, profile?.last_name ?? user?.last_name].filter(Boolean).join(" ");
  const displayEmail = profile?.email ?? user?.email ?? "";
  const initials     = displayName ? displayName.split(" ").filter(Boolean).slice(0,2).map(w => w[0]).join("").toUpperCase() : displayEmail[0]?.toUpperCase() ?? "?";

  return (
    <div className="space-y-4 max-w-lg w-full">

      {/* ── Page title ── */}
      <div>
        <h1 className="text-lg font-bold text-text-primary">{isAr ? "حسابي" : "My Account"}</h1>
        <p className="text-sm text-text-muted">{isAr ? "إدارة بياناتك الشخصية" : "Manage your personal info"}</p>
      </div>

      {/* ── Identity card ── */}
      <div className="bg-white rounded-2xl border border-border-light p-4 flex items-center gap-4">
        {loadingProfile ? (
          <>
            <div className="w-14 h-14 rounded-full bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-44 bg-gray-100 rounded animate-pulse" />
            </div>
          </>
        ) : (
          <>
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-brand-green text-white flex items-center justify-center text-xl font-bold shrink-0 select-none">
              {initials}
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-text-primary truncate">{displayName || displayEmail}</p>
              <p className="text-sm text-text-muted truncate mt-0.5">{displayEmail}</p>
              <span className="mt-1.5 inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green">
                {isAr ? "عميل" : "Customer"}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Edit form ── */}
      <div className="bg-white rounded-2xl border border-border-light p-5">
        <h2 className="text-sm font-bold text-text-primary mb-4">{isAr ? "تعديل البيانات" : "Edit information"}</h2>

        {saveStatus && <Alert type={saveStatus} msg={saveMsg} />}

        {loadingProfile ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-11 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  {isAr ? "الاسم الأول" : "First name"} <span className="text-red-400">*</span>
                </label>
                <input {...register("first_name")} autoComplete="given-name" className={iCls(!!errors.first_name)} />
                {errors.first_name && <p className="mt-1 text-[11px] text-red-500">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  {isAr ? "الاسم الأخير" : "Last name"} <span className="text-red-400">*</span>
                </label>
                <input {...register("last_name")} autoComplete="family-name" className={iCls(!!errors.last_name)} />
                {errors.last_name && <p className="mt-1 text-[11px] text-red-500">{errors.last_name.message}</p>}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                {isAr ? "رقم الهاتف (واتساب)" : "Phone (WhatsApp)"}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 start-3 flex items-center pointer-events-none">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                </span>
                <input
                  {...register("phone")}
                  type="tel" dir="ltr" autoComplete="tel"
                  placeholder="01xxxxxxxxx"
                  className={cn(iCls(!!errors.phone), "ps-9")}
                />
              </div>
              {errors.phone
                ? <p className="mt-1 text-[11px] text-red-500">{errors.phone.message}</p>
                : <p className="mt-1 text-[11px] text-text-muted">{isAr ? "سيُستخدم للتواصل عبر واتساب" : "Used to contact you via WhatsApp"}</p>
              }
            </div>

            {/* Email read-only */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                {isAr ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                type="email" value={displayEmail} readOnly dir="ltr"
                className="w-full h-11 px-3 border border-border-light rounded-xl text-sm text-text-muted bg-bg-alt cursor-not-allowed select-none"
              />
              <p className="mt-1 text-[11px] text-text-muted">
                {isAr ? "لا يمكن تغيير البريد الإلكتروني" : "Email cannot be changed"}
              </p>
            </div>

            <button
              type="submit"
              disabled={saving || !isDirty}
              className={cn(
                "w-full h-11 rounded-xl text-white text-sm font-bold transition-all",
                saving || !isDirty
                  ? "bg-brand-green/40 cursor-not-allowed"
                  : "bg-brand-green hover:bg-brand-green-dark active:scale-[0.98]"
              )}
            >
              {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save changes")}
            </button>
          </form>
        )}
      </div>

      {/* ── Change password ── */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        <button
          onClick={() => setPwdOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-bg-alt transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="text-start">
              <p className="text-sm font-semibold text-text-primary">{isAr ? "تغيير كلمة المرور" : "Change password"}</p>
              <p className="text-xs text-text-muted">{isAr ? "تحديث كلمة المرور الخاصة بك" : "Update your password"}</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={cn("text-text-muted transition-transform shrink-0", pwdOpen && "rotate-180")}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {pwdOpen && (
          <div className="border-t border-border-light px-5 pb-5 pt-4">
            {pwdStatus && <Alert type={pwdStatus} msg={pwdMsg} />}
            <form onSubmit={handlePwd(onChangePwd)} noValidate className="space-y-3">
              {[
                { key: "current_password" as const, label: isAr ? "كلمة المرور الحالية" : "Current password", auto: "current-password" },
                { key: "new_password"     as const, label: isAr ? "كلمة المرور الجديدة"  : "New password",     auto: "new-password",      hint: isAr ? "8 أحرف على الأقل" : "At least 8 characters" },
                { key: "confirm_password" as const, label: isAr ? "تأكيد كلمة المرور"    : "Confirm password",  auto: "new-password" },
              ].map(({ key, label, auto, hint }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                    {label} <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...regPwd(key)}
                    type="password"
                    autoComplete={auto}
                    placeholder="••••••••"
                    className={iCls(!!pwdErrors[key])}
                  />
                  {pwdErrors[key]
                    ? <p className="mt-1 text-[11px] text-red-500">{pwdErrors[key]?.message}</p>
                    : hint && <p className="mt-1 text-[11px] text-text-muted">{hint}</p>
                  }
                </div>
              ))}
              <button
                type="submit"
                disabled={savingPwd}
                className={cn(
                  "w-full h-11 rounded-xl text-white text-sm font-bold transition-all mt-1",
                  savingPwd
                    ? "bg-orange-300 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 active:scale-[0.98]"
                )}
              >
                {savingPwd ? (isAr ? "جاري التغيير..." : "Changing...") : (isAr ? "تغيير كلمة المرور" : "Change password")}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── Account info ── */}
      {!loadingProfile && (
        <div className="bg-white rounded-2xl border border-border-light p-5">
          <h2 className="text-sm font-bold text-text-primary mb-3">{isAr ? "معلومات الحساب" : "Account info"}</h2>
          <dl className="space-y-2.5">
            <div className="flex justify-between items-center gap-4 text-sm">
              <dt className="text-text-muted shrink-0">{isAr ? "نوع الحساب" : "Account type"}</dt>
              <dd className="font-semibold text-text-primary">{isAr ? "عميل" : "Customer"}</dd>
            </div>
            {(profile?.user_id ?? user?.id) && (
              <div className="flex justify-between items-center gap-4 text-sm">
                <dt className="text-text-muted shrink-0">{isAr ? "المعرّف" : "User ID"}</dt>
                <dd className="font-mono text-xs text-text-muted truncate max-w-[160px]">{(profile?.user_id ?? user?.id)?.slice(0, 16)}…</dd>
              </div>
            )}
            {profile?.created_at && (
              <div className="flex justify-between items-center gap-4 text-sm">
                <dt className="text-text-muted shrink-0">{isAr ? "تاريخ التسجيل" : "Member since"}</dt>
                <dd className="font-semibold text-text-primary">
                  {new Date(profile.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

    </div>
  );
}
