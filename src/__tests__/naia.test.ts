import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => new Map<string, unknown>());
vi.mock('../lib/api', () => ({ api: {} }));
vi.mock('../lib/storage', () => ({
  KEYS: { palmReadings: 'k', emotions: 'e' },
  local: {
    getJson: vi.fn(async (k: string, f: unknown) => (store.has(k) ? store.get(k) : f)),
    setJson: vi.fn(async (k: string, v: unknown) => void store.set(k, v)),
    remove: vi.fn(async (keys: string[]) => keys.forEach((k) => store.delete(k))),
  },
}));

import { EMOTIONS, clearEmotions, lastSevenDays, listEmotions, recordEmotion } from '../lib/naia';
import { __resetPalmForTests, setPalmOwner } from '../lib/palm';
import { dictionary } from '../i18n';

beforeEach(() => {
  store.clear();
  __resetPalmForTests();
});

describe('Naïa : régulation des émotions', () => {
  it('garde une émotion par jour (la dernière choisie) et trace les 7 derniers jours', async () => {
    await recordEmotion('peur', new Date(2026, 10, 6, 9));
    await recordEmotion('colere', new Date(2026, 10, 8, 9));
    await recordEmotion('soulagement', new Date(2026, 10, 8, 21));
    const list = await listEmotions();
    expect(list.map((e) => e.key)).toEqual(['soulagement', 'peur']);
    const week = lastSevenDays(list, new Date(2026, 10, 8, 22));
    expect(week).toHaveLength(7);
    expect(week[6]).toEqual({ day: '2026-11-08', key: 'soulagement' });
    expect(week[4]).toEqual({ day: '2026-11-06', key: 'peur' });
    expect(week[5].key).toBeUndefined();
  });

  it('sépare les émotions de la démonstration et les efface', async () => {
    await recordEmotion('tristesse');
    setPalmOwner('demo');
    expect(await listEmotions()).toEqual([]);
    setPalmOwner('local');
    await clearEmotions();
    expect(await listEmotions()).toEqual([]);
  });

  it('a chaque texte traduit dans les quatre langues', () => {
    for (const l of ['en', 'es', 'it', 'de'] as const) {
      const d = dictionary(l);
      for (const e of EMOTIONS) for (const s of [e.name, e.need, e.body, e.gesture, e.phrase]) expect([l, s, !!d[s]]).toEqual([l, s, true]);
    }
  });
});
