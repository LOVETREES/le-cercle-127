import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadRealityChecks, makeRealityCheck, saveRealityChecks } from '../lib/reality-journal';
const data = vi.hoisted(() => new Map<string, unknown>());
vi.mock('../lib/storage', () => ({ KEYS: { journal: 'personal', demoJournal: 'demo' }, local: {
  getJson: async (key: string, fallback: unknown) => data.get(key) ?? fallback,
  setJson: async (key: string, value: unknown) => { data.set(key, value); },
} }));
beforeEach(() => data.clear());
describe('journal utilisable sans compte', () => {
  it('conserve une observation, la recharge et la supprime sans appel serveur', async () => {
    const entry = makeRealityCheck(' Dans le jardin ', ' Je regarde la lumière ', 'awake');
    await saveRealityChecks([entry]);
    expect((await loadRealityChecks())[0]).toMatchObject({ context: 'Dans le jardin', observation: 'Je regarde la lumière', state: 'awake' });
    await saveRealityChecks([]); expect(await loadRealityChecks()).toEqual([]);
  });
  it('ne mélange pas les exemples et le journal personnel', async () => {
    await saveRealityChecks([makeRealityCheck('Privé', '', 'awake')]);
    await saveRealityChecks([makeRealityCheck('Démo', '', 'uncertain')], true);
    expect((await loadRealityChecks())[0].context).toBe('Privé');
    expect((await loadRealityChecks(true))[0].context).toBe('Démo');
  });
  it('ne garde pas une entrée vide', () => expect(() => makeRealityCheck(' ', '', 'awake')).toThrow('observation'));
});
