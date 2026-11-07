import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { KEYS, local } from '../lib/storage';
import { getLang, isLang, setCurrentLang, type Lang } from './index';

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'fr', setLang: () => undefined });

/** Garde la langue choisie et redessine toute l'application quand elle change. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getLang());

  useEffect(() => {
    local.getJson<string>(KEYS.lang, 'fr').then((saved) => {
      if (isLang(saved) && saved !== getLang()) {
        setCurrentLang(saved);
        setLangState(saved);
      }
    }, () => undefined);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setCurrentLang(l);
    setLangState(l);
    local.setJson(KEYS.lang, l).catch(() => undefined);
  }, []);

  return (
    <Ctx.Provider value={{ lang, setLang }}>
      <Fragmented key={lang}>{children}</Fragmented>
    </Ctx.Provider>
  );
}

function Fragmented({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useLanguage() {
  return useContext(Ctx);
}
