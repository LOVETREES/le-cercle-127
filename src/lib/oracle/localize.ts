// Le nom et la définition d'une lame dans la langue de l'application (le français reste la référence).
import { getLang } from '../../i18n';
import DE from './i18n/de.json';
import EN from './i18n/en.json';
import ES from './i18n/es.json';
import IT from './i18n/it.json';
import type { Lame } from './engine';

const DICTS: Record<string, string[][]> = { en: EN, es: ES, it: IT, de: DE };

export function lameText(card: Lame, lang: string = getLang()): { name: string; definition: string } {
  const row = DICTS[lang]?.[card.n - 1];
  return row ? { name: row[0], definition: row[1] } : { name: card.name, definition: card.definition };
}
