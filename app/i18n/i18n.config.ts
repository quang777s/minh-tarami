export const i18n = {
  defaultLocale: "en",
  supportedLocales: ["en", "vi"],
} as const;

export type Locale = (typeof i18n.supportedLocales)[number]; 