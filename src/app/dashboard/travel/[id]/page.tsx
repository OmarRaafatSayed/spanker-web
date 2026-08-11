"use client";

/**
 * /dashboard/travel/[id] — Travel Request Detail + Document Upload
 *
 * REFACTORED (Task 2):
 *   - Replaced MOCK_REQUEST with real travelRequestsService.getById()
 *   - Replaced simulated upload with real uploadDocument() from document-upload-service
 *   - Replaced local RequestStatus type with PortalStatus from visa-states
 *   - Realtime subscription wired via realtimeSubscriptions.subscribeToTravelRequest()
 *   - All status display from PORTAL_STATUS_LABELS / PORTAL_STATUS_VARIANT
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { travelRequestsService, customerDocumentsService } from "@/lib/services/travel-requests-service";
import { uploadDocument } from "@/modules/visa/document-upload-service";
import { realtimeSubscriptions } from "@/lib/services/realtime-subscriptions";
import {
  PORTAL_STATUS_LABELS,
  PORTAL_STATUS_VARIANT,
  normalizeToPortalStatus,
  type PortalStatus,
} from "@/types/visa-states";
import { useAuth } from "@/lib/auth-context";
import type { TravelRequest, CustomerDocument, DocumentChecklist, DocumentItem } from "@/types";

// =============================================================================
// Status badge
// =============================================================================

const VARIANT_CLS: Record<string, string> = {
  warning:     "bg-yellow-100 text-yellow-700",
  info:        "bg-blue-100 text-blue-700",
  default:     "bg-purple-100 text-purple-700",
  success:     "bg-green-100 text-green-700",
  destructive: "bg-red-100 text-red-700",
};

const AR_STATUS_LABELS: Record<PortalStatus, string> = {
  pending_documents: "بانتظار المستندات",
  documents_review:  "قيد المراجعة",
  docs_approved:     "المستندات مقبولة",
  in_progress:       "جاري التنفيذ",
  completed:         "مكتمل",
  cancelled:         "ملغي",
};

function RequestStatusBadge({ status, isAr }: { status: PortalStatus; isAr: boolean }) {
  const variant = PORTAL_STATUS_VARIANT[status];
  return (
    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap", VARIANT_CLS[variant])}>
      {isAr ? AR_STATUS_LABELS[status] : PORTAL_STATUS_LABELS[status]}
    </span>
  );
}

// =============================================================================
// Document status config
// =============================================================================

type DocStatus = "pending" | "uploaded" | "under_review" | "approved" | "rejected";

const DOC_STATUS_CONFIG: Record<DocStatus, { labelAr: string; labelEn: string; cls: string; icon: string }> = {
  pending:      { labelAr: "مطلوب",          labelEn: "Required",     cls: "bg-gray-100 text-gray-600",   icon: "⏳" },
  uploaded:     { labelAr: "مرفوع",           labelEn: "Uploaded",     cls: "bg-blue-100 text-blue-700",   icon: "📎" },
  under_review: { labelAr: "قيد المراجعة",   labelEn: "Under Review", cls: "bg-yellow-100 text-yellow-700", icon: "🔍" },
  approved:     { labelAr: "مقبول",           labelEn: "Approved",     cls: "bg-green-100 text-green-700", icon: "✅" },
  rejected:     { labelAr: "مرفوض",           labelEn: "Rejected",     cls: "bg-red-100 text-red-700",     icon: "❌" },
};

// =============================================================================
// Progress stepper driven by PORTAL_STATUS_LABELS
// =============================================================================

const ACTIVE_STEPS: PortalStatus[] = [
  "pending_documents",
  "documents_review",
  "docs_approved",
  "in_progress",
  "completed",
];

const AR_STEP_LABELS: Record<PortalStatus, string> = {
  pending_documents: "بانتظار المستندات",
  documents_review:  "مراجعة المستندات",
  docs_approved:     "مستندات مقبولة",
  in_progress:       "جاري التنفيذ",
  completed:         "مكتمل",
  cancelled:         "ملغي",
};

interface UploadState {
  type:     string;
  progress: number;
  error?:   string;
}

// =============================================================================
// Page
// =============================================================================

export default function TravelRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useI18n();
  const { user }   = useAuth();
  const isAr = locale === "ar";

  const requestId = params?.id as string;

  const [request,          setRequest]          = useState<TravelRequest | null>(null);
  const [documents,        setDocuments]        = useState<CustomerDocument[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState<string | null>(null);
  const [uploading,        setUploading]        = useState<UploadState | null>(null);
  const fileInputRef       = useRef<HTMLInputElement>(null);
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);

  // ── Load request + documents ───────────────────────────────────────────────
  const loadRequest = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    setError(null);

    const [reqResult, docResult] = await Promise.all([
      travelRequestsService.getById(requestId),
      customerDocumentsService.getForRequest(requestId),
    ]);

    if (!reqResult.ok) {
      setError(reqResult.error);
      setLoading(false);
      return;
    }

    setRequest(reqResult.data);
    if (docResult.ok) setDocuments(docResult.data);
    setLoading(false);
  }, [requestId]);

  useEffect(() => { loadRequest(); }, [loadRequest]);

  // ── Realtime subscription — auto-updates request status ───────────────────
  useEffect(() => {
    if (!requestId) return;
    const unsub = realtimeSubscriptions.subscribeToTravelRequest(
      requestId,
      (updated) => setRequest(updated)
    );
    const unsubDocs = realtimeSubscriptions.subscribeToDocuments(
      requestId,
      (updatedDocs) => setDocuments(updatedDocs)
    );
    return () => { unsub(); unsubDocs(); };
  }, [requestId]);

  // ── Upload helpers ─────────────────────────────────────────────────────────
  function triggerUpload(docType: string) {
    setActiveUploadType(docType);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeUploadType || !user?.id) return;

    const maxSize     = 5 * 1024 * 1024;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      setUploading({ type: activeUploadType, progress: 0, error: isAr ? "صيغة غير مدعومة. استخدم PDF أو JPG أو PNG" : "Unsupported type. Use PDF, JPG, or PNG" });
      setTimeout(() => setUploading(null), 4000);
      return;
    }
    if (file.size > maxSize) {
      setUploading({ type: activeUploadType, progress: 0, error: isAr ? "حجم الملف أكبر من 5MB" : "File exceeds 5MB" });
      setTimeout(() => setUploading(null), 4000);
      return;
    }

    // Show progress animation while upload runs
    setUploading({ type: activeUploadType, progress: 10 });
    const interval = setInterval(() => {
      setUploading(prev => {
        if (!prev || prev.progress >= 85) return prev;
        return { ...prev, progress: prev.progress + 15 };
      });
    }, 200);

    const result = await uploadDocument({
      requestId,
      clientUserId: user.id,
      documentType: activeUploadType,
      file,
    });

    clearInterval(interval);

    if (!result.ok) {
      setUploading({ type: activeUploadType, progress: 0, error: result.error });
      setTimeout(() => setUploading(null), 4000);
    } else {
      setUploading(null);
      // Refresh documents list to show new status
      const docResult = await customerDocumentsService.getForRequest(requestId);
      if (docResult.ok) setDocuments(docResult.data);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    setActiveUploadType(null);
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const portalStatus   = request ? normalizeToPortalStatus(request.status) : "pending_documents";
  const currentStepIdx = ACTIVE_STEPS.indexOf(portalStatus);
  const completion     = request?.documents_completion_percent ?? 0;

  // Build document list from checklist + uploaded records
  const checklistItems: (DocumentItem & { uploaded?: CustomerDocument })[] = (() => {
    if (!request) return [];
    const checklist = request.document_checklist as DocumentChecklist | null;
    const allItems  = [
      ...(checklist?.required ?? []),
      ...(checklist?.optional ?? []),
    ];
    return allItems.map(item => ({
      ...item,
      uploaded: documents.find(d => d.document_type === item.type),
    }));
  })();

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-3xl space-y-4" aria-busy="true">
        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-3xl">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-5 transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          {isAr ? "رجوع" : "Back"}
        </button>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center" role="alert">
          <p className="text-sm text-red-600 mb-3">{error ?? (isAr ? "لم يتم العثور على الطلب" : "Request not found")}</p>
          <button onClick={loadRequest} className="text-xs font-semibold text-red-700 underline">
            {isAr ? "حاول مجدداً" : "Try again"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        aria-hidden="true"
        onChange={handleFileChange}
      />

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        {isAr ? "رجوع" : "Back"}
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-border-light p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold text-text-primary">{request.destination_country}</h1>
              <span className="text-xs bg-bg-alt text-text-muted px-2 py-0.5 rounded-full">
                {request.travel_type}
              </span>
            </div>
            <p className="text-xs text-text-muted font-mono">{request.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <RequestStatusBadge status={portalStatus} isAr={isAr} />
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <span className="flex items-center gap-1.5 text-text-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            {request.traveler_count} {isAr ? "مسافر" : "traveler(s)"}
          </span>
          {request.departure_date && (
            <span className="flex items-center gap-1.5 text-text-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {new Date(request.departure_date).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}
            </span>
          )}
        </div>
      </div>

      {/* Progress stepper */}
      <div className="bg-white rounded-2xl border border-border-light p-5">
        <h2 className="font-bold text-text-primary mb-4 text-sm">
          {isAr ? "مراحل الطلب" : "Request Progress"}
        </h2>
        <div className="flex items-center">
          {ACTIVE_STEPS.map((step, i) => {
            const isDone   = i < currentStepIdx;
            const isActive = i === currentStepIdx;
            const isLast   = i === ACTIVE_STEPS.length - 1;
            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      isDone   ? "bg-brand-green text-white"
                               : isActive ? "bg-brand-yellow text-brand-dark ring-4 ring-brand-yellow/20"
                               : "bg-gray-100 text-text-muted"
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {isDone
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                      : <span>{i + 1}</span>
                    }
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium text-center leading-tight hidden sm:block",
                    isDone || isActive ? "text-text-primary" : "text-text-muted"
                  )}>
                    {isAr ? AR_STEP_LABELS[step] : PORTAL_STATUS_LABELS[step]}
                  </span>
                </div>
                {!isLast && (
                  <div className={cn("flex-1 h-0.5 mx-1 -mt-5 sm:mt-0", isDone ? "bg-brand-green" : "bg-gray-200")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload toast */}
      {uploading && (
        <div
          className={cn(
            "rounded-xl p-4 flex items-center gap-3",
            uploading.error ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-100"
          )}
          role={uploading.error ? "alert" : "status"}
        >
          {uploading.error ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 shrink-0" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm text-red-700">{uploading.error}</p>
            </>
          ) : (
            <>
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm text-blue-700 font-medium mb-1">
                  {isAr ? "جاري رفع الملف..." : "Uploading file..."}
                </p>
                <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${uploading.progress}%` }}
                    role="progressbar"
                    aria-valuenow={uploading.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Document checklist */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
          <h2 className="font-bold text-text-primary text-sm">
            {isAr ? "قائمة المستندات" : "Document Checklist"}
          </h2>
          <span className="text-xs font-bold text-brand-green">
            {completion}% {isAr ? "مكتمل" : "complete"}
          </span>
        </div>

        <div className="px-5 pt-3">
          <div
            className="h-2 bg-gray-100 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={completion}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn("h-full rounded-full transition-all duration-500", completion === 100 ? "bg-green-500" : "bg-brand-green")}
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <div className="divide-y divide-border-light">
          {checklistItems.length === 0 && (
            <p className="px-5 py-8 text-sm text-text-muted text-center">
              {isAr ? "لا توجد مستندات مطلوبة حتى الآن" : "No documents required yet"}
            </p>
          )}
          {checklistItems.map(item => {
            // Uploaded doc status overrides checklist status
            const rawDocStatus = item.uploaded?.status ?? item.status ?? "pending";
            const docStatus = (rawDocStatus in DOC_STATUS_CONFIG ? rawDocStatus : "pending") as DocStatus;
            const conf = DOC_STATUS_CONFIG[docStatus];
            const isCurrentlyUploading = uploading?.type === item.type && !uploading.error;

            return (
              <div key={item.type} className="px-5 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-bg-alt flex items-center justify-center text-lg shrink-0" aria-hidden="true">
                  {conf.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                  </div>
                  {item.uploaded?.file_name && (
                    <p className="text-xs text-text-muted truncate">{item.uploaded.file_name}</p>
                  )}
                  {item.uploaded?.rejection_reason && (
                    <p className="text-xs text-red-600 mt-0.5">{item.uploaded.rejection_reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", conf.cls)}>
                    {isAr ? conf.labelAr : conf.labelEn}
                  </span>
                  {(docStatus === "pending" || docStatus === "rejected") && (
                    <button
                      onClick={() => triggerUpload(item.type)}
                      disabled={!!isCurrentlyUploading}
                      aria-label={`${isAr ? "رفع" : "Upload"} ${item.name}`}
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition",
                        docStatus === "rejected"
                          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          : "bg-brand-green/10 text-brand-green hover:bg-brand-green/20"
                      )}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                      </svg>
                      {docStatus === "rejected"
                        ? (isAr ? "إعادة رفع" : "Re-upload")
                        : (isAr ? "رفع" : "Upload")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next action */}
      {request.next_action_required && (
        <div className="flex items-start gap-3 bg-brand-yellow/10 border border-brand-yellow/30 rounded-2xl p-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-dark shrink-0 mt-0.5" aria-hidden="true">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <div>
            <p className="text-sm font-bold text-brand-dark mb-0.5">
              {isAr ? "الخطوة التالية" : "Next Step"}
            </p>
            <p className="text-sm text-brand-dark/80">{request.next_action_required}</p>
          </div>
        </div>
      )}
    </div>
  );
}
