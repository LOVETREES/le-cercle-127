import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ApiError, api } from './api';
import { mergeDreams, makeDraft, type Dream, type DreamInput, type User } from './model';
import { KEYS, local, secure } from './storage';

type SessionState = {
  ready: boolean;
  user: User | null;
  token: string | null;
  dreams: Dream[];
  syncing: boolean;
  lastError: string | null;
  oniEnabled: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (pseudonym: string, email: string, password: string, ageConfirmed: boolean) => Promise<'signed-in' | 'created'>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refresh: () => Promise<void>;
  addDream: (input: DreamInput) => Promise<Dream>;
  removeDream: (id: string) => Promise<void>;
  exploreWithOni: (id: string) => Promise<string>;
};

const Ctx = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [server, setServer] = useState<Dream[]>([]);
  const [drafts, setDrafts] = useState<Dream[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [oniEnabled, setOniEnabled] = useState(false);

  // Restauration au démarrage : jeton, profil, brouillons et dernier Grimoire connu (hors ligne).
  useEffect(() => {
    (async () => {
      const [t, u, d, c] = await Promise.all([
        secure.get(KEYS.token),
        local.getJson<User | null>(KEYS.user, null),
        local.getJson<Dream[]>(KEYS.drafts, []),
        local.getJson<Dream[]>(KEYS.cache, []),
      ]);
      setToken(t);
      setUser(t ? u : null);
      setDrafts(d);
      setServer(t ? c : []);
      setReady(true);
      api.privacy().then((p) => setOniEnabled(p.oniEnabled), () => undefined);
    })();
  }, []);

  const persistDrafts = useCallback(async (next: Dream[]) => {
    setDrafts(next);
    await local.setJson(KEYS.drafts, next);
  }, []);

  const clearSession = useCallback(async () => {
    await secure.remove(KEYS.token);
    await local.remove([KEYS.user, KEYS.cache]);
    setToken(null);
    setUser(null);
    setServer([]);
  }, []);

  const handleAuthError = useCallback(
    async (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) await clearSession();
      throw e;
    },
    [clearSession],
  );

  // Envoie les brouillons au serveur, puis recharge le Grimoire.
  const sync = useCallback(
    async (tk: string, pending: Dream[]) => {
      setSyncing(true);
      setLastError(null);
      try {
        let remaining = pending;
        for (const d of pending) {
          await api.createDream(tk, d);
          remaining = remaining.filter((x) => x.id !== d.id);
          await persistDrafts(remaining);
        }
        const list = await api.listDreams(tk);
        setServer(list);
        await local.setJson(KEYS.cache, list);
      } catch (e) {
        setLastError(e instanceof Error ? e.message : 'Synchronisation impossible.');
        if (e instanceof ApiError && e.status === 401) await clearSession();
      } finally {
        setSyncing(false);
      }
    },
    [persistDrafts, clearSession],
  );

  const startSession = useCallback(
    async (tk: string, u: User) => {
      await secure.set(KEYS.token, tk);
      await local.setJson(KEYS.user, u);
      setToken(tk);
      setUser(u);
      await sync(tk, drafts);
    },
    [drafts, sync],
  );

  const value = useMemo<SessionState>(
    () => ({
      ready,
      user,
      token,
      dreams: mergeDreams(server, drafts),
      syncing,
      lastError,
      oniEnabled,
      async signIn(email, password) {
        const s = await api.login(email, password);
        await startSession(s.token, s.user);
      },
      async signUp(pseudonym, email, password, ageConfirmed) {
        const s = await api.register({ pseudonym, email, password, ageConfirmed });
        if (!s) return 'created';
        await startSession(s.token, s.user);
        return 'signed-in';
      },
      async signOut() {
        if (token) await api.logout(token);
        await clearSession();
      },
      async deleteAccount() {
        if (!token) return;
        await api.deleteAccount(token).catch(handleAuthError);
        await persistDrafts([]);
        await clearSession();
      },
      async refresh() {
        if (token) await sync(token, drafts);
      },
      async addDream(input) {
        const draft = makeDraft(input);
        const next = [draft, ...drafts];
        await persistDrafts(next);
        if (token) void sync(token, next);
        return draft;
      },
      async removeDream(id) {
        if (id.startsWith('draft-')) {
          await persistDrafts(drafts.filter((d) => d.id !== id));
          return;
        }
        if (!token) return;
        await api.deleteDream(token, id).catch(handleAuthError);
        const list = server.filter((d) => d.id !== id);
        setServer(list);
        await local.setJson(KEYS.cache, list);
      },
      async exploreWithOni(id) {
        if (!token) throw new ApiError('Connectez-vous pour demander une exploration à Oni.', 401);
        const reading = await api.exploreWithOni(token, id).catch(handleAuthError);
        const list = server.map((d) => (d.id === id ? { ...d, oniReading: reading } : d));
        setServer(list);
        await local.setJson(KEYS.cache, list);
        return reading;
      },
    }),
    [ready, user, token, server, drafts, syncing, lastError, oniEnabled, startSession, clearSession, handleAuthError, persistDrafts, sync],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession doit être utilisé dans <SessionProvider>.');
  return v;
}
