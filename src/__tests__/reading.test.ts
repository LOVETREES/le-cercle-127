import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

import { readingSections, readingSummary } from '../lib/model';

const raw = readFileSync(join(__dirname, 'oni-reading.fixture.txt'), 'utf8');

describe('lecture d’Oni', () => {
  it('retrouve les sections collées par le site', () => {
    const s = readingSections(raw, 'La forêt qui chante');
    expect(s.map((x) => x.heading)).toEqual([
      'Le rêve',
      'Le climat',
      'Les symboles centraux',
      'Ce qui se joue',
      'La lecture d’Oni',
      'Ce que le rêve laisse ouvert',
    ]);
    const climat = s[1].lines;
    expect(climat[0]).toBe('Émotions : émerveillement');
    expect(climat.some((l) => l.startsWith('Mouvement :'))).toBe(true);
    expect(s[5].lines.length).toBeGreaterThanOrEqual(3);
    expect(raw.includes('&#039;') && s.some((x) => x.lines.some((l) => l.includes('&#039;')))).toBe(false);
  });

  it('donne un aperçu centré sur la lecture', () => {
    expect(readingSummary(raw, 'La forêt qui chante').startsWith('Le rêve présente une scène unifiée')).toBe(true);
  });

  it('garde un texte libre tel quel', () => {
    expect(readingSections('Une piste. Une autre.')).toEqual([{ lines: ['Une piste. Une autre.'] }]);
  });
});
