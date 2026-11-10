import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => new Map<string, unknown>());
vi.mock('../lib/api', () => ({ api: {} }));
vi.mock('../lib/storage', () => ({
  KEYS: { palmReadings: 'k', oracleToday: 'o' },
  local: {
    getJson: vi.fn(async (k: string, f: unknown) => (store.has(k) ? store.get(k) : f)),
    setJson: vi.fn(async (k: string, v: unknown) => void store.set(k, v)),
    remove: vi.fn(async (keys: string[]) => keys.forEach((k) => store.delete(k))),
  },
}));

import { clearTodaysDraw, recordTodaysDraw, todaysDraw } from '../lib/oracle/daily';
import { drawFrom } from '../lib/oracle/engine';

beforeEach(() => store.clear());

describe('un tirage par jour', () => {
  it('garde le tirage du jour jusqu’à minuit, heure de Paris', async () => {
    const at = new Date('2026-11-10T09:00:00Z');
    expect(await todaysDraw(at)).toBeUndefined();
    const d = drawFrom('trois', '4F2A9C1B', 'test');
    await recordTodaysDraw(d, ' ma question ', at);
    const again = await todaysDraw(new Date('2026-11-10T22:30:00Z')); // 23 h 30 à Paris : même jour
    expect(again?.cards.map((c) => c.n)).toEqual(d.cards.map((c) => c.n));
    expect(again?.seal).toBe('4F2A9C1B');
    expect(again?.intent).toBe('ma question');
    expect(await todaysDraw(new Date('2026-11-10T23:30:00Z'))).toBeUndefined(); // 0 h 30 le 11 à Paris
  });

  it('s’efface avec les données de la personne', async () => {
    await recordTodaysDraw(drawFrom('jour', undefined, ''), '', new Date('2026-11-10T09:00:00Z'));
    await clearTodaysDraw();
    expect(await todaysDraw(new Date('2026-11-10T10:00:00Z'))).toBeUndefined();
  });
});
