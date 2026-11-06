import AsyncStorage from '@react-native-async-storage/async-storage';

// Garde-fou : enregistre la dernière erreur JavaScript pour pouvoir l'afficher
// dans « Mon compte » (diagnostic), et évite de fermer l'application pour une
// erreur survenue hors de l'affichage (rappel, navigation, réseau…).
const KEY = 'c127.last-error';

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsType = { getGlobalHandler: () => GlobalHandler; setGlobalHandler: (h: GlobalHandler) => void };

let installed = false;

export function installCrashGuard(): void {
  const eu = (globalThis as { ErrorUtils?: ErrorUtilsType }).ErrorUtils;
  if (installed || !eu) return;
  installed = true;
  const previous = eu.getGlobalHandler();
  eu.setGlobalHandler((error, isFatal) => {
    const e = error instanceof Error ? error : new Error(String(error));
    const entry = { at: new Date().toISOString(), fatal: Boolean(isFatal), message: e.message, stack: (e.stack ?? '').slice(0, 1500) };
    AsyncStorage.setItem(KEY, JSON.stringify(entry)).catch(() => undefined);
    // En développement, on garde l'écran rouge habituel.
    if (__DEV__) previous(error, isFatal);
  });
}

export type LastError = { at: string; fatal: boolean; message: string; stack: string };

export async function readLastError(): Promise<LastError | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LastError) : null;
  } catch {
    return null;
  }
}

export async function clearLastError(): Promise<void> {
  await AsyncStorage.removeItem(KEY).catch(() => undefined);
}
