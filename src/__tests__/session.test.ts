// @vitest-environment jsdom
import { act, createElement, useLayoutEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionProvider, useSession } from '../lib/session';

const mocks = vi.hoisted(() => ({
  data: new Map<string, unknown>(),
  getSecret: vi.fn(),
  api: { privacy: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn(), createDream: vi.fn(), listDreams: vi.fn(), deleteDream: vi.fn(), deleteAccount: vi.fn(), requestOniReading: vi.fn() },
  clearVoice: vi.fn(),
}));
vi.mock('../lib/api', () => ({ api: mocks.api, ApiError: class extends Error { constructor(message: string, public status: number) { super(message); } } }));
vi.mock('../lib/voice-notes', () => ({ clearVoiceNotes: mocks.clearVoice }));
vi.mock('../lib/reminders', () => ({ DEFAULT_REMINDER: { enabled: false, hour: 7, minute: 30 }, saveReminder: vi.fn(async () => true) }));
vi.mock('../lib/crash', () => ({ clearLastError: vi.fn(async () => undefined), clearWebError: vi.fn(async () => undefined) }));
vi.mock('../lib/storage', () => ({
  KEYS: { token: 'token', user: 'user', drafts: 'drafts', cache: 'cache', oniRequested: 'requested', demoActive: 'demoActive', demoDreams: 'demoDreams', journal: 'journal', demoJournal: 'demoJournal', pendingTranscript: 'pendingTranscript', demoPendingTranscript: 'demoPendingTranscript' },
  secure: {
    get: mocks.getSecret,
    set: async (key: string, value: string) => { mocks.data.set(key, value); },
    remove: async (key: string) => { mocks.data.delete(key); },
  },
  local: {
    getJson: async (key: string, fallback: unknown) => mocks.data.get(key) ?? fallback,
    setJson: async (key: string, value: unknown) => { mocks.data.set(key, JSON.parse(JSON.stringify(value))); },
    remove: async (keys: string[]) => { keys.forEach((key) => mocks.data.delete(key)); },
  },
}));

let root: Root;
let session: ReturnType<typeof useSession>;
function Probe() {
  const value = useSession();
  useLayoutEffect(() => { session = value; }, [value]);
  return null;
}
async function mount() {
  root = createRoot(document.createElement('div'));
  await act(async () => { root.render(createElement(SessionProvider, null, createElement(Probe))); });
}
beforeEach(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
  vi.clearAllMocks(); mocks.data.clear();
  mocks.getSecret.mockImplementation(async (key: string) => mocks.data.get(key) ?? null);
  mocks.api.privacy.mockResolvedValue({ oniEnabled: true });
  mocks.api.login.mockResolvedValue({ token: 'test-session', user: { id: 'test-user', name: 'Test' } });
  mocks.api.listDreams.mockResolvedValue([]);
  mocks.api.deleteAccount.mockResolvedValue(undefined);
  mocks.api.createDream.mockResolvedValue({ id: 'saved-1' });
  mocks.api.requestOniReading.mockResolvedValue('en_attente');
  mocks.clearVoice.mockResolvedValue(undefined);
});
afterEach(async () => { if (root) await act(async () => root.unmount()); });

