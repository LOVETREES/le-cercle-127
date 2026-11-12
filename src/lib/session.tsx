import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { ApiError, api } from './api';
import { mergeDreams, makeDraft, type Dream, type DreamInput, type User } from './model';
import { clearPalmReadings, palmOwnerFor, setPalmOwner } from './palm';
import { clearEmotions } from './naia';
import { clearPortes } from './portes';
import { clearDreamer } from './dreamer';
import { clearDraws } from './oracle/history';
import { clearTodaysDraw } from './oracle/daily';
import { clearDailyReading, dailyReadingUsed, markDailyReadingUsed } from './oni-daily';
import { clearJournal } from './journal-intime';
import { clearLabyrinthe } from './labyrinthe/store';
import { clearRitual } from './rituel';
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
  unassignedDrafts: Dream[];
  claimLocalDrafts: () => Promise<void>;
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
  exploreWithOni: (id: string, consent: boolean) => Promise<OniOutcome>;
  /** Identifiant en ligne d'un rêve juste gardé (brouillon), une fois la synchronisation faite. */
  resolveDreamId: (id: string) => Promise<string | undefined>;
  oniRequested: string[];
};

/** Résultat d'une demande à Oni : lecture du jour immédiate, accompagnement (détresse), ou lecture relue plus tard. */
export type OniOutcome =
  | { status: 'lue'; reading: string; questions: string[]; closing?: string; saved: boolean }
  | { status: 'accompagnement'; reading: string }
  | { status: 'en_attente' | 'deja_demandee'; afterDaily?: boolean };

