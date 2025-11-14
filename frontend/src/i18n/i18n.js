import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const lng = localStorage.getItem("lng") || "en";

i18n
  .use(initReactI18next)
  .init({
    lng,
    fallbackLng: "en",
    debug: false,
    resources: {}, // we'll use the static files from /public via backend load
  });

// Load resources from /public/locales at runtime
async function loadNamespaces(language) {
  const res = await fetch(`/locales/${language}/translation.json`);
  const data = await res.json();
  i18n.addResourceBundle(language, "translation", data, true, true);
}

export async function ensureLanguage(language) {
  if (!i18n.hasResourceBundle(language, "translation")) {
    await loadNamespaces(language);
  }
  i18n.changeLanguage(language);
  localStorage.setItem("lng", language);
}

export default i18n;
