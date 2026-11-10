// Un tirage par jour : le tirage du jour est gardé et rouvert jusqu'à minuit (heure de Paris),
// quel que soit le mode. Gardé sur l'appareil, par personne.
import { currentOwner } from '../palm';
import { KEYS, local } from '../storage';
import { lameByNumber, parisDayKey, POSITIONS, type Draw, type Lame, type Mode } from './engine';

type Stored = { day: string; mode: Mode; seal?: string; source: string; cards: number[]; intent?: string };
const keyFor = (owner = currentOwner()) => `${KEYS.oracleToday}:${owner}`;

/** Le tirage déjà fait aujourd'hui (heure de Paris), ou undefined. */
export async function todaysDraw(now = new Date()): Promise<(Draw & { intent?: string }) | undefined> {
  const s = await local.getJson<Stored | null>(keyFor(), null);
  if (!s || s.day !== parisDayKey(now)) return undefined;
  const cards = s.cards.map((n) => lameByNumber(n)).filter((c): c is Lame => !!c);
  if (!cards.length) return undefined;
  return { mode: s.mode, seal: s.seal, source: s.source, cards, positions: POSITIONS[s.mode], intent: s.intent };
}

export async function recordTodaysDraw(d: Draw, intent = '', now = new Date()): Promise<void> {
  const s: Stored = { day: parisDayKey(now), mode: d.mode, seal: d.seal, source: d.source, cards: d.cards.map((c) => c.n), intent: intent.trim() || undefined };
  await local.setJson(keyFor(), s);
}

export async function clearTodaysDraw(owner?: string): Promise<void> {
  await local.remove([keyFor(owner)]);
}
