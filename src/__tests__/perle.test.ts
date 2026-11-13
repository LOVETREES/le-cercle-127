import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => new Map<string, unknown>());
vi.mock('../lib/api', () => ({ api: {} }));
vi.mock('../lib/storage', () => ({
  KEYS: { palmReadings: 'k', perlePending: 'p' },
  local: {
    getJson: vi.fn(async (k: string, f: unknown) => (store.has(k) ? store.get(k) : f)),
    setJson: vi.fn(async (k: string, v: unknown) => void store.set(k, v)),
    remove: vi.fn(async (keys: string[]) => keys.forEach((k) => store.delete(k))),
  },
}));

import { addPendingPerle, consentsComplete, isPerleProduct, listPendingPerles, pickPerleProduct, PERLE_PRODUCTS, removePendingPerle } from '../lib/perle-logic';

describe('La Perle d’Oni (règles)', () => {
  beforeEach(() => store.clear());
  it('la première Perle est au prix de bienvenue, les suivantes au prix normal', () => {
    expect(pickPerleProduct(true)).toBe(PERLE_PRODUCTS.welcome);
    expect(pickPerleProduct(false)).toBe(PERLE_PRODUCTS.standard);
    expect(isPerleProduct('perle_oni')).toBe(true);
    expect(isPerleProduct('autre')).toBe(false);
  });
  it('exige les trois accords avant le paiement', () => {
    expect(consentsComplete({ cgv: true, ai: true, withdrawal: true })).toBe(true);
    expect(consentsComplete({ cgv: true, ai: true, withdrawal: false })).toBe(false);
    expect(consentsComplete({ cgv: false, ai: true, withdrawal: true })).toBe(false);
  });
  it('garde un achat payé mais non confirmé, sans doublon, puis l’oublie une fois confirmé', async () => {
    const p = { dreamId: '12', productId: PERLE_PRODUCTS.standard, transactionId: 'GPA.1', at: '2026-11-13T10:00:00Z' };
    await addPendingPerle(p);
    await addPendingPerle(p);
    expect(await listPendingPerles()).toEqual([p]);
    await removePendingPerle('GPA.1');
    expect(await listPendingPerles()).toEqual([]);
  });
});
