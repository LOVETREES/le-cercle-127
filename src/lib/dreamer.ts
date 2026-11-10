// « Faisons connaissance » : ce qu'Oni sait du rêveur ou de la rêveuse. Tout est facultatif,
// gardé sur l'appareil (par personne), modifiable et effaçable à tout moment.
// Oni ne le lit que si la personne l'a accepté, et seulement avec un rêve qu'elle lui confie.
import { currentOwner } from './palm';
import { KEYS, local } from './storage';

export type AgeRange = 'moins25' | '25-39' | '40-59' | '60plus';
export type DreamerUse = 'lectures' | 'aucun';
export type DreamerProfile = {
  name?: string; // prénom ou pseudonyme choisi
  age?: AgeRange;
  areas: string[]; // domaines qui occupent la vie en ce moment
  now?: string; // quelque chose d'important dans la vie actuelle
  sleep?: string; // rapport aux rêves et au sommeil
  use: DreamerUse; // ce qu'Oni peut en faire
  updatedAt?: string;
};

export const AGE_RANGES: { value: AgeRange; label: string }[] = [
  { value: 'moins25', label: 'Moins de 25 ans' },
  { value: '25-39', label: '25 à 39 ans' },
  { value: '40-59', label: '40 à 59 ans' },
  { value: '60plus', label: '60 ans et plus' },
];
export const DREAM_HABITS = ['Je me souviens souvent de mes rêves', 'Rarement', 'Mes rêves reviennent', 'Je fais des cauchemars', 'Je dors mal en ce moment'];

export const EMPTY_PROFILE: DreamerProfile = { areas: [], use: 'lectures' };
const keyFor = (owner = currentOwner()) => `${KEYS.dreamer}:${owner}`;

export function isEmptyProfile(p: DreamerProfile): boolean {
  return !p.name?.trim() && !p.age && !p.areas.length && !p.now?.trim() && !p.sleep?.trim();
}

export async function readDreamer(): Promise<DreamerProfile> {
  const p = await local.getJson<DreamerProfile | null>(keyFor(), null);
  return p && typeof p === 'object' ? { ...EMPTY_PROFILE, ...p, areas: Array.isArray(p.areas) ? p.areas : [] } : { ...EMPTY_PROFILE };
}

export async function saveDreamer(p: DreamerProfile, now = new Date()): Promise<DreamerProfile> {
  const clean: DreamerProfile = {
    name: p.name?.trim().slice(0, 60) || undefined,
    age: p.age,
    areas: p.areas.slice(0, 8),
    now: p.now?.trim().slice(0, 800) || undefined,
    sleep: p.sleep?.trim().slice(0, 300) || undefined,
    use: p.use === 'aucun' ? 'aucun' : 'lectures',
    updatedAt: now.toISOString(),
  };
  await local.setJson(keyFor(), clean);
  return clean;
}

export async function clearDreamer(owner?: string): Promise<void> {
  await local.remove([keyFor(owner)]);
}

const fill = (s: string, v?: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (v?.[k] !== undefined ? String(v[k]) : m));

/** Les lignes « Le rêveur » jointes aux précisions d'un rêve (vide si rien ou si la personne refuse). */
export function dreamerLines(p: DreamerProfile | undefined, tr: (s: string, v?: Record<string, string | number>) => string = fill): string[] {
  if (!p || p.use !== 'lectures' || isEmptyProfile(p)) return [];
  const parts: string[] = [];
  if (p.name) parts.push(tr('appelle-moi {n}', { n: p.name }));
  const age = AGE_RANGES.find((a) => a.value === p.age);
  if (age) parts.push(tr(age.label));
  if (p.areas.length) parts.push(`${tr('ce qui occupe ma vie')} : ${p.areas.map((a) => tr(a)).join(', ')}`);
  const lines = parts.length ? [`• ${tr('Qui je suis')} : ${parts.join(' · ')}`] : [];
  if (p.now) lines.push(`• ${tr('Ce qui est important pour moi en ce moment')} : ${p.now}`);
  if (p.sleep) lines.push(`• ${tr('Mes rêves et mon sommeil')} : ${p.sleep}`);
  return lines;
}
