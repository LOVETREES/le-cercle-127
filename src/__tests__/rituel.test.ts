import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => new Map<string, unknown>());
vi.mock('../lib/api', () => ({ api: {} }));
vi.mock('../lib/storage', () => ({
  KEYS: { palmReadings: 'k', emotions: 'e', rituel: 'r' },
  local: {
    getJson: vi.fn(async (k: string, f: unknown) => (store.has(k) ? store.get(k) : f)),
    setJson: vi.fn(async (k: string, v: unknown) => void store.set(k, v)),
    remove: vi.fn(async (keys: string[]) => keys.forEach((k) => store.delete(k))),
  },
}));

import { __resetPalmForTests } from '../lib/palm';
import { clearRitual, isOracleReveal, readRitual, recordGesture, ritualToday, withGesture } from '../lib/rituel';

beforeEach(() => {
  store.clear();
  __resetPalmForTests();
});

const NOW = new Date(2026, 10, 9, 10, 0, 0); // 9 novembre 2026, 10 h (heure locale)
const TODAY = '2026-11-09';
const YESTERDAY = '2026-11-08';

describe('rituel du jour', () => {
  it('reconnaît le message de carte révélée envoyé par l’Oracle', () => {
    expect(isOracleReveal(JSON.stringify({ type: 'c127-oracle-reveal', n: '42' }))).toBe(true);
    expect(isOracleReveal(JSON.stringify({ type: 'c127-ready' }))).toBe(false);
    expect(isOracleReveal('pas du json')).toBe(false);
  });

  it('coche chaque geste à partir des vraies actions du jour', () => {
    const none = ritualToday({}, [], [], NOW);
    expect(none).toMatchObject({ carte: false, emotion: false, main: false, count: 0 });
    const all = ritualToday(
      { carte: TODAY },
      [{ day: TODAY, key: 'peur', at: NOW.toISOString() }],
      [{ id: 'p1', at: new Date(2026, 10, 9, 8).toISOString(), word: 'calme' }],
      NOW,
    );
    expect(all).toMatchObject({ carte: true, emotion: true, main: true, count: 3 });
  });

  it('ignore les gestes des jours précédents', () => {
    const r = ritualToday(
      { carte: YESTERDAY },
      [{ day: YESTERDAY, key: 'peur', at: '' }],
      [{ id: 'p1', at: new Date(2026, 10, 8, 8).toISOString(), word: 'x' }],
      NOW,
    );
    expect(r.count).toBe(0);
  });

  it('fait avancer la série une seule fois par jour et la remet à 1 après une coupure', () => {
    const s1 = withGesture({ lastDay: YESTERDAY, streak: 3 }, NOW);
    expect(s1).toEqual({ lastDay: TODAY, streak: 4 });
    expect(withGesture(s1, NOW)).toBe(s1);
    expect(withGesture({ lastDay: '2026-11-01', streak: 9 }, NOW)).toEqual({ lastDay: TODAY, streak: 1 });
  });

  it('affiche la série en cours, et l’éteint après un jour sans geste', () => {
    expect(ritualToday({ lastDay: YESTERDAY, streak: 3 }, [], [], NOW).streak).toBe(3);
    expect(ritualToday({ lastDay: YESTERDAY, streak: 3, carte: TODAY }, [], [], NOW).streak).toBe(4);
    expect(ritualToday({ lastDay: '2026-11-05', streak: 6 }, [], [], NOW).streak).toBe(0);
  });

  it('garde la carte du jour et la série par personne, et sait tout effacer', async () => {
    await recordGesture('carte', NOW);
    expect(await readRitual()).toEqual({ carte: TODAY, lastDay: TODAY, streak: 1 });
    await recordGesture('emotion', NOW);
    expect((await readRitual()).streak).toBe(1);
    await clearRitual();
    expect(await readRitual()).toEqual({});
  });
});