const LOCAL_ANONYMOUS_OWNER = 'local:anonymous';
const LOCAL_UNASSIGNED_OWNER = 'local:unassigned';
const draftOwnerForUser = (userId: string) => `user:${userId}`;
const isUnassignedDraft = (draft: Dream) =>
  !draft.ownerId || draft.ownerId === LOCAL_ANONYMOUS_OWNER || draft.ownerId === LOCAL_UNASSIGNED_OWNER;

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
  const activeUserId = useRef<string | null>(null);
  const syncQueue = useRef<Promise<void>>(Promise.resolve());
  const syncedIds = useRef<Record<string, string>>({});

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
      const scopedDrafts = d.map((draft) =>
        draft.ownerId ? draft : { ...draft, ownerId: LOCAL_UNASSIGNED_OWNER },
      );
      if (scopedDrafts.some((draft, index) => draft.ownerId !== d[index]?.ownerId)) {
        await local.setJson(KEYS.drafts, scopedDrafts).catch(() => undefined);
      }
      activeToken.current = t;
      activeUserId.current = t && u ? u.id : null;
      draftsRef.current = scopedDrafts;
      demoRef.current = demoData;
      setDemoRecords(demoData);
      setIsDemo(demoActive && !t);
      setToken(t);
      setUser(t ? u : null);
      setDrafts(scopedDrafts);
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
    activeUserId.current = null;
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
    await clearPalmReadings('demo');
    await clearEmotions('demo');
    await clearRitual('demo');
    await clearPortes('demo');
    await clearDreamer('demo');
    await clearDraws('demo');
    await clearTodaysDraw('demo');
    await clearJournal('demo');
    await clearLabyrinthe('demo');
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
    async (tk: string, userId: string) => {
      if (!userId) return;
      const ownerId = draftOwnerForUser(userId);
      const epoch = sessionEpoch.current;
      const task = syncQueue.current.catch(() => undefined).then(async () => {
      if (epoch !== sessionEpoch.current || activeToken.current !== tk) return;
      setSyncing(true);
      setLastError(null);
      try {
        for (const d of draftsRef.current.filter((draft) => draft.ownerId === ownerId)) {
          if (epoch !== sessionEpoch.current) return;
          const saved = await api.createDream(tk, d);
          if (epoch !== sessionEpoch.current) return;
          if (!saved?.id) throw new Error(t('Le serveur n’a pas confirmé l’enregistrement. Votre brouillon est conservé sur cet appareil.'));
          syncedIds.current[d.id] = String(saved.id);
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
      activeUserId.current = u.id;
      setIsDemo(false);
      await local.remove([KEYS.demoActive]);
      await secure.set(KEYS.token, tk);
      await local.setJson(KEYS.user, u);
      setToken(tk);
      setUser(u);
      await sync(tk, u.id);
    },
    [sync],
  );

  // Les lectures de la main suivent la personne : démonstration, non connectée ou compte.
  setPalmOwner(palmOwnerFor(isDemo, user?.id));

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
        await local.remove([KEYS.cache, KEYS.journal, KEYS.pendingTranscript, KEYS.presenceDays]);
        await clearPalmReadings(palmOwnerFor(false, user?.id));
        await clearEmotions(palmOwnerFor(false, user?.id));
        await clearRitual(palmOwnerFor(false, user?.id));
        await clearPortes(palmOwnerFor(false, user?.id));
        await clearDreamer(palmOwnerFor(false, user?.id));
        await clearDraws(palmOwnerFor(false, user?.id));
        await clearTodaysDraw(palmOwnerFor(false, user?.id));
        setServer([]);
      },
      user: isDemo ? { ...DEMO_USER, name: t(DEMO_USER.name) } : user,
      token: isDemo ? null : token,
      unassignedDrafts: !isDemo && user ? drafts.filter(isUnassignedDraft) : [],
      dreams: isDemo
        ? demoRecords
        : mergeDreams(
            server,
            user
              ? drafts.filter((draft) => draft.ownerId === draftOwnerForUser(user.id))
              : drafts.filter((draft) => draft.ownerId === LOCAL_ANONYMOUS_OWNER),
          ),
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
        const deletedOwner = palmOwnerFor(false, user?.id);
        const deletedDraftOwner = user?.id ? draftOwnerForUser(user.id) : null;
        await clearSession();
        try {
          await persistDrafts(
            deletedDraftOwner
              ? draftsRef.current.filter((draft) => draft.ownerId !== deletedDraftOwner)
              : draftsRef.current,
          );
          await clearVoiceNotes();
          await local.remove([KEYS.journal, KEYS.pendingTranscript, KEYS.presenceDays]);
          await clearPalmReadings(deletedOwner);
          await clearEmotions(deletedOwner);
          await clearRitual(deletedOwner);
          await clearPortes(deletedOwner);
          await clearDreamer(deletedOwner);
          await clearDraws(deletedOwner);
          await clearTodaysDraw(deletedOwner);
          await clearDailyReading(deletedOwner);
          await clearJournal(deletedOwner);
          await clearLabyrinthe(deletedOwner);
          await saveReminder(DEFAULT_REMINDER);
          await Promise.all([clearLastError(), clearWebError()]);
        } catch {
          throw new Error(t('Le compte a été supprimé sur le serveur. Réessayez « Effacer les données de cet appareil » pour terminer le nettoyage local.'));
        }
      },
      async refresh() {
        if (token && user?.id && !isDemo) await sync(token, user.id);
      },
      async claimLocalDrafts() {
        if (isDemo || !token || !user) throw new Error(t('Connectez-vous pour importer les brouillons locaux.'));
        const ownerId = draftOwnerForUser(user.id);
        const next = draftsRef.current.map((draft) =>
          isUnassignedDraft(draft) ? { ...draft, ownerId } : draft,
        );
        if (next.every((draft, index) => draft === draftsRef.current[index])) return;
        await persistDrafts(next);
        await sync(token, user.id);
      },
      async addDream(input) {
        const draft = makeDraft(input);
        if (isDemo) {
          const example = { ...draft, id: 'demo-' + draft.id, pending: false };
          await persistDemo([example, ...demoRef.current]);
          return example;
        }
        const scopedDraft: Dream = {
          ...draft,
          ownerId: activeUserId.current ? draftOwnerForUser(activeUserId.current) : LOCAL_ANONYMOUS_OWNER,
        };
        const next = [scopedDraft, ...draftsRef.current];
        await persistDrafts(next);
        if (token && user?.id) void sync(token, user.id);
        return scopedDraft;
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
        if (!token || !user?.id) throw new ApiError(t('Connectez-vous pour demander une lecture à Oni.'), 401);
        const deferred = async (afterDaily = false): Promise<OniOutcome> => {
          const status = await api.requestOniReading(token, id, consent);
          const next = oniRequested.includes(id) ? oniRequested : [...oniRequested, id];
          setOniRequested(next);
          await local.setJson(KEYS.oniRequested, next);
          return { status, afterDaily };
        };
        // Une lecture immédiate par jour ; ensuite, la lecture relue avant envoi (sous 48 h).
        if (await dailyReadingUsed()) return deferred(true);
        const daily = await api.requestDailyReading(token, id, consent);
        if (daily.status === 'lue') {
          await markDailyReadingUsed();
          void sync(token, user.id);
          return daily;
        }
        if (daily.status === 'accompagnement') return daily;
        if (daily.status === 'deja_demandee') return { status: 'deja_demandee' };
        if (daily.status === 'quota') {
          await markDailyReadingUsed();
          return deferred(true);
        }
        return deferred(false);
      },
      async resolveDreamId(id) {
        if (!id.startsWith('draft-')) return id;
        await syncQueue.current.catch(() => undefined);
        return syncedIds.current[id];
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
