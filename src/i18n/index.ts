// Outil de traduction de l'application.
// Les textes sont écrits en français dans le code : t('Texte') renvoie la traduction de la langue choisie,
// ou le français si une traduction manque. Les variables s'écrivent {nom} : t('{n} rêves', { n: 3 }).
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { it } from './it';

export type Lang = 'fr' | 'en' | 'es' | 'it' | 'de';

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

const DICTS: Record<Exclude<Lang, 'fr'>, Record<string, string>> = { en, es, it, de };
const LOCALES: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', it: 'it-IT', de: 'de-DE' };

let current: Lang = 'fr';

export function setCurrentLang(lang: Lang): void {
  current = lang;
}

export function getLang(): Lang {
  return current;
}

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && LANGUAGES.some((l) => l.code === v);
}

/** Locale pour les dates et les nombres (toLocaleDateString…). */
export function locale(): string {
  return LOCALES[current];
}

export function t(fr: string, vars?: Record<string, string | number>): string {
  let s = current === 'fr' ? fr : (DICTS[current][fr] ?? fr);
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] !== undefined ? String(vars[k]) : m));
  return s;
}

/** Pour les tests : toutes les clés d'un dictionnaire. */
export function dictionary(lang: Exclude<Lang, 'fr'>): Record<string, string> {
  return DICTS[lang];
}

/** Guillemets selon la langue : « … » en français, “…” en anglais, „…“ en allemand. */
export function quote(s: string): string {
  if (current === 'en') return `“${s}”`;
  if (current === 'de') return `„${s}“`;
  return `« ${s} »`;
}
