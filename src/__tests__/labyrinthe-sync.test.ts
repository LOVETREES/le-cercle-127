import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/api', () => ({ api: {} }));
vi.mock('../lib/storage', () => ({ KEYS: {}, local: { getJson: vi.fn(), setJson: vi.fn(), remove: vi.fn() } }));

import { mergeBilans, type Bilan } from '../lib/labyrinthe/store';

const b = (week: string, at: string, n = 2): Bilan => ({ week, at, answers: Array(7).fill(n) });

describe('bilans retrouvés entre l’app et le site', () => {
  it('fusionne par semaine, le plus récent l’emporte, du plus récent au plus ancien', () => {
    const phone = [b('2026-W46', '2026-11-10T08:00:00Z', 1), b('2026-W44', '2026-10-28T08:00:00Z')];
    const account = [b('2026-W46', '2026-11-10T09:00:00Z', 3), b('2026-W45', '2026-11-03T08:00:00Z')];
    const m = mergeBilans(phone, account);
    expect(m.map((x) => x.week)).toEqual(['2026-W46', '2026-W45', '2026-W44']);
    expect(m[0].answers[0]).toBe(3);
  });

  it('écarte ce qui ne ressemble pas à un bilan', () => {
    const bad = [{ week: 'x', at: '', answers: [] }, { week: '2026-W40', at: '2026-10-01T00:00:00Z', answers: [5, 0, 0, 0, 0, 0, 0] }, null, 'texte'];
    expect(mergeBilans([], bad)).toEqual([]);
  });
});
