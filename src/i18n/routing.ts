import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Supported locales
  locales: ["ar", "en"],

  // Default locale is Arabic
  defaultLocale: "ar",

  // Locale prefix strategy: always include locale in URL
  // /ar/... and /en/...
  localePrefix: "always",
});
