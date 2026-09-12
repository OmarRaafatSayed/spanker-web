"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const REVIEW_STATUS_LABELS: Record<string, { ar: string; color: string }> = {
  pending:        { ar: "لم يُقدَّم",     color: "bg-gray-100 text-gray-500" },
  submitted:      { ar: "مُقدَّم",         color: "bg-blue-100 text-blue-600" },
  under_review:   { ar: "قيد المراجعة",   color: "bg-yellow-100 text-yellow-700" },
  approved:       { ar: "مقبول",          color: "bg-green-100 text-green-700" },
  rejected:       { ar: "مرفوض",          color: "bg-red-100 text-red-600" },
  needs_more_info:{ ar: "يحتاج مزيداً",   color: "bg-orange-100 text-orange-600" },
};

const VISA_TYPE_AR: Record<string, string> = {
  tourist: "سياحية", business: "أعمال", student: "طالب", work: "عمل", transit: "عبور",
};

export default function AdminVisasPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"applications" | "programs">("applications");

  // Applications (review queue)
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("submitted");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [reviewForm, setReviewForm] = useState({ decision: "", notes: "", required_documents: "" });
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Visa Programs
  const [programs, setPrograms] = useState<any[]>([]);
  const [progsLoading, setProgsLoading] = useState(true);
  const [showProgForm, setShowProgForm] = useState(false);
  const [editingProg, setEditingProg] = useState<any | null>(null);
  const [progForm, setProgForm] = useState<any>({
    destination_country: "", country_code: "", visa_type: "tourist",
    processing_days: 7, price: "", service_fee: "",
    validity_months: 3, max_stay_days: 30, min_passport_validity_months: 6,
    required_documents: '["passport","photo"]',
    optional_documents: '[]',
    notes_ar: "", notes_en: "", is_public: true, enabled: true,
  });
  const [progSaving, setProgSaving] = useState(false);
  const [progError, setProgError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "applications") fetchApplications();
    else fetchPrograms();
  }, [activeTab, filterStatus]);

  async function fetchApplications() {
    setAppsLoading(true);
    let query = supabase
      .from("visa_booking_details")
      .select(`
        *,
        travel_request:travel_requests(booking_reference, booking_status, client_user_id)
      `)
      .order("created_at", { ascending: false });
    // Note: review_status filtering moved to visa_applications table
    const { data } = await query;
    setApplications(data || []);
    setAppsLoading(false);
  }

  async function fetchPrograms() {
    setProgsLoading(true);
    const { data } = await supabase.from("visa_applications").select("*").order("destination_country");
    setPrograms(data || []);
    setProgsLoading(false);
  }

  async function submitReview() {
    if (!selectedApp || !reviewForm.decision) { setReviewError("اختر القرار"); return; }
    setReviewing(true); setReviewError(null);
    try {
      const body: any = { decision: reviewForm.decision, notes: reviewForm.notes || undefined };
      if (reviewForm.decision === "needs_more_info" && reviewForm.required_documents) {
        body.required_documents = reviewForm.required_documents.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
      const res = await fetch(`/api/v1/visas/${selectedApp.id}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setReviewSuccess("تم تسجيل القرار بنجاح");
      setSelectedApp(null); fetchApplications();
    } catch (e: any) { setReviewError(e.message); }
    finally { setReviewing(false); }
  }

  async function saveProgram() {
    setProgSaving(true); setProgError(null);
    try {
      let required_docs, optional_docs;
      try { required_docs = JSON.parse(progForm.required_documents); } catch { throw new Error("required_documents يجب أن يكون JSON صحيح"); }
      try { optional_docs = JSON.parse(progForm.optional_documents); } catch { throw new Error("optional_documents يجب أن يكون JSON صحيح"); }
      const payload = {
        ...progForm, required_documents: required_docs, optional_documents: optional_docs,
        price: parseFloat(progForm.price), service_fee: parseFloat(progForm.service_fee),
        processing_days: parseInt(progForm.processing_days), validity_months: parseInt(progForm.validity_months),
        max_stay_days: parseInt(progForm.max_stay_days), min_passport_validity_months: parseInt(progForm.min_passport_validity_months),
        currency: "EGP",
      };
      let err;
      if (editingProg) {
        ({ error: err } = await supabase.from("visa_applications").update(payload).eq("id", editingProg.id));
      } else {
        ({ error: err } = await supabase.from("visa_applications").insert(payload));
      }
      if (err) throw err;
      setShowProgForm(false); fetchPrograms();
    } catch (e: any) { setProgError(e.message); }
    finally { setProgSaving(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">إدارة التأشيرات</h1>
          {reviewSuccess && <p className="text-sm text-green-600 mt-1">✓ {reviewSuccess}</p>}
        </div>
        {activeTab === "programs" && (
          <button onClick={() => { setProgForm({ destination_country:"",country_code:"",visa_type:"tourist",processing_days:7,price:"",service_fee:"",validity_months:3,max_stay_days:30,min_passport_validity_months:6,required_documents:'["passport","photo"]',optional_documents:'[]',notes_ar:"",notes_en:"",is_public:true,enabled:true }); setEditingProg(null); setProgError(null); setShowProgForm(true); }}
            className="px-4 py-2 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-all">+ برنامج جديد</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {([["applications", "طلبات المراجعة"], ["programs", "برامج التأشيرات"]] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? "bg-brand-green text-white" : "bg-white border border-border-default text-text-secondary hover:bg-muted"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ─── APPLICATIONS TAB ─── */}
      {activeTab === "applications" && (
        <div>
          <div className="flex gap-3 mb-4 flex-wrap">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="h-9 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 bg-white">
              <option value="">كل الحالات</option>
              {Object.entries(REVIEW_STATUS_LABELS).map(([v, { ar }]) => <option key={v} value={v}>{ar}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light bg-muted/50">
                  {["المرجع","الوجهة","المتقدم","الجواز","تاريخ التقديم","الحالة","إجراءات"].map(h => (
                    <th key={h} className="text-right px-4 py-3 font-semibold text-text-secondary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appsLoading ? (
                  Array.from({length:4}).map((_,i) => (
                    <tr key={i} className="border-b animate-pulse">
                      {Array.from({length:7}).map((_,j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded"/></td>)}
                    </tr>
                  ))
                ) : applications.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-text-muted">لا توجد طلبات</td></tr>
                ) : applications.map((a: any) => {
                  const st = REVIEW_STATUS_LABELS[a.review_status];
                  return (
                    <tr key={a.id} className="border-b border-border-light hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-brand-green font-bold">{a.booking?.reference}</td>
                      <td className="px-4 py-3">{a.visa?.destination_country} <span className="text-text-muted text-xs">({VISA_TYPE_AR[a.visa?.visa_type] ?? a.visa?.visa_type})</span></td>
                      <td className="px-4 py-3">{a.applicant?.first_name} {a.applicant?.last_name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{a.applicant?.passport_number}</td>
                      <td className="px-4 py-3 text-xs text-text-muted">{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString("ar-EG") : "—"}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${st?.color}`}>{st?.ar}</span></td>
                      <td className="px-4 py-3">
                        {["submitted","under_review"].includes(a.review_status) && (
                          <button onClick={() => { setSelectedApp(a); setReviewForm({ decision:"", notes:"", required_documents:"" }); setReviewError(null); setReviewSuccess(null); }}
                            className="px-2.5 py-1 rounded-lg bg-brand-green text-white text-xs font-medium hover:bg-brand-green-dark transition-all">
                            مراجعة
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Review Panel */}
          {selectedApp && (
            <div className="mt-4 bg-white rounded-2xl border border-brand-green/30 p-5">
              <h3 className="font-bold text-text-primary mb-3">مراجعة طلب: <span className="text-brand-green">{selectedApp.booking?.reference}</span></h3>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p><strong>المتقدم:</strong> {selectedApp.applicant?.first_name} {selectedApp.applicant?.last_name}</p>
                  <p><strong>الجنسية:</strong> {selectedApp.applicant?.nationality}</p>
                  <p><strong>الجواز:</strong> {selectedApp.applicant?.passport_number}</p>
                  <p><strong>انتهاء الجواز:</strong> {selectedApp.applicant?.passport_expiry}</p>
                </div>
                <div>
                  <p><strong>الوجهة:</strong> {selectedApp.visa?.destination_country}</p>
                  <p><strong>النوع:</strong> {VISA_TYPE_AR[selectedApp.visa?.visa_type]}</p>
                  <p><strong>البريد:</strong> {selectedApp.booking?.contact?.email}</p>
                  <p><strong>الهاتف:</strong> {selectedApp.booking?.contact?.phone}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">القرار *</label>
                  <div className="flex gap-2">
                    {[["approve","قبول","bg-green-50 border-green-300 text-green-700"],["reject","رفض","bg-red-50 border-red-300 text-red-600"],["needs_more_info","يحتاج مزيداً","bg-orange-50 border-orange-300 text-orange-600"]].map(([v,l,cls]) => (
                      <button key={v} onClick={() => setReviewForm(f => ({ ...f, decision: v }))}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${reviewForm.decision === v ? cls : "border-border-light text-text-muted hover:bg-muted"}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">ملاحظات</label>
                  <textarea rows={2} value={reviewForm.notes} onChange={e => setReviewForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none" />
                </div>
                {reviewForm.decision === "needs_more_info" && (
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">المستندات المطلوبة (مفصولة بفاصلة)</label>
                    <input value={reviewForm.required_documents} onChange={e => setReviewForm(f => ({ ...f, required_documents: e.target.value }))}
                      placeholder="bank_statement, employment_letter"
                      className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
                  </div>
                )}
                {reviewError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{reviewError}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setSelectedApp(null)} className="flex-1 py-2.5 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-muted transition-all">إلغاء</button>
                  <button onClick={submitReview} disabled={reviewing || !reviewForm.decision}
                    className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-all disabled:opacity-60">
                    {reviewing ? "جاري الإرسال..." : "تأكيد القرار"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── PROGRAMS TAB ─── */}
      {activeTab === "programs" && (
        <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-muted/50">
                {["الدولة","النوع","المدة","الإقامة","أيام المعالجة","السعر","الحالة","إجراءات"].map(h => (
                  <th key={h} className="text-right px-4 py-3 font-semibold text-text-secondary">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {progsLoading ? (
                Array.from({length:5}).map((_,i) => (
                  <tr key={i} className="border-b animate-pulse">
                    {Array.from({length:8}).map((_,j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded"/></td>)}
                  </tr>
                ))
              ) : programs.map((p: any) => (
                <tr key={p.id} className="border-b border-border-light hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-text-primary">{p.destination_country}</td>
                  <td className="px-4 py-3 text-text-secondary">{VISA_TYPE_AR[p.visa_type]}</td>
                  <td className="px-4 py-3 text-text-muted">{p.validity_months} شهر</td>
                  <td className="px-4 py-3 text-text-muted">{p.max_stay_days} يوم</td>
                  <td className="px-4 py-3 text-text-muted">{p.processing_days} يوم</td>
                  <td className="px-4 py-3 font-bold text-brand-green">{(parseFloat(p.price) + parseFloat(p.service_fee)).toLocaleString()} ج.م</td>
                  <td className="px-4 py-3">
                    {/* enabled field not available in visa_applications */}
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                      N/A
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => { setProgForm({ ...p, required_documents: JSON.stringify(p.required_documents), optional_documents: JSON.stringify(p.optional_documents) }); setEditingProg(p); setProgError(null); setShowProgForm(true); }}
                        className="px-2.5 py-1 rounded-lg bg-muted text-text-secondary text-xs hover:bg-border-default transition-all">تعديل</button>
                      {/* Toggle disabled - enabled field not in schema
                      <button onClick={async () => { await supabase.from("visa_applications").update({ enabled: !p.enabled }).eq("id", p.id); fetchPrograms(); }}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all ${p.enabled ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                        {p.enabled ? "تعطيل" : "تفعيل"}
                      </button>
                      */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Program Form Modal */}
      {showProgForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingProg ? "تعديل برنامج" : "برنامج جديد"}</h3>
              <button onClick={() => setShowProgForm(false)} className="text-text-muted text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "الدولة", field: "destination_country" },
                { label: "رمز الدولة (ISO)", field: "country_code" },
                { label: "سعر التأشيرة (ج.م)", field: "price", type: "number" },
                { label: "رسوم الخدمة (ج.م)", field: "service_fee", type: "number" },
                { label: "أيام المعالجة", field: "processing_days", type: "number" },
                { label: "صلاحية (أشهر)", field: "validity_months", type: "number" },
                { label: "أقصى إقامة (أيام)", field: "max_stay_days", type: "number" },
                { label: "صلاحية الجواز (أشهر)", field: "min_passport_validity_months", type: "number" },
              ].map(({ label, field, type = "text" }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
                  <input type={type} value={progForm[field]} onChange={e => setProgForm((f: any) => ({ ...f, [field]: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">نوع التأشيرة</label>
                <select value={progForm.visa_type} onChange={e => setProgForm((f: any) => ({ ...f, visa_type: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30">
                  {Object.entries(VISA_TYPE_AR).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">المستندات المطلوبة (JSON)</label>
                <input value={progForm.required_documents} onChange={e => setProgForm((f: any) => ({ ...f, required_documents: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">ملاحظات (عربي)</label>
                <input value={progForm.notes_ar} onChange={e => setProgForm((f: any) => ({ ...f, notes_ar: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">ملاحظات (إنجليزي)</label>
                <input value={progForm.notes_en} onChange={e => setProgForm((f: any) => ({ ...f, notes_en: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
              </div>
              <div className="flex items-center gap-4 col-span-2 pt-1">
                {[["is_public","ظاهر للعملاء"],["enabled","مفعّل"]].map(([f,l]) => (
                  <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={progForm[f]} onChange={e => setProgForm((prev: any) => ({ ...prev, [f]: e.target.checked }))} className="rounded" />
                    {l}
                  </label>
                ))}
              </div>
            </div>
            {progError && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{progError}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowProgForm(false)} className="flex-1 py-2.5 rounded-xl border border-border-default text-sm hover:bg-muted transition-all">إلغاء</button>
              <button onClick={saveProgram} disabled={progSaving} className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold disabled:opacity-60">
                {progSaving ? "جاري الحفظ..." : (editingProg ? "حفظ التعديلات" : "إضافة البرنامج")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
