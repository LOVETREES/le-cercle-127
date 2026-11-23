import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => new Map<string, unknown>());
vi.mock('../lib/storage', () => ({ local: {
  getJson: async (key: string, fallback: unknown) => store.has(key) ? store.get(key) : fallback,
  setJson: async (key: string, value: unknown) => { store.set(key, value); },
  remove: async (keys: string[]) => { keys.forEach((key) => store.delete(key)); },
} }));
import { clearLocalDrafts, draftKey, readLocalDraft, writeLocalDraft } from '../lib/local-draft';

beforeEach(() => store.clear());
describe('brouillons locaux', () => {
  it('garde la dernière frappe et isole les personnes et les pages', async () => {
    const key = draftKey('local', 'home');
    await Promise.all([writeLocalDraft(key, 'un'), writeLocalDraft(key, 'une nuit')]);
    expect(await readLocalDraft(key)).toBe('une nuit');
    expect(await readLocalDraft(draftKey('demo', 'home'))).toBeNull();
    expect(await readLocalDraft(draftKey('local', 'chapter-0'))).toBeNull();
  });
  it('efface les brouillons même après des écritures en attente', async () => {
    const key = draftKey('local', 'chapter-0');
    const writing = writeLocalDraft(key, 'privé');
    await clearLocalDrafts('local');
    await writing;
    expect(await readLocalDraft(key)).toBeNull();
  });
});
