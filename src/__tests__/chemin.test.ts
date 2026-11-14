import { describe, expect, it } from 'vitest';

import { computeChemin, levelFor, STATIONS, trendOf, weekly } from '../lib/chemin';

const now = new Date('2026-11-14T12:00:00Z');
const empty = { dreams: [], motifs: 0, motifDreams: [], emotions: [], palms: [], gestes: [], bilans: [], draws: [] };

describe('Mon chemin (individuation et Sept Sœurs)', () => {
  it('sept Sœurs, dans l’ordre du chemin, chacune avec ses outils et un prochain pas', () => {
    expect(STATIONS.map((s) => s.slug)).toEqual(['oni', 'alka', 'naia', 'terra', 'ignis', 'astria', 'irma']);
    for (const s of STATIONS) { expect(s.tools.length).toBeGreaterThan(0); expect(s.next.length).toBeGreaterThan(10); }
  });
  it('niveaux graine, pousse, arbre selon les seuils', () => {
    expect(levelFor(0, [1, 5, 15])).toBe(0);
    expect(levelFor(1, [1, 5, 15])).toBe(1);
    expect(levelFor(5, [1, 5, 15])).toBe(2);
    expect(levelFor(20, [1, 5, 15])).toBe(3);
  });
  it('compte l’activité par semaine, de la plus ancienne à cette semaine', () => {
    const w = weekly(['2026-11-13', '2026-11-12T08:00:00Z', '2026-11-03', '2026-09-01'], now);
    expect(w).toEqual([0, 0, 0, 0, 1, 2]);
  });
  it('tendance sans jugement : en hausse, stable, plus calme, ou rien', () => {
    expect(trendOf([0, 0, 0, 1, 1, 1])).toBe('up');
    expect(trendOf([1, 0, 0, 0, 1, 0])).toBe('steady');
    expect(trendOf([2, 1, 1, 0, 0, 1])).toBe('calm');
    expect(trendOf([0, 0, 0, 0, 0, 0])).toBe('none');
  });
  it('au début, tout est à éveiller et le prochain pas est Oni (raconter un rêve)', () => {
    const c = computeChemin(empty, now);
    expect(c.awakened).toBe(0);
    expect(c.selfShare).toBe(0);
    expect(c.stations[c.nextIndex].slug).toBe('oni');
  });
  it('le Soi s’éclaire avec les Sœurs ; le prochain pas va vers la moins éveillée', () => {
    const c = computeChemin({ ...empty, dreams: Array(6).fill('2026-11-10'), motifs: 1, emotions: ['2026-11-13'], palms: ['2026-11-13T09:00:00Z'] }, now);
    expect(c.stations.map((s) => s.level)).toEqual([2, 1, 1, 1, 0, 0, 0]);
    expect(c.awakened).toBe(4);
    expect(c.selfShare).toBe(Math.round(5 / 21 * 100));
    expect(c.stations[c.nextIndex].slug).toBe('ignis');
  });
});
