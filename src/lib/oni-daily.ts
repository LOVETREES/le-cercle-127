// Lecture du jour d'Oni : une lecture immédiate par jour (heure de Paris). Le serveur fait foi ;
// ce repère local sert seulement à proposer le bon bouton sans attendre le réseau.
import { currentOwner } from './palm';
import { KEYS, local } from './storage';
import { parisDayKey } from './oracle/engine';

const keyFor = (owner = currentOwner()) => `${KEYS.oniDaily}:${owner}`;

export async function dailyReadingUsed(now = new Date()): Promise<boolean> {
  return (await local.getJson<string>(keyFor(), '')) === parisDayKey(now);
}

export async function markDailyReadingUsed(now = new Date()): Promise<void> {
  await local.setJson(keyFor(), parisDayKey(now));
}

export async function clearDailyReading(owner?: string): Promise<void> {
  await local.remove([keyFor(owner)]);
}
