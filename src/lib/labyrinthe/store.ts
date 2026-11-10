// Ce que le Labyrinthe vivant garde sur l'appareil (par personne) : naissance, bilans, gestes.
import { currentOwner } from '../palm';
import { KEYS, local } from '../storage';
import type { Birth } from './acquis';
import { isoWeek } from './vecu';

export type Bilan = { week: string; at: string; answers: number[]; levels?: Record<string, number> };
const k = (base: string, owner = currentOwner()) => `${base}:${owner}`;

export const readBirth = async () => (await local.getJson<Birth | null>(k(KEYS.naissance), null)) ?? undefined;
export const saveBirth = (b: Birth) => local.setJson(k(KEYS.naissance), b);

export async function listBilans(): Promise<Bilan[]> {
  const l = await local.getJson<Bilan[]>(k(KEYS.bilans), []);
  return Array.isArray(l) ? l.sort((a, b) => b.week.localeCompare(a.week)) : [];
}
export async function saveBilan(answers: number[], levels?: Record<string, number>, now = new Date()): Promise<Bilan[]> {
  const week = isoWeek(now);
  const next = [{ week, at: now.toISOString(), answers, levels }, ...(await listBilans()).filter((b) => b.week !== week)].slice(0, 52);
  await local.setJson(k(KEYS.bilans), next);
  return next;
}

/** Les gestes accomplis (« J'ai fait mon geste » après un tirage). */
export async function listGestes(): Promise<string[]> {
  const l = await local.getJson<string[]>(k(KEYS.gestes), []);
  return Array.isArray(l) ? l : [];
}
export async function recordGeste(now = new Date()): Promise<string[]> {
  const next = [now.toISOString(), ...(await listGestes())].slice(0, 400);
  await local.setJson(k(KEYS.gestes), next);
  return next;
}

export async function clearLabyrinthe(owner?: string): Promise<void> {
  await local.remove([k(KEYS.naissance, owner), k(KEYS.bilans, owner), k(KEYS.gestes, owner)]);
}
