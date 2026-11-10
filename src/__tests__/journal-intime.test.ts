import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => new Map<string, unknown>());
vi.mock('../lib/api', () => ({ api: {} }));
vi.mock('../lib/storage', () => ({
  KEYS: { palmReadings: 'k', journalIntime: 'j' },
  local: {
    getJson: vi.fn(async (k: string, f: unknown) => (store.has(k) ? store.get(k) : f)),
    setJson: vi.fn(async (k: string, v: unknown) => void store.set(k, v)),
    remove: vi.fn(async (keys: string[]) => keys.forEach((k) => store.delete(k))),
  },
}));

import { clearJournal, deleteEntry, listEntries, PROMPTS, promptOfDay, saveEntry } from '../lib/journal-intime';

beforeEach(() => store.clear());

describe('journal intime', () => {
  it('garde, modifie, range du plus récent au plus ancien et supprime des pages', async () => {
    await saveEntry({ text: '  Première page  ' }, new Date('2026-11-09T08:00:00Z'));
    await saveEntry({ text: 'Deuxième page', feeling: 'Apaisé·e' }, new Date('2026-11-10T08:00:00Z'));
    expect(await saveEntry({ text: '   ' })).toHaveLength(2); // une page vide n'est pas gardée
    let l = await listEntries();
    expect(l.map((e) => e.text)).toEqual(['Deuxième page', 'Première page']);
    await saveEntry({ id: l[1].id, text: 'Première page, relue' }, new Date('2026-11-10T09:00:00Z'));
    l = await listEntries();
    expect(l[1]).toMatchObject({ text: 'Première page, relue', at: '2026-11-09T08:00:00.000Z', updatedAt: '2026-11-10T09:00:00.000Z' });
    l = await deleteEntry(l[0].id);
    expect(l).toHaveLength(1);
    await clearJournal();
    expect(await listEntries()).toEqual([]);
  });

  it('propose une invitation du jour, la même toute la journée', () => {
    expect(PROMPTS).toContain(promptOfDay(new Date(2026, 10, 10, 8)));
    expect(promptOfDay(new Date(2026, 10, 10, 8))).toBe(promptOfDay(new Date(2026, 10, 10, 22)));
  });
});
