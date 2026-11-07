import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { ApiError, api } from './api';
import { mergeDreams, makeDraft, type Dream, type DreamInput, type User } from './model';
import { KEYS, local, secure } from './storage';
import { DEMO_USER, demoDreams } from './demo';
import { clearVoiceNotes } from './voice-notes';
import { DEFAULT_REMINDER, saveReminder } from './reminders';
import { clearLastError, clearWebError } from './crash';
import { t } from '../i18n';

type SessionState = {
  ready: boolean;
  isDemo: boolean;
  startDemo: () => Promise<void>;
  clearLocalData: () => Promise<void>;
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
  exploreWithOni: (id: string, consent: boolean) => Promise<'en_attente' | 'deja_demandee'>;
  oniRequested: string[];
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
  const [oniRequested, setOniRequested] = useState<string[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [demoRecords, setDemoRecords] = useState<Dream[]>([]);
  const draftsRef = useRef<Dream[]>([]);
  const demoRef = useRef<Dream[]>([]);
  const sessionEpoch = useRef(0);
  const activeToken = useRef<string | null>(null);
  const syncQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    api.privacy().then((privacy) => { if (active) setOniEnabled(privacy.oniEnabled); }).catch(() => { if (active) setOniEnabled(false); });
    return () => { active = false; };
  }, []);

  // Restauration au démarrage : jeton, profil, brouillons et dernier Grimoire connu (hors ligne).
  useEffect(() => {
    (async () => {
      const [t, u, d, c, r, demoActive, demoData] = await Promise.all([
        secure.get(KEYS.token).catch(() => { setLastError('Le trousseau de session est indisponible. Reconnectez-vous.'); return null; }),
        local.getJson<User | null>(KEYS.user, null),
        local.getJson<Dream[]>(KEYS.drafts, []),
        local.getJson<Dream[]>(KEYS.cache, []),
        local.getJson<string[]>(KEYS.oniRequested, []),
        local.getJson<boolean>(KEYS.demoActive, false),
        local.getJson<Dream[]>(KEYS.demoDreams, []),
      ]);
      activeToken.current = t;
      draftsRef.current = d;
      demoRef.current = demoData;
      setDemoRecords(demoData);
      setIsDemo(demoActive && !t);
      setToken(t);
      setUser(t ? u : null);
      setDrafts(d);
      setServer(t ? c : []);
      setOniRequested(r);
      setReady(true);
    })();
  }, []);

  const persistDrafts = useCallback(async (next: Dream[]) => {
    draftsRef.current = next;
    setDrafts(next);
    await local.setJson(KEYS.drafts, next);
  }, []);

  const clearSession = useCallback(async () => {
    sessionEpoch.current += 1;
    activeToken.current = null;
    setSyncing(false);
    await secure.remove(KEYS.token);
    await local.remove([KEYS.user, KEYS.cache, KEYS.oniRequested]);
    setToken(null);
    setUser(null);
    setServer([]);
    setOniRequested([]);
  }, []);

  const persistDemo = useCallback(async (next: Dream[]) => {
    demoRef.current = next;
    setDemoRecords(next);
    await local.setJson(KEYS.demoDreams, next);
  }, []);

  const exitDemo = useCallback(async () => {
    await clearVoiceNotes(true);
    await local.remove([KEYS.demoActive, KEYS.demoDreams, KEYS.demoJournal, KEYS.demoPendingTranscript]);
    demoRef.current = [];
    setDemoRecords([]);
    setIsDemo(false);
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
    async (tk: string) => {
      const epoch = sessionEpoch.current;
      const task = syncQueue.current.catch(() => undefined).then(async () => {
      if (epoch !== sessionEpoch.current || activeToken.current !== tk) return;
      setSyncing(true);
      setLastError(null);
      try {
        for (const d of [...draftsRef.current]) {
          if (epoch !== sessionEpoch.current) return;
          const saved = await api.createDream(tk, d);
          if (epoch !== sessionEpoch.current) return;
          if (!saved?.id) throw new Error(t('Le serveur n’a pas confirmé l’enregistrement. Votre brouillon est conservé sur cet appareil.'));
          await persistDrafts(draftsRef.current.filter((x) => x.id !== d.id));
        }
        const list = await api.listDreams(tk);
        if (epoch !== sessionEpoch.current) return;
        setServer(list);
        await local.setJson(KEYS.cache, list);
      } catch (e) {
        if (epoch !== sessionEpoch.current) return;
        setLastError(e instanceof Error ? e.message : 'Synchronisation impossible.');
        if (e instanceof ApiError && e.status === 401) await clearSession();
      } finally {
        if (epoch === sessionEpoch.current) setSyncing(false);
      }
      });
      syncQueue.current = task;
      await task;
    },
    [persistDrafts, clearSession],
  );

  const startSession = useCallback(
    async (tk: string, u: User) => {
      sessionEpoch.current += 1;
      activeToken.current = tk;
      setIsDemo(false);
      await local.remove([KEYS.demoActive]);
      await secure.set(KEYS.token, tk);
      await local.setJson(KEYS.user, u);
      setToken(tk);
      setUser(u);
      await sync(tk);
    },
    [sync],
  );

  const value = useMemo<SessionState>(
    () => ({
      ready,
      isDemo,
      async startDemo() {
        if (token) throw new Error(t('Déconnectez-vous avant d’ouvrir la démonstration.'));
        const examples = demoDreams();
        await persistDemo(examples);
        await local.setJson(KEYS.demoActive, true);
        setIsDemo(true);
      },
      async clearLocalData() {
        if (isDemo) return exitDemo();
        await persistDrafts([]);
        await clearVoiceNotes();
        await saveReminder(DEFAULT_REMINDER);
        await Promise.all([clearLastError(), clearWebError()]);
        await local.remove([KEYS.cache, KEYS.journal, KEYS.pendingTranscript]);
        setServer([]);
      },
      user: isDemo ? DEMO_USER : user,
      token: isDemo ? null : token,
      dreams: isDemo ? demoRecords : mergeDreams(server, drafts),
      syncing,
      lastError,
      oniEnabled: oniEnabled && !isDemo,
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
        if (isDemo) return exitDemo();
        if (token) await api.logout(token);
        await clearSession();
      },
      async deleteAccount() {
        if (isDemo) return exitDemo();
        if (!token) return;
        sessionEpoch.current += 1;
        await api.deleteAccount(token).catch(handleAuthError);
        await clearSession();
        try {
          await persistDrafts([]);
          await clearVoiceNotes();
          await local.remove([KEYS.journal, KEYS.pendingTranscript]);
          await saveReminder(DEFAULT_REMINDER);
          await Promise.all([clearLastError(), clearWebError()]);
        } catch {
          throw new Error(t('Le compte a été supprimé sur le serveur. Réessayez « Effacer les données de cet appareil » pour terminer le nettoyage local.'));
        }
      },
      async refresh() {
        if (token && !isDemo) await sync(token);
      },
      async addDream(input) {
        const draft = makeDraft(input);
        if (isDemo) {
          const example = { ...draft, id: 'demo-' + draft.id, pending: false };
          await persistDemo([example, ...demoRef.current]);
          return example;
        }
        const next = [draft, ...draftsRef.current];
        await persistDrafts(next);
        if (token) void sync(token);
        return draft;
      },
      async removeDream(id) {
        if (isDemo) return persistDemo(demoRef.current.filter((d) => d.id !== id));
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
      async exploreWithOni(id, consent) {
        if (isDemo) throw new Error(t('La démonstration utilise uniquement des exemples locaux.'));
        if (!consent) throw new Error(t('Votre accord est nécessaire avant chaque envoi à Oni.'));
        if (!oniEnabled) throw new Error(t('Les nouvelles demandes de lecture sont actuellement indisponibles.'));
        if (!token) throw new ApiError(t('Connectez-vous pour demander une lecture à Oni.'), 401);
        const status = await api.requestOniReading(token, id, consent);
        const next = oniRequested.includes(id) ? oniRequested : [...oniRequested, id];
        setOniRequested(next);
        await local.setJson(KEYS.oniRequested, next);
        return status;
      },
      oniRequested,
    }),
    [ready, user, token, server, drafts, syncing, lastError, oniEnabled, oniRequested, isDemo, demoRecords, persistDemo, exitDemo, startSession, clearSession, handleAuthError, persistDrafts, sync],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionState {
  const v = useContext(Ctx);
  if (!v) throw new Error(t('useSession doit être utilisé dans <SessionProvider>.'));
  return v;
}
