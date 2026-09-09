"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { translations, type Locale, type Translations } from "./translations";

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  isRTL: boolean;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "spanker-locale";

interface I18nProviderProps {
  children: ReactNode;
  /** Optional: locale injected from server (e.g., from [locale] layout) */
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  // Arabic is the default; prefer server-injected locale
  const [locale, setLocale] = useState<Locale>(initialLocale ?? "ar");

  // Restore saved preference on mount (only when not server-injected)
  useEffect(() => {
    if (!initialLocale) {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "en" || saved === "ar") {
        setLocale(saved);
      }
    }
  }, [initialLocale]);

  // Sync dir + lang attributes on <html> whenever locale changes
  // (no-op when [locale] layout already sets them server-side)
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("lang", locale);
    html.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
  }, [locale]);

  function toggleLocale() {
    setLocale((prev) => {
      const next: Locale = prev === "ar" ? "en" : "ar";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <I18nContext.Provider
      value={{
        locale,
        t: translations[locale],
        isRTL: locale === "ar",
        toggleLocale,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
