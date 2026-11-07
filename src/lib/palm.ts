// Lectures de la main (parcours de Terra) : le site les calcule dans la page sans les exposer par l'API.
// L'app les recueille quand Terra affiche sa parole et les garde sur l'appareil.
import { KEYS, local } from './storage';

export type PalmReading = {
  id: string;
  at: string;
  word: string;
  title?: string;
  mudra?: string;
  mudraCopy?: string;
  breath?: string;
  mantra?: string;
  question?: string;
  summary?: string;
};

const clean = (v: unknown, max = 2000) => (typeof v === 'string' ? v.replace(/\s+\n/g, '\n').trim().slice(0, max) : '');

/** Lit un message de la page de Terra ; renvoie undefined si ce n'est pas une lecture de la main. */
export function parsePalmMessage(raw: string, now = new Date()): PalmReading | undefined {
  let d: Record<string, unknown>;
  try {
    d = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!d || d.type !== 'c127-palm-reading') return undefined;
  const word = clean(d.word);
  if (!word) return undefined;
  const r: PalmReading = {
    id: `palm-${now.getTime()}`,
    at: now.toISOString(),
    word,
    title: clean(d.title, 200) || undefined,
    mudra: clean(d.mudra, 120) || undefined,
    mudraCopy: clean(d.mudraCopy) || undefined,
    breath: clean(d.breath) || undefined,
    mantra: clean(d.mantra, 500) || undefined,
    question: clean(d.question, 500) || undefined,
    summary: clean(d.summary, 3000) || undefined,
  };
  return r;
}

const sameReading = (a: PalmReading, b: PalmReading) => a.word === b.word && a.mantra === b.mantra && a.mudra === b.mudra;

/** Ajoute une lecture en tête, sans doublon, 50 au plus. */
export function addPalmReading(list: PalmReading[], r: PalmReading): PalmReading[] {
  if (list.some((x) => sameReading(x, r))) return list;
  return [r, ...list].slice(0, 50);
}

export async function listPalmReadings(): Promise<PalmReading[]> {
  return local.getJson<PalmReading[]>(KEYS.palmReadings, []);
}

export async function savePalmMessage(raw: string): Promise<boolean> {
  const r = parsePalmMessage(raw);
  if (!r) return false;
  const list = await listPalmReadings();
  const next = addPalmReading(list, r);
  if (next !== list) await local.setJson(KEYS.palmReadings, next);
  return true;
}

export async function removePalmReading(id: string): Promise<PalmReading[]> {
  const next = (await listPalmReadings()).filter((x) => x.id !== id);
  await local.setJson(KEYS.palmReadings, next);
  return next;
}

export { PALM_BRIDGE_JS } from './palm-bridge';