describe('Grimoire, démonstration et effacement', () => {
  it('efface le journal et les transcriptions locales sans toucher aux données du serveur', async () => {
    mocks.data.set('journal', [{ id: 'private-check' }]);
    mocks.data.set('pendingTranscript', 'Ma voix');
    await mount();
    await act(async () => session.clearLocalData());
    expect(mocks.data.has('journal')).toBe(false);
    expect(mocks.data.has('pendingTranscript')).toBe(false);
    expect(mocks.api.deleteAccount).not.toHaveBeenCalled();
  });
  it('termine le démarrage même si le trousseau est indisponible', async () => {
    mocks.getSecret.mockRejectedValue(new Error('Locked'));
    await mount();
    expect(session.ready).toBe(true);
    expect(session.user).toBeNull();
    expect(session.lastError).toContain('trousseau');
  });
  it('garde les données privées séparées de la démo sans appeler les services authentifiés', async () => {
    mocks.data.set('drafts', [{ id: 'draft-private', title: 'Privé', story: 'Récit personnel', dreamDate: '2026-11-07', createdAt: '2026-11-07' }]);
    await mount();
    await act(async () => session.startDemo());
    expect(session.isDemo).toBe(true);
    expect(session.dreams).toHaveLength(3);
    expect(session.dreams.some((dream) => dream.id === 'draft-private')).toBe(false);
    await act(async () => { await session.addDream({ title: 'Essai démo', story: 'Un exemple', dreamDate: '2026-11-07' }); });
    expect(session.dreams).toHaveLength(4);
    await act(async () => session.deleteAccount());
    expect(session.isDemo).toBe(false);
    expect(session.dreams).toHaveLength(1);
    expect(session.dreams[0].id).toBe('draft-private');
    expect(mocks.api.login).not.toHaveBeenCalled();
    expect(mocks.api.createDream).not.toHaveBeenCalled();
    expect(mocks.api.deleteAccount).not.toHaveBeenCalled();
    expect(mocks.clearVoice).toHaveBeenCalledWith(true);
  });
  it('exige un consentement distinct pour chaque demande d’IA', async () => {
    await mount();
    await act(async () => session.signIn('test', 'not-a-real-password'));
    await expect(session.exploreWithOni('1', false)).rejects.toThrow('accord');
    expect(mocks.api.requestOniReading).not.toHaveBeenCalled();
    await act(async () => { await session.exploreWithOni('1', true); });
    expect(mocks.api.requestOniReading).toHaveBeenCalledWith('test-session', '1', true);
    await expect(session.exploreWithOni('2', false)).rejects.toThrow('accord');
    expect(mocks.api.requestOniReading).toHaveBeenCalledTimes(1);
  });
  it('respecte la fermeture du service déclarée par le serveur', async () => {
    mocks.api.privacy.mockResolvedValue({ oniEnabled: false });
    await mount();
    await act(async () => session.signIn('test', 'not-a-real-password'));
    expect(session.oniEnabled).toBe(false);
    await expect(session.exploreWithOni('1', true)).rejects.toThrow('indisponibles');
    expect(mocks.api.requestOniReading).not.toHaveBeenCalled();
  });
  it('conserve le compte si le serveur refuse sa suppression', async () => {
    await mount();
    await act(async () => session.signIn('test', 'not-a-real-password'));
    mocks.api.deleteAccount.mockRejectedValue(new Error('Serveur indisponible'));
    await act(async () => { await expect(session.deleteAccount()).rejects.toThrow('Serveur indisponible'); });
    expect(session.user?.id).toBe('test-user');
    expect(mocks.data.get('token')).toBe('test-session');
    expect(mocks.clearVoice).not.toHaveBeenCalled();
  });
  it('ne restaure pas le cache lorsqu’une ancienne synchronisation finit après la suppression', async () => {
    await mount();
    await act(async () => session.signIn('test', 'not-a-real-password'));
    let finish!: (value: unknown[]) => void;
    mocks.api.listDreams.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    let pending!: Promise<void>;
    await act(async () => { pending = session.refresh(); await Promise.resolve(); });
    await act(async () => session.deleteAccount());
    await act(async () => { finish([{ id: 'late', title: 'Ancien contenu' }]); await pending; });
    expect(session.user).toBeNull();
    expect(session.dreams).toHaveLength(0);
    expect(mocks.data.has('token')).toBe(false);
    expect(mocks.data.has('cache')).toBe(false);
    expect(mocks.clearVoice).toHaveBeenCalledWith();
  });
  it('garde le brouillon lorsque le serveur ne confirme pas sa création', async () => {
    await mount();
    await act(async () => session.signIn('test', 'not-a-real-password'));
    mocks.api.createDream.mockResolvedValue(undefined);
    await act(async () => { await session.addDream({ title: 'À conserver', story: 'Un rêve', dreamDate: '2026-11-07' }); await session.refresh(); });
    expect(session.dreams).toHaveLength(1);
    expect(session.dreams[0].pending).toBe(true);
    expect(session.lastError).toContain('brouillon');
  });
});
