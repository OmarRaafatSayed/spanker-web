"use client";

/**
 * <ImageUploader>
 * A reusable image upload component for admin forms.
 * Uploads to /api/admin/upload/image and returns the public URL.
 *
 * Props:
 *   value      – current image URL (controlled)
 *   onChange   – called with the new public URL after upload
 *   bucket     – "offers" | "hotels" | "packages" | "banners" (default: offers)
 *   label      – field label text
 *   hint       – optional hint below the drop zone
 *   className  – extra wrapper class
 */

import { useRef, useState, DragEvent } from "react";
import { Upload, X, Loader2, ImageIcon, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: "offers" | "hotels" | "packages" | "banners";
  label?: string;
  hint?: string;
  className?: string;
}

function getToken(): string {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.includes("supabase") && key.includes("auth")) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const t = parsed?.access_token ?? parsed?.session?.access_token;
          if (t) return t;
        }
      }
    }
  } catch { /* ignore */ }
  return "";
}

export function ImageUploader({
  value, onChange, bucket = "offers",
  label = "صورة الغلاف", hint, className,
}: ImageUploaderProps) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function upload(file: File) {
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", bucket);
      const token = getToken();
      const res = await fetch("/api/admin/upload/image", {
        method: "POST",
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "فشل الرفع");
      onChange(json.data.url);
    } catch (e: unknown) {
      setError((e as Error).message ?? "حدث خطأ أثناء الرفع");
    } finally {
      setLoading(false);
    }
  }

  function handleFile(file: File | null) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("يُسمح فقط بـ JPG أو PNG أو WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("الحد الأقصى للحجم 5 ميجابايت");
      return;
    }
    upload(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-xs font-semibold text-text-secondary">{label}</label>

      {/* Preview */}
      {value && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="preview" className="h-32 w-auto max-w-full rounded-xl object-cover border border-border-light shadow-sm" />
          <button
            type="button"
            onClick={() => { onChange(""); setError(null); }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> تم الرفع
          </div>
        </div>
      )}

      {/* Drop zone */}
      {!value && (
        <div
          onClick={() => !loading && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all p-6",
            dragOver
              ? "border-brand-green bg-green-50"
              : "border-gray-300 bg-gray-50 hover:border-brand-green hover:bg-green-50/50",
            loading && "pointer-events-none opacity-70"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-7 h-7 text-brand-green animate-spin" />
              <p className="text-xs text-text-muted">جاري الرفع...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
                {dragOver ? <ImageIcon className="w-6 h-6 text-brand-green" /> : <Upload className="w-6 h-6 text-brand-green" />}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-text-primary">
                  {dragOver ? "أفلت الصورة هنا" : "اسحب وأفلت الصورة"}
                </p>
                <p className="text-xs text-text-muted mt-0.5">أو <span className="text-brand-green font-semibold">اضغط للاختيار</span></p>
                <p className="text-[11px] text-text-muted mt-1">JPG · PNG · WebP · حتى 5 MB</p>
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      {hint && !error && (
        <p className="text-[11px] text-text-muted">{hint}</p>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <X className="w-3.5 h-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
