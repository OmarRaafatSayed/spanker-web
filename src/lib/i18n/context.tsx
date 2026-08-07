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

export function I18nProvider({ children }: { children: ReactNode }) {
  // Arabic is the default
  const [locale, setLocale] = useState<Locale>("ar");

  // Restore saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "en" || saved === "ar") {
      setLocale(saved);
    }
  }, []);

  // Sync dir + lang attributes on <html> whenever locale changes
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
