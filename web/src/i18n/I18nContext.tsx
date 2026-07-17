import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Lang, translate, TranslationKey } from './translations';

const LANG_STORAGE_KEY = 'inventory.lang';

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
};

function detectInitialLang(): Lang {
  const stored = localStorage.getItem(LANG_STORAGE_KEY);

  if (stored === 'en' || stored === 'es') {
    return stored;
  }

  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectInitialLang());

  const setLang = useCallback((nextLang: Lang) => {
    localStorage.setItem(LANG_STORAGE_KEY, nextLang);
    setLangState(nextLang);
  }, []);

  const t = useCallback((key: TranslationKey) => translate(lang, key), [lang]);

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }

  return context;
}
