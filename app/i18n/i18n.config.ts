export const i18n = {
  defaultLocale: "vi",
  supportedLocales: ["en", "vi"],
} as const;

export type Locale = (typeof i18n.supportedLocales)[number]; 