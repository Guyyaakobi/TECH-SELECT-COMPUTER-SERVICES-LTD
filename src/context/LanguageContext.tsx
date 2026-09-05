import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'he' | 'en';

interface LanguageContextType {
  lang: Language;
  language?: Language;
  setLang: (lang: Language) => void;
  isHe: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'he',
  language: 'he',
  setLang: () => {},
  isHe: true,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('he');

  const setLang = (newLang: Language) => {
    setLangState(newLang);
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
