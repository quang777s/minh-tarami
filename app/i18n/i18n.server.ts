import { createCookie } from "@remix-run/node";
import { i18n, type Locale } from "./i18n.config";

export const i18nCookie = createCookie("i18n", {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
});

export async function getLocale(request: Request): Promise<Locale> {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await i18nCookie.parse(cookieHeader)) || {};
  const acceptLanguage = request.headers.get("accept-language");
  
  // Check cookie first
  if (cookie.locale && i18n.supportedLocales.includes(cookie.locale as Locale)) {
    return cookie.locale as Locale;
  }
  
  // Then check Accept-Language header
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(",")[0]
      .split("-")[0]
      .toLowerCase();
    
    if (i18n.supportedLocales.includes(preferredLocale as Locale)) {
      return preferredLocale as Locale;
    }
  }
  
  return i18n.defaultLocale;
}

export async function setLocale(request: Request, locale: Locale) {
  return await i18nCookie.serialize({ locale });
} 