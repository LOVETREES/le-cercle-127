// @vitest-environment jsdom
import { act, createElement, useLayoutEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDictation } from '../lib/use-dictation';

const mock = vi.hoisted(() => ({ listeners: new Map<string, Set<(event: unknown) => void>>(), permissions: vi.fn(), start: vi.fn(), stop: vi.fn(), abort: vi.fn(), getModule: vi.fn(), onTranscript: vi.fn(), onFinal: vi.fn() }));
vi.mock('expo-router', async () => { const { useEffect } = await import('react'); return { useFocusEffect: (callback: () => (() => void)) => useEffect(callback, [callback]) }; });
vi.mock('react-native', () => ({ Platform: { OS: 'ios' }, Alert: { alert: vi.fn() } }));
vi.mock('../lib/speech-module', () => ({ getSpeechModule: mock.getModule }));
let root: Root;
let speech: ReturnType<typeof useDictation>;
const emit = (type: string, event: unknown = null) => mock.listeners.get(type)?.forEach((listener) => listener(event));
function Probe() {
  const value = useDictation({ onTranscript: mock.onTranscript, onFinal: mock.onFinal });
  useLayoutEffect(() => { speech = value; }, [value]);
  return null;
}
async function mount() { root = createRoot(document.createElement('div')); await act(async () => root.render(createElement(Probe))); }
beforeEach(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true });
  vi.clearAllMocks(); mock.listeners.clear();
  mock.permissions.mockResolvedValue({ granted: true });
  mock.start.mockImplementation(() => emit('start'));
  mock.getModule.mockReturnValue({
    requestPermissionsAsync: mock.permissions, isRecognitionAvailable: () => true, supportsOnDeviceRecognition: () => true,
    start: mock.start, stop: mock.stop, abort: mock.abort,
    addListener: (type: string, listener: (event: unknown) => void) => {
      const set = mock.listeners.get(type) ?? new Set(); set.add(listener); mock.listeners.set(type, set);
      return { remove: () => set.delete(listener) };
    },
  });
});
afterEach(async () => { if (root) await act(async () => root.unmount()); });
describe('dictée et transcription', () => {
  it('insère les résultats partiels puis définitifs sans perdre les phrases précédentes', async () => {
    await mount(); await act(async () => speech.start());
    expect(speech.phase).toBe('listening');
    await act(async () => emit('result', { isFinal: false, results: [{ transcript: 'Je marchais' }] }));
    await act(async () => emit('result', { isFinal: true, results: [{ transcript: 'Je marchais dans la forêt.' }] }));
    await act(async () => emit('result', { isFinal: true, results: [{ transcript: 'Une porte s’ouvrait.' }] }));
    expect(speech.text).toBe('Je marchais dans la forêt.\nUne porte s’ouvrait.');
    expect(mock.onTranscript).toHaveBeenLastCalledWith(speech.text);
    expect(mock.onFinal).toHaveBeenLastCalledWith(speech.text);
    await act(async () => emit('end'));
    expect(speech.active).toBe(false);
  });
  it('utilise le fichier conservé pour transcrire un audio iPhone', async () => {
    await mount(); await act(async () => speech.start('file:///private/note.m4a'));
    expect(mock.start).toHaveBeenCalledWith(expect.objectContaining({ lang: 'fr-FR', audioSource: { uri: 'file:///private/note.m4a' }, requiresOnDeviceRecognition: true }));
  });
  it('affiche le refus de permission sans démarrer le micro', async () => {
    mock.permissions.mockResolvedValue({ granted: false });
    await mount(); await act(async () => speech.start());
    expect(mock.start).not.toHaveBeenCalled(); expect(speech.error).toContain('réglages'); expect(speech.active).toBe(false);
  });
  it('ne démarre pas après la fermeture de l’écran pendant la demande d’autorisation', async () => {
    let finish!: (value: { granted: boolean }) => void;
    mock.permissions.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    await mount(); let pending!: Promise<void>;
    await act(async () => { pending = speech.start(); });
    await act(async () => root.unmount());
    await act(async () => { finish({ granted: true }); await pending; });
    expect(mock.start).not.toHaveBeenCalled();
  });
  it('garde le texte reconnu lorsque le service signale une interruption', async () => {
    await mount(); await act(async () => speech.start());
    await act(async () => emit('result', { isFinal: false, results: [{ transcript: 'Mon récit' }] }));
    await act(async () => emit('error', { error: 'interrupted' }));
    expect(speech.text).toBe('Mon récit'); expect(speech.active).toBe(false); expect(speech.error).toContain('interrompue');
  });
  it('affiche une explication dans un client sans module natif', async () => {
    mock.getModule.mockReturnValue(null);
    await mount(); await act(async () => speech.start());
    expect(speech.error).toContain('nouvelle version native'); expect(mock.start).not.toHaveBeenCalled();
  });
});
