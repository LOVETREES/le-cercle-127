// Rituel du jour : trois gestes courts (carte, émotion, main) et une série de jours.
// La carte est signalée par la page de l'Oracle (message « c127-oracle-reveal »),
// l'émotion vient de Naïa (accueil), la main des lectures de Terra enregistrées.
import { dayKey } from './insights';
import type { EmotionEntry } from './naia';
import type { PalmReading } from './palm';
import { currentOwner } from './palm';
import { KEYS, local } from './storage';

export type RitualStore = { carte?: string; lastDay?: string; streak?: number };
export type RitualToday = { carte: boolean; emotion: boolean; main: boolean; count: number; streak: number };

const keyFor = () => `${KEYS.rituel}:${currentOwner()}`;

/** Le message envoyé par l'Oracle quand une carte est révélée. */
export function isOracleReveal(raw: string): boolean {
  try {
    const d = JSON.parse(raw);
    return !!d && d.type === 'c127-oracle-reveal';
  } catch {
    return false;
  }
}

/** Un geste accompli aujourd'hui fait avancer la série (une fois par jour). */
export function withGesture(store: RitualStore, now = new Date()): RitualStore {
  const today = dayKey(now);
  if (store.lastDay === today) return store;
  const yesterday = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  return { ...store, lastDay: today, streak: store.lastDay === yesterday ? (store.streak || 1) + 1 : 1 };
}

/** Où en est le rituel aujourd'hui. */
export function ritualToday(store: RitualStore, emotions: EmotionEntry[], palms: PalmReading[], now = new Date()): RitualToday {
  const today = dayKey(now);
  const carte = store.carte === today;
  const emotion = emotions.some((e) => e.day === today);
  const main = palms.some((p) => {
    const d = new Date(p.at);
    return !Number.isNaN(d.getTime()) && dayKey(d) === today;
  });
  const count = (carte ? 1 : 0) + (emotion ? 1 : 0) + (main ? 1 : 0);
  // Série : jours consécutifs avec au moins un geste ; elle s'éteint après un jour sans geste.
  let streak = store.streak || 0;
  const yesterday = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  if (count > 0 && store.lastDay !== today) streak = store.lastDay === yesterday ? streak + 1 : 1;
  if (count === 0 && store.lastDay !== today && store.lastDay !== yesterday) streak = 0;
  return { carte, emotion, main, count, streak };
}

export async function readRitual(): Promise<RitualStore> {
  const s = await local.getJson<RitualStore>(keyFor(), {});
  return s && typeof s === 'object' ? s : {};
}

/** À appeler quand un geste vient d'être accompli (carte, émotion, main). */
export async function recordGesture(kind: 'carte' | 'emotion' | 'main', now = new Date()): Promise<RitualStore> {
  const cur = await readRitual();
  const next = withGesture(kind === 'carte' ? { ...cur, carte: dayKey(now) } : cur, now);
  await local.setJson(keyFor(), next);
  return next;
}

export async function clearRitual(owner?: string): Promise<void> {
  await local.remove([owner ? `${KEYS.rituel}:${owner}` : keyFor()]);
}
