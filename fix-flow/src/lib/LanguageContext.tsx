/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";
import { LOCALES, type Language } from "./locales";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof LOCALES.en) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("fixflow_lang");
    if (saved === "en" || saved === "si" || saved === "ta") {
      return saved as Language;
    }
    return "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("fixflow_lang", lang);
  };

  const t = (key: keyof typeof LOCALES.en): string => {
    const translation = LOCALES[language][key];
    if (translation !== undefined) {
      return translation;
    }
    // Fallback to English
    return LOCALES.en[key];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
