// Les portes du Grimoire : une par Sœur (I à VII). Une porte s'ouvre quand on pratique avec la Sœur ;
// elle est « en cours » si c'était ce mois-ci. Les pratiques viennent des données de l'app (rêves → Oni,
// émotions → Naïa, lectures de la main → Terra) et des pages des Sœurs (message « c127-sister »).
import { currentOwner } from './palm';
import { KEYS, local } from './storage';

export type SisterKey = 'oni' | 'alka' | 'naia' | 'terra' | 'ignis' | 'astria' | 'irma';
export type DoorState = 'ouverte' | 'encours' | 'fermee';
export type Door = { key: SisterKey; name: string; num: string; state: DoorState; last?: Date };
export type PortesStore = Partial<Record<SisterKey, number>>;

export const SISTER_DOORS: { key: SisterKey; name: string; num: string }[] = [
  { key: 'oni', name: 'Oni', num: 'I' },
  { key: 'alka', name: 'Alka', num: 'II' },
  { key: 'naia', name: 'Naïa', num: 'III' },
  { key: 'terra', name: 'Terra', num: 'IV' },
  { key: 'ignis', name: 'Ignis', num: 'V' },
  { key: 'astria', name: 'Astria', num: 'VI' },
  { key: 'irma', name: 'Irma', num: 'VII' },
];
const KEYS_SET = new Set<string>(SISTER_DOORS.map((s) => s.key));

/** La Sœur signalée par une page du site (« c127-sister »), ou undefined. */
export function sisterFromMessage(raw: string): SisterKey | undefined {
  try {
    const d = JSON.parse(raw);
    if (!d || d.type !== 'c127-sister') return undefined;
    const k = String(d.sister ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
    return KEYS_SET.has(k) ? (k as SisterKey) : undefined;
  } catch {
    return undefined;
  }
}

const keyFor = () => `${KEYS.portes}:${currentOwner()}`;

export async function readPortes(): Promise<PortesStore> {
  const s = await local.getJson<PortesStore>(keyFor(), {});
  return s && typeof s === 'object' ? s : {};
}

export async function recordSister(sister: SisterKey, now = new Date()): Promise<PortesStore> {
  const next = { ...(await readPortes()), [sister]: now.getTime() };
  await local.setJson(keyFor(), next);
  return next;
}

export async function clearPortes(owner?: string): Promise<void> {
  await local.remove([owner ? `${KEYS.portes}:${owner}` : keyFor()]);
}

const toDate = (v?: string | number | Date): Date | undefined => {
  if (v == null || v === '') return undefined;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v;
  if (typeof v === 'string') {
    const m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

/** Les dates de pratique connues pour chaque Sœur. */
export type Practices = Partial<Record<SisterKey, (string | number | Date | undefined)[]>>;

export function doorStates(practices: Practices, store: PortesStore, now = new Date()): Door[] {
  return SISTER_DOORS.map((s) => {
    let last: Date | undefined;
    for (const v of [...(practices[s.key] ?? []), store[s.key]]) {
      const d = toDate(v);
      if (d && (!last || d > last)) last = d;
    }
    const state: DoorState = !last ? 'fermee' : last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth() ? 'encours' : 'ouverte';
    return { ...s, state, last };
  });
}
