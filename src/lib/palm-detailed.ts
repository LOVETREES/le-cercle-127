// Lecture détaillée de la main (Terra) : types, lecture prudente des réponses du site et évolution des lignes.
import { api } from './api';

export type LineKey = 'heart' | 'head' | 'life' | 'fate' | 'sun';
export type LineObs = { present?: boolean; length?: string; depth?: string; shape?: string; marks?: string[]; visibility?: number };
export type DetailedReading = {
  id: string;
  at: string;
  hand: string;
  observations: { palm_shape?: string; element?: string; fingers?: string; thumb?: string; lines?: Partial<Record<LineKey, LineObs>>; mounts?: Record<string, string> };
  reading: {
    title?: string; overview?: string; heart?: string; head?: string; life?: string; fate?: string; mounts?: string; month?: string;
    strengths?: string[]; watch?: string[]; mudra?: { name?: string; how?: string }; mantra?: string; question?: string;
  };
  evolution: string;
  changes: { line: LineKey; field: string; from: unknown; to: unknown }[];
};
export type Quota = { plus: boolean; free_left: number; next_at: string | null };

export const LINE_KEYS: LineKey[] = ['heart', 'head', 'life', 'fate', 'sun'];
export const LINE_LABEL: Record<LineKey, string> = { heart: 'Cœur', head: 'Tête', life: 'Vie', fate: 'Destin', sun: 'Soleil' };
export const LINE_COLOR: Record<LineKey, string> = { heart: '#e8a3ae', head: '#d6b66c', life: '#69bd7d', fate: '#8fc8e8', sun: '#f2dea8' };
export const SECTIONS: [keyof DetailedReading['reading'], string, string][] = [
  ['overview', 'Vue d’ensemble', '#d8b66b'],
  ['heart', 'Cœur · tes liens', '#e8a3ae'],
  ['head', 'Tête · tes choix', '#d6b66c'],
  ['life', 'Vie · ton énergie', '#69bd7d'],
  ['fate', 'Destin · ta direction', '#8fc8e8'],
  ['mounts', 'Monts et doigts · tes forces', '#d9cdfb'],
  ['month', 'Ce que ta main t’invite à vivre ce mois-ci', '#f2dea8'],
];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Ne garde que les lectures bien formées (le site les a déjà nettoyées, on reste prudent). */
export function parseDetailed(raw: unknown): DetailedReading | undefined {
  if (!isObj(raw) || typeof raw.id !== 'string' || !isObj(raw.reading)) return undefined;
  return {
    id: raw.id,
    at: typeof raw.at === 'string' ? raw.at : new Date().toISOString(),
    hand: typeof raw.hand === 'string' ? raw.hand : 'inconnue',
    observations: isObj(raw.observations) ? (raw.observations as DetailedReading['observations']) : {},
    reading: raw.reading as DetailedReading['reading'],
    evolution: typeof raw.evolution === 'string' ? raw.evolution : '',
    changes: Array.isArray(raw.changes) ? (raw.changes as DetailedReading['changes']) : [],
  };
}

export function parseList(raw: unknown): { items: DetailedReading[]; quota: Quota } {
  const body = isObj(raw) ? raw : {};
  const items = (Array.isArray(body.items) ? body.items : []).map(parseDetailed).filter((x): x is DetailedReading => !!x);
  const q = isObj(body.quota) ? body.quota : {};
  return { items, quota: { plus: q.plus === true, free_left: Number(q.free_left) || 0, next_at: typeof q.next_at === 'string' ? q.next_at : null } };
}

/** Texte court d'une ligne pour la frise (« longue · profonde », « absente »). */
export function lineSummary(l?: LineObs): string {
  if (!l) return '—';
  if (l.present === false) return 'absente';
  return [l.length, l.depth].filter(Boolean).join(' · ') || '—';
}

/** Pour chaque ligne, les valeurs dans le temps (de la plus ancienne à la plus récente) et les changements. */
export function lineTimeline(items: DetailedReading[], max = 6) {
  const recent = items.slice(0, max).reverse();
  return LINE_KEYS.map((key) => ({
    key,
    cells: recent.map((it, i) => {
      const now = lineSummary(it.observations.lines?.[key]);
      const before = i ? lineSummary(recent[i - 1].observations.lines?.[key]) : now;
      return { at: it.at, text: now, changed: i > 0 && now !== '—' && before !== '—' && now !== before, faint: (it.observations.lines?.[key]?.visibility ?? 1) < 0.5 };
    }),
  }));
}

export async function listDetailed(token: string) {
  return parseList(await api.palmDetailedList(token));
}

export async function createDetailed(token: string, image: string, hand: string, lang: string) {
  const res = (await api.palmDetailedCreate(token, { image, hand, lang, consent: true })) as Record<string, unknown> | undefined;
  const item = parseDetailed(res?.item);
  if (!item) throw new Error('Terra n’a pas pu lire ta main pour le moment. Réessaie dans quelques minutes.');
  return { item, quota: parseList({ quota: res?.quota }).quota };
}
