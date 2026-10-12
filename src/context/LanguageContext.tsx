import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'he' | 'en';

interface LanguageContextType {
  lang: Language;
  language?: Language;
  setLang: (lang: Language) => void;
  isHe: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  language: 'en',
  setLang: () => {},
  isHe: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tech_select_lang') as Language | null;
      if (saved === 'he' || saved === 'en') {
        return saved;
      }
    }
    return 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tech_select_lang', newLang);
    }
    document.documentElement.dir = newLang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, language: lang, setLang, isHe: lang === 'he' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
