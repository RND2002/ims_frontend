"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations } from "./translations";

type Language = "en" | "hi";

type LanguageContextProps = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => any;
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  // Sync language with localStorage and browser language preference on client mount
  useEffect(() => {
    const savedLang = localStorage.getItem("hisaab-lang") as Language | null;
    if (savedLang === "en" || savedLang === "hi") {
      setLanguage(savedLang);
    } else {
      // Auto-detect browser locale
      const browserLang = navigator.language || (navigator as any).userLanguage;
      if (browserLang && browserLang.startsWith("hi")) {
        setLanguage("hi");
      }
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("hisaab-lang", lang);
  };

  // A simple safe lookup helper for nested objects (e.g. "hero.title")
  const t = (key: string) => {
    const keys = key.split(".");
    let current: any = translations[language];
    for (const k of keys) {
      if (current[k] === undefined) {
        return key; // fallback to key name if not found
      }
      current = current[k];
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
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
