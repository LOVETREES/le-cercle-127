import { Ecliptic, GeoVector, Observer, SearchHourAngle, type Body } from 'astronomy-engine';
import { describe, expect, it } from 'vitest';

import { acquis, acquisLevels, angles, birthAngles, birthInstant, zonedToUtc } from '../lib/labyrinthe/acquis';
import { searchVilles } from '../lib/labyrinthe/villes';
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


describe('Labyrinthe vivant · lieu de naissance', () => {
  it('convertit l’heure locale du lieu en temps universel (heure d’été comprise)', () => {
    expect(zonedToUtc(2026, 7, 14, 12, 0, 'Europe/Paris').toISOString()).toBe('2026-07-14T10:00:00.000Z');
    expect(zonedToUtc(2026, 1, 14, 12, 0, 'Europe/Paris').toISOString()).toBe('2026-01-14T11:00:00.000Z');
    expect(zonedToUtc(1990, 3, 3, 8, 30, 'America/Toronto').toISOString()).toBe('1990-03-03T13:30:00.000Z');
    expect(birthInstant({ date: '1990-03-03', time: '08:30', place: 'Montréal' })?.toISOString()).toBe('1990-03-03T13:30:00.000Z');
  });

  it('place le milieu du ciel sur le Soleil à midi solaire, et l’ascendant à environ 90° du MC à l’équateur', () => {
    const paris = { lat: 48.857, lon: 2.352 };
    const t = SearchHourAngle('Sun' as Body, new Observer(paris.lat, paris.lon, 0), 0, new Date('2000-01-01T00:00:00Z')).time.date;
    const sun = Ecliptic(GeoVector('Sun' as Body, t, true)).elon;
    const { mc } = angles(t, paris.lat, paris.lon);
    expect(Math.abs(((mc - sun + 540) % 360) - 180)).toBeLessThan(1.5);
    const eq = angles(t, 0, paris.lon);
    const d = (eq.asc - eq.mc + 360) % 360;
    expect(d).toBeGreaterThan(60);
    expect(d).toBeLessThan(120);
  });

  it('ne calcule les angles qu’avec l’heure et un lieu connu ; trouve les villes', () => {
    expect(birthAngles({ date: '1980-06-15', time: '12:30' })).toBeUndefined();
    expect(birthAngles({ date: '1980-06-15', place: 'Lodève' })).toBeUndefined();
    expect(birthAngles({ date: '1980-06-15', time: '12:30', place: 'Lodève' })?.ascSign).toBeTruthy();
    expect(searchVilles('lod')[0].name).toBe('Lodève');
    expect(searchVilles('saint-d')[0].name).toBe('Saint-Denis (La Réunion)');
  });
});
