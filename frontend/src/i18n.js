import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en/translation.json";
import tr from "./locales/tr/translation.json";
import adminEn from "./locales/en/admin.json";
import adminTr from "./locales/tr/admin.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
        admin: adminEn
      },
      tr: {
        translation: tr,
        admin: adminTr
      }
    },
    ns: ["translation", "admin"],
    defaultNS: "translation",
    fallbackLng: "en",
    supportedLngs: ["en", "tr"],
    interpolation: {
      escapeValue: false
    }
  });

/** Current UI language as the backend expects it: "tr" | "en". */
export function currentLanguage() {
  return (i18n.resolvedLanguage || i18n.language || "tr").startsWith("en") ? "en" : "tr";
}

/** Persist the UI language on the user so emails are sent in it. */
function syncUserLanguage() {
  const token = localStorage.getItem("authToken");
  if (!token) return;
  fetch(`${apiBase}/users/me/language`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ language: currentLanguage() }),
  }).catch(() => {});
}

/**
 * Tag every API request with the UI language (X-Lang) so backend
 * error messages come back in the same language.
 */
const apiBase = import.meta.env?.VITE_API_URL || "/ehp/api";
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (!url.startsWith(apiBase) && !url.includes("/api/")) return nativeFetch(input, init);
  const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
  if (!headers.has("X-Lang")) headers.set("X-Lang", currentLanguage());
  return nativeFetch(input, { ...init, headers });
};

/** Keep the tab title and <html lang> in the UI language. */
function applyDocumentLanguage() {
  const lang = currentLanguage();
  document.documentElement.lang = lang;
  document.title = lang === "tr" ? "EDU Eğitim Oteli" : "EDU Education Hotel";
}

i18n.on("languageChanged", () => {
  applyDocumentLanguage();
  syncUserLanguage();
});
applyDocumentLanguage();
syncUserLanguage();

export default i18n;
