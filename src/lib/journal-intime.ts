// Le journal intime : des pages libres (pas des rêves), gardées sur l'appareil et jamais envoyées.
// Rangé par personne ; NON effacé à la déconnexion (on ne perd pas son journal), seulement à la
// suppression du compte, au départ de la démonstration, ou à la demande.
import { currentOwner } from './palm';
import { KEYS, local } from './storage';

export type JournalEntry = { id: string; at: string; updatedAt?: string; text: string; feeling?: string; prompt?: string };

const keyFor = (owner = currentOwner()) => `${KEYS.journalIntime}:${owner}`;

export async function listEntries(): Promise<JournalEntry[]> {
  const l = await local.getJson<JournalEntry[]>(keyFor(), []);
  return Array.isArray(l) ? [...l].sort((a, b) => b.at.localeCompare(a.at)) : [];
}

async function write(l: JournalEntry[]) {
  await local.setJson(keyFor(), l);
  return l;
}

export async function saveEntry(e: Omit<JournalEntry, 'id' | 'at'> & { id?: string; at?: string }, now = new Date()): Promise<JournalEntry[]> {
  const text = e.text.trim().slice(0, 20000);
  if (!text) return listEntries();
  const l = await listEntries();
  if (e.id && l.some((x) => x.id === e.id)) {
    return write(l.map((x) => (x.id === e.id ? { ...x, text, feeling: e.feeling, prompt: e.prompt, updatedAt: now.toISOString() } : x)));
  }
  const entry: JournalEntry = { id: `j-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`, at: e.at ?? now.toISOString(), text, feeling: e.feeling, prompt: e.prompt };
  return write([entry, ...l]);
}

export async function deleteEntry(id: string): Promise<JournalEntry[]> {
  return write((await listEntries()).filter((x) => x.id !== id));
}

export async function clearJournal(owner?: string): Promise<void> {
  await local.remove([keyFor(owner)]);
}

/** Une invitation à écrire, différente chaque jour (facultative). */
export const PROMPTS = [
  'Qu’est-ce qui t’a touché·e aujourd’hui ?',
  'De quoi as-tu besoin, là, maintenant ?',
  'Qu’as-tu appris sur toi cette semaine ?',
  'Qu’est-ce que tu n’as dit à personne ?',
  'Pour quoi te sens-tu reconnaissant·e aujourd’hui ?',
  'Qu’est-ce qui t’a pesé, et qu’est-ce qui t’a allégé·e ?',
  'Si tu te parlais comme à un ami, que te dirais-tu ?',
  'Quelle petite victoire veux-tu garder en mémoire ?',
  'Qu’est-ce qui demande à changer dans ta vie ?',
  'Où as-tu senti de la joie, même brève ?',
];
export function promptOfDay(now = new Date()): string {
  const d = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  return PROMPTS[d % PROMPTS.length];
}

export const FEELINGS = ['Apaisé·e', 'Joyeux·se', 'Reconnaissant·e', 'Fatigué·e', 'Inquiet·ète', 'Triste', 'En colère', 'Confus·e', 'Plein·e d’élan'];
