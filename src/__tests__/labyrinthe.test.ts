import { describe, expect, it } from 'vitest';

import { acquis, acquisLevels, birthInstant } from '../lib/labyrinthe/acquis';
import { doorOf, isoWeek, maskOf, readMeeting, vecuLevels, type Levels } from '../lib/labyrinthe/vecu';

const zero: Levels = { Oni: 0, Alka: 0, Naïa: 0, Terra: 0, Ignis: 0, Astria: 0, Irma: 0 };

describe('Labyrinthe vivant · acquis', () => {
  it('place les astres et pèse chaque Sœur selon les dignités', () => {
    const p = acquis({ date: '1980-06-15', time: '12:30' })!;
    const by = Object.fromEntries(p.map((x) => [x.sister, x]));
    expect(by.Astria.sign).toBe('Gémeaux'); // Soleil
    expect(by.Ignis.sign).toBe('Vierge'); // Mars
    expect(by.Oni.sign).toBe('Cancer'); // Lune en domicile
    expect(by.Oni.reasons).toContain('en domicile');
    expect(by.Oni.weight).toBeGreaterThan(by.Ignis.weight);
    const lv = acquisLevels(p);
    expect(Math.max(...Object.values(lv))).toBe(1);
  });

  it('refuse une date invalide ou future', () => {
    expect(acquis({ date: '15/06/1980' })).toBeUndefined();
    expect(birthInstant({ date: '2999-01-01' })).toBeUndefined();
  });
});

describe('Labyrinthe vivant · vécu', () => {
  it('monte avec la pratique, et le bilan de la semaine compte pour moitié', () => {
    const none = vecuLevels({ Oni: 0, Alka: 0, Naïa: 0, Terra: 0, Ignis: 0, Astria: 0, Irma: 0 });
    expect(none.Oni).toBe(0);
    const some = vecuLevels({ Oni: 6, Alka: 0, Naïa: 0, Terra: 0, Ignis: 0, Astria: 0, Irma: 0 });
    expect(some.Oni).toBeCloseTo(0.632, 2);
    const withBilan = vecuLevels({ Oni: 6, Alka: 0, Naïa: 0, Terra: 0, Ignis: 0, Astria: 0, Irma: 0 }, [4, 0, 0, 0, 0, 0, 0]);
    expect(withBilan.Oni).toBeCloseTo(0.816, 2);
  });

  it('forme une porte (jamais vide) et lit la rencontre', () => {
    expect(maskOf({ ...zero, Oni: 0.8, Naïa: 0.7 })).toBe(1 + 4);
    expect(maskOf({ ...zero, Terra: 0.2 })).toBe(8);
    expect(doorOf({ ...zero, Oni: 0.9 }).mask).toBe(1);
    const r = readMeeting({ ...zero, Ignis: 1, Oni: 0.4 }, { ...zero, Naïa: 0.8, Ignis: 0.1 });
    expect(r.strongSky).toBe('Ignis');
    expect(r.strongLife).toBe('Naïa');
    expect(r.next).toBe('Ignis');
    expect(r.beyond).toBe('Naïa');
    expect(r.text[0].k).toContain('mais ce mois-ci');
    expect(r.text[0].v).toEqual({ a: 'Ignis', b: 'Naïa' });
  });

  it('range les bilans par semaine ISO', () => {
    expect(isoWeek(new Date(2026, 10, 10))).toBe('2026-W46');
    expect(isoWeek(new Date(2027, 0, 1))).toBe('2026-W53');
  });
});
