// Les tirages gardés dans le Grimoire (sur l'appareil, par personne, effaçables).
import { currentOwner } from '../palm';
import { KEYS, local } from '../storage';
import type { Mode } from './engine';

export type SavedDraw = { at: string; mode: Mode; cards: number[]; seal?: string; source: string; intent?: string };
const keyFor = (owner = currentOwner()) => `${KEYS.oracleDraws}:${owner}`;

export async function listDraws(): Promise<SavedDraw[]> {
  const l = await local.getJson<SavedDraw[]>(keyFor(), []);
  return Array.isArray(l) ? l : [];
}

export async function saveDraw(d: SavedDraw): Promise<SavedDraw[]> {
  const next = [d, ...(await listDraws()).filter((x) => !(x.at === d.at))].slice(0, 200);
  await local.setJson(keyFor(), next);
  return next;
}

export async function clearDraws(owner?: string): Promise<void> {
  await local.remove([keyFor(owner)]);
}
