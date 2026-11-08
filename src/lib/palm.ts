// Lectures de la main (parcours de Terra) : le site les calcule dans la page sans les exposer par l'API.
// L'app les recueille quand Terra affiche sa parole et les garde sur l'appareil.
import { api } from './api';
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
  return (await storePalmMessage(raw)) !== 'ignored';
}

/** Comme savePalmMessage, mais dit si la lecture est nouvelle (pour afficher une confirmation). */
export async function storePalmMessage(raw: string): Promise<'ignored' | 'known' | 'new'> {
  const r = parsePalmMessage(raw);
  if (!r) return 'ignored';
  const list = await listPalmReadings();
  const next = addPalmReading(list, r);
  if (next === list) return 'known';
  await local.setJson(KEYS.palmReadings, next);
  return 'new';
}

const SUMMARY_LABELS = /([^\s])(Main observée|Paume|Doigts|Souplesse|Pouce|Ligne (?:Cœur|Coeur|Tête|Vie|Destin)|Mont)(\s*:)/g;

/** Remet une observation par ligne (les anciennes lectures avaient été collées bout à bout). */
export function formatPalmSummary(s: string): string {
  return s.replace(SUMMARY_LABELS, '$1\n$2$3').replace(/\n{2,}/g, '\n').trim();
}

export async function removePalmReading(id: string): Promise<PalmReading[]> {
  const next = (await listPalmReadings()).filter((x) => x.id !== id);
  await local.setJson(KEYS.palmReadings, next);
  return next;
}

/** Réunit les lectures du téléphone et celles du compte (sans doublon, les plus récentes d'abord). */
export function mergePalmReadings(localList: PalmReading[], server: PalmReading[]): PalmReading[] {
  let out: PalmReading[] = [];
  for (const r of [...localList, ...server]) if (!out.some((x) => x.id === r.id || sameReading(x, r))) out.push(r);
  out = out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50);
  return out;
}

function fromServer(raw: Record<string, unknown>): PalmReading | undefined {
  const word = clean(raw.word);
  const id = clean(raw.id, 64);
  if (!word || !id) return undefined;
  const opt = (k: string, max?: number) => clean(raw[k], max) || undefined;
  return { id, at: clean(raw.at, 40) || new Date().toISOString(), word, title: opt('title', 200), mudra: opt('mudra', 120), mudraCopy: opt('mudraCopy'), breath: opt('breath'), mantra: opt('mantra', 500), question: opt('question', 500), summary: opt('summary', 3000) };
}

/** Synchronise avec le compte : envoie les lectures du téléphone absentes du compte, puis réunit les deux. */
export async function syncPalmReadings(token: string): Promise<PalmReading[]> {
  const mine = await listPalmReadings();
  const server = (await api.palmList(token)).map(fromServer).filter((r): r is PalmReading => !!r);
  for (const r of mine) if (!server.some((x) => x.id === r.id || sameReading(x, r))) await api.palmAdd(token, r);
  const merged = mergePalmReadings(mine, server);
  await local.setJson(KEYS.palmReadings, merged);
  return merged;
}

export async function deletePalmEverywhere(id: string, token?: string | null): Promise<PalmReading[]> {
  if (token) await api.palmDelete(token, id).catch(() => undefined);
  return removePalmReading(id);
}

export { PALM_BRIDGE_JS } from './palm-bridge';
