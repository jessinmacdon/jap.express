import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setAuthToken, setOnUnauthorized } from '@/api/client';
import type { Me } from '@/api/types';
import { dict, type Dict, type Lang } from '@/i18n';
import { prefs, secure } from '@/lib/storage';

interface Session {
  ready: boolean;
  token: string | null;
  me: Me | undefined;
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
  signIn: (token: string, me: Me) => Promise<void>;
  signOut: () => Promise<void>;
  updateMe: (patch: Partial<Pick<Me, 'firstName' | 'lastName' | 'email' | 'lang' | 'autoTranslate' | 'goals'>>) => Promise<Me>;
}

const Ctx = createContext<Session | null>(null);
const TOKEN = 'jx.token';
const LANG = 'jx.lang';

const deviceLang = (): Lang => {
  try {
    return getLocales()[0]?.languageCode === 'fr' ? 'fr' : 'en';
  } catch {
    return 'en';
  }
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [localLang, setLocalLang] = useState<Lang>(deviceLang());

  useEffect(() => {
    (async () => {
      const [tk, lg] = await Promise.all([secure.get(TOKEN), prefs.get<Lang | null>(LANG, null)]);
      if (lg) setLocalLang(lg);
      setAuthToken(tk);
      setToken(tk);
      setReady(true);
    })();
  }, []);

  const signOut = useCallback(async () => {
    await secure.del(TOKEN);
    setAuthToken(null);
    setToken(null);
    qc.clear();
  }, [qc]);

  useEffect(() => setOnUnauthorized(() => void signOut()), [signOut]);

  const meQ = useQuery({ queryKey: ['me'], queryFn: () => api<Me>('GET', '/me'), enabled: !!token });
  const me = meQ.data;
  // The account language wins once signed in; before that, the device / welcome toggle.
  const lang: Lang = me?.lang ?? localLang;

  const updateMe = useCallback<Session['updateMe']>(
    async (patch) => {
      const next = await api<Me>('PATCH', '/me', { body: patch });
      qc.setQueryData(['me'], next);
      return next;
    },
    [qc],
  );

  const setLang = useCallback(
    (l: Lang) => {
      setLocalLang(l);
      prefs.set(LANG, l);
      if (token) {
        qc.setQueryData<Me>(['me'], (m) => (m ? { ...m, lang: l } : m));
        api('PATCH', '/me', { body: { lang: l } }).catch(() => undefined);
      }
    },
    [token, qc],
  );

  const signIn = useCallback(
    async (tk: string, m: Me) => {
      await secure.set(TOKEN, tk);
      setAuthToken(tk);
      qc.setQueryData(['me'], m);
      setToken(tk);
      // Carry the language chosen on the welcome screen into a new account.
      if (m.lang !== localLang && !m.profileComplete) {
        api<Me>('PATCH', '/me', { body: { lang: localLang } }).then((n) => qc.setQueryData(['me'], n)).catch(() => undefined);
      }
    },
    [qc, localLang],
  );

  const value = useMemo<Session>(() => ({ ready, token, me, lang, t: dict(lang), setLang, signIn, signOut, updateMe }), [ready, token, me, lang, setLang, signIn, signOut, updateMe]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSession outside SessionProvider');
  return s;
};

export const useT = () => {
  const { t, lang } = useSession();
  return { t, lang };
};
