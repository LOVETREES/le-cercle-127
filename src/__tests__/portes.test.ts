import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => new Map<string, unknown>());
vi.mock('../lib/api', () => ({ api: {} }));
vi.mock('../lib/storage', () => ({
  KEYS: { palmReadings: 'k', portes: 'p' },
  local: {
    getJson: vi.fn(async (k: string, f: unknown) => (store.has(k) ? store.get(k) : f)),
    setJson: vi.fn(async (k: string, v: unknown) => void store.set(k, v)),
    remove: vi.fn(async (keys: string[]) => keys.forEach((k) => store.delete(k))),
  },
}));

import { __resetPalmForTests } from '../lib/palm';
import { clearPortes, doorStates, readPortes, recordSister, sisterFromMessage } from '../lib/portes';

beforeEach(() => {
  store.clear();
  __resetPalmForTests();
});

const NOW = new Date(2026, 10, 9, 10, 0, 0); // 9 novembre 2026

describe('portes du Grimoire', () => {
  it('reconnaît la Sœur signalée par une page du site', () => {
    expect(sisterFromMessage(JSON.stringify({ type: 'c127-sister', sister: 'Naïa' }))).toBe('naia');
    expect(sisterFromMessage(JSON.stringify({ type: 'c127-sister', sister: 'inconnue' }))).toBeUndefined();
    expect(sisterFromMessage(JSON.stringify({ type: 'c127-oracle-reveal' }))).toBeUndefined();
    expect(sisterFromMessage('pas du json')).toBeUndefined();
  });

  it('ouvre, met en cours ou laisse fermée chaque porte', () => {
    const doors = doorStates(
      { oni: ['2026-11-02'], naia: [new Date(2026, 8, 20).toISOString()], terra: [] },
      { irma: new Date(2026, 10, 1).getTime() },
      NOW,
    );
    const byKey = Object.fromEntries(doors.map((d) => [d.key, d.state]));
    expect(byKey).toEqual({ oni: 'encours', alka: 'fermee', naia: 'ouverte', terra: 'fermee', ignis: 'fermee', astria: 'fermee', irma: 'encours' });
    expect(doors.map((d) => d.num)).toEqual(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']);
  });

  it('retient une pratique et l’efface à la demande', async () => {
    await recordSister('alka', NOW);
    expect((await readPortes()).alka).toBe(NOW.getTime());
    expect(doorStates({}, await readPortes(), NOW).find((d) => d.key === 'alka')?.state).toBe('encours');
    await clearPortes();
    expect(await readPortes()).toEqual({});
  });
});
