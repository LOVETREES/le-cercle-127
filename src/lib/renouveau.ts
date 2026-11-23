import type { JournalEntry } from './journal-intime';

// Des repères de rangement, jamais affichés comme des conclusions sur la personne.
export const RENEWAL_PROMPTS = [
  'Nouveau chapitre · Ce qui pèse',
  'Nouveau chapitre · Une lettre pour soi',
  'Nouveau chapitre · Un choix et un cap',
  'Nouveau chapitre · Un premier pas',
] as const;

/** Simple repérage lexical local sur deux pages distinctes, pas une analyse de l'état de la personne. */
export function renewalSuggested(entries: Pick<JournalEntry, 'text' | 'prompt'>[]): boolean {
  const words = /(^|[^a-z])(impasse|epuise|epuisee|epuisement|bloque|bloquee|blocage|fatigue|fatiguee)([^a-z]|$)/;
  return entries.filter((e) => !RENEWAL_PROMPTS.some((p) => p === e.prompt) && words.test(e.text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())).length >= 2;
}

export function renewalEntry(entries: JournalEntry[], step: number): JournalEntry | undefined {
  return entries.find((e) => e.prompt === RENEWAL_PROMPTS[step]);
}

/** Quelques formulations explicites seulement : ne remplace pas une évaluation humaine. */
export function explicitCrisis(text: string): boolean {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return /\b(me suicider|me tuer|mettre fin a mes jours|en finir avec la vie|je veux mourir|envie de mourir|idees suicidaires)\b/.test(normalized);
}
