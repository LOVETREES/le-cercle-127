import { describe, expect, it } from 'vitest';

import { CARDS, dayCard, deckFromSeal, drawFrom, hashText, lameByMask, makeSeal, sistersOfMask } from '../lib/oracle/engine';

describe('Oracle 127 natif', () => {
  it('a 127 lames, une par combinaison non vide des 7 Sœurs', () => {
    expect(CARDS).toHaveLength(127);
    expect(new Set(CARDS.map((c) => c.mask)).size).toBe(127);
    expect(CARDS.every((c) => c.mask >= 1 && c.mask <= 127 && c.definition && c.image)).toBe(true);
    expect(lameByMask(87).name).toBe('Le Désert');
    expect(sistersOfMask(87).map((s) => s.name)).toEqual(['Oni', 'Alka', 'Naïa', 'Ignis', 'Irma']);
  });

  it('mélange comme le site : même sceau, même paquet', () => {
    // Valeurs obtenues avec le code du site (Le Reliquaire) pour le sceau 4F2A9C1B.
    const deck = deckFromSeal('4F2A9C1B');
    expect(deck.slice(0, 7)).toEqual([20, 81, 67, 13, 68, 120, 119]);
    expect([...deck].sort((a, b) => a - b)).toEqual(Array.from({ length: 127 }, (_, i) => i + 1));
    expect(deckFromSeal('4F2A9C1B')).toEqual(deck);
  });

  it('donne la même carte du jour que le site (heure de Paris)', () => {
    expect(hashText('2026-11-10|carte-du-jour') % 127).toBe(116);
    expect(dayCard(new Date('2026-11-10T10:00:00Z')).name).toBe('Le Désert');
    // 23 h 30 à Paris le 10 = encore le 10 ; 0 h 30 le 11 = le 11
    expect(dayCard(new Date('2026-11-10T22:30:00Z')).n).toBe(dayCard(new Date('2026-11-10T10:00:00Z')).n);
  });

  it('scelle un tirage et le rejoue', async () => {
    const c = { randomBytes: (n: number) => new Uint8Array(n).fill(7), sha256Hex: async () => 'abcdef0123456789' };
    const { seal } = await makeSeal(c, 'ma question', 1200);
    expect(seal).toBe('ABCDEF01');
    const d = drawFrom('trois', seal, 'test');
    expect(d.cards).toHaveLength(3);
    expect(drawFrom('trois', seal, 'test').cards).toEqual(d.cards);
    const failing = { randomBytes: (n: number) => new Uint8Array(n).fill(255), sha256Hex: async () => { throw new Error('x'); } };
    expect((await makeSeal(failing, '', 0)).seal).toBe('FFFFFFFF');
  });
});
