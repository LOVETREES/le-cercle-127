import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => new Map<string, unknown>());
vi.mock('../lib/api', () => ({ api: {} }));
vi.mock('../lib/storage', () => ({
  KEYS: { palmReadings: 'k', dreamer: 'd' },
  local: {
    getJson: vi.fn(async (k: string, f: unknown) => (store.has(k) ? store.get(k) : f)),
    setJson: vi.fn(async (k: string, v: unknown) => void store.set(k, v)),
    remove: vi.fn(async (keys: string[]) => keys.forEach((k) => store.delete(k))),
  },
}));

import { clearDreamer, dreamerLines, isEmptyProfile, readDreamer, saveDreamer } from '../lib/dreamer';
import { splitContext, withContext } from '../lib/oni-questions';

beforeEach(() => store.clear());

describe('profil du rêveur', () => {
  it('est vide par défaut, se garde nettoyé et s’efface', async () => {
    expect(isEmptyProfile(await readDreamer())).toBe(true);
    await saveDreamer({ name: '  Safia ', age: '40-59', areas: ['Changement de vie'], now: ' Je cherche une maison avec jardin ', use: 'lectures' });
    const p = await readDreamer();
    expect(p).toMatchObject({ name: 'Safia', age: '40-59', now: 'Je cherche une maison avec jardin', use: 'lectures' });
    await clearDreamer();
    expect(isEmptyProfile(await readDreamer())).toBe(true);
  });

  it('n’est confié à Oni qu’avec l’accord de la personne', () => {
    const p = { name: 'Safia', age: '40-59' as const, areas: ['Changement de vie'], now: 'Un déménagement', use: 'lectures' as const };
    const lines = dreamerLines(p);
    expect(lines[0]).toBe('• Qui je suis : appelle-moi Safia · 40 à 59 ans · ce qui occupe ma vie : Changement de vie');
    expect(lines[1]).toContain('Un déménagement');
    expect(dreamerLines({ ...p, use: 'aucun' })).toEqual([]);
    expect(dreamerLines({ areas: [], use: 'lectures' })).toEqual([]);
  });

  it('rejoint les précisions du rêve, même sans réponse aux questions', () => {
    const story = withContext('Une maison inconnue', [], [], (s) => s, dreamerLines({ name: 'Safia', areas: [], use: 'lectures' }));
    expect(splitContext(story)).toEqual({ story: 'Une maison inconnue', context: '— Précisions pour Oni —\n• Qui je suis : appelle-moi Safia' });
  });
});
