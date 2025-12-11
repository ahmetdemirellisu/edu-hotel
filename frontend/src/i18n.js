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

export default i18n;
