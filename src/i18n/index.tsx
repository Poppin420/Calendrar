import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { formatters, translate, type Formatters } from './translate';
import type { Lang, MessageKey, Params } from './types';

export type { Lang, MessageKey } from './types';

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: MessageKey, params?: Params) => string;
  f: Formatters;
}

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = 'fap-lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'el' || saved === 'en') return saved;
  } catch {
    /* storage unavailable (private mode, blocked) */
  }
  return 'el';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = translate(lang, 'meta.title');
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', translate(lang, 'meta.description'));
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key, params) => translate(lang, key, params),
      f: formatters(lang),
    }),
    [lang, setLang],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
