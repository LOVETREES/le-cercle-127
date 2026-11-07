import { describe, expect, it } from 'vitest';

import { dictionary, setCurrentLang, t } from '../i18n';

const LANGS = ['en', 'es', 'it', 'de'] as const;
const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');

describe('traductions', () => {
  it('ont les mêmes textes dans les quatre langues', () => {
    const base = Object.keys(dictionary('en')).sort();
    for (const l of LANGS) expect(Object.keys(dictionary(l)).sort()).toEqual(base);
    expect(base.length).toBeGreaterThan(400);
  });

  it('n’inventent pas de variables {…} et gardent celles qui portent du sens', () => {
    for (const l of LANGS)
      for (const [fr, tr] of Object.entries(dictionary(l))) {
        const inFr = vars(fr).split(',');
        for (const v of vars(tr).split(',').filter(Boolean)) expect([l, fr, inFr.includes(v)]).toEqual([l, fr, true]);
        // Seul un suffixe de pluriel ({v2} de « rêve{v2} ») peut disparaître.
        for (const v of inFr.filter(Boolean)) if (!vars(tr).includes(v)) expect(fr).toContain(`rêve${v}`);
      }
  });

  it('traduisent, remplacent les variables et retombent sur le français', () => {
    setCurrentLang('en');
    expect(t('Bonjour')).toBe('Good morning');
    expect(t('{n} jours d’affilée : votre mémoire des rêves se muscle.', { n: 3 })).toBe('3 days in a row: your dream memory is getting stronger.');
    expect(t('Texte absent du dictionnaire')).toBe('Texte absent du dictionnaire');
    setCurrentLang('de');
    expect(t('Paramètres')).toBe('Einstellungen');
    setCurrentLang('fr');
    expect(t('Bonjour')).toBe('Bonjour');
  });
});
