import { describe, expect, it } from 'vitest';

import { mixBytes, parseQrng, quantumBytes } from '../lib/oracle/qrng';
import { H, X, measure, outcomes } from '../lib/oracle/qubits';
import { CARDS, makeSeal } from '../lib/oracle/engine';
import { lameText } from '../lib/oracle/localize';

describe('laboratoire des sept qubits', () => {
  it('H crée et défait la superposition, X bascule', () => {
    expect(H['0']).toBe('+');
    expect(H[H['0']]).toBe('0');
    expect(X['0']).toBe('1');
    expect(outcomes(['+', '+', '0', '1', '0', '0', '-'])).toBe(8);
    expect(outcomes(Array(7).fill('+'))).toBe(128);
  });

  it('une mesure donne le masque d’une lame (bit i = Sœur i)', () => {
    const { bits, mask } = measure(['1', '+', '0', '0', '1', '0', '+'], () => [0, 1, 0, 0, 0, 0, 0]);
    expect(bits).toEqual([1, 1, 0, 0, 1, 0, 0]);
    expect(mask).toBe(1 + 2 + 16);
    expect(measure(Array(7).fill('0'), () => Array(7).fill(1)).mask).toBe(0);
  });
});

describe('hasard quantique facultatif', () => {
  it('lit la réponse du service et refuse ce qui ne lui ressemble pas', () => {
    expect(Array.from(parseQrng({ qrn: 'ff00A1', length: 3 }, 3) ?? [])).toEqual([255, 0, 161]);
    expect(parseQrng({ qrn: 'zz' }, 1)).toBeUndefined();
    expect(parseQrng({ qrn: 'ff' }, 4)).toBeUndefined();
    expect(parseQrng(null, 1)).toBeUndefined();
  });

  it('se passe du service quand il ne répond pas', async () => {
    const down = (async () => { throw new Error('hors ligne'); }) as unknown as typeof fetch;
    expect(await quantumBytes(8, 50, down)).toBeUndefined();
    const ok = (async () => ({ ok: true, json: async () => ({ qrn: '0102030405060708' }) })) as unknown as typeof fetch;
    expect(Array.from((await quantumBytes(8, 50, ok)) ?? [])).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('mêle les octets quantiques sans remplacer ceux du téléphone, et le dit dans la source', async () => {
    expect(Array.from(mixBytes(Uint8Array.from([1, 2]), Uint8Array.from([3, 3])))).toEqual([2, 1]);
    const seen: string[] = [];
    const c = { randomBytes: (n: number) => new Uint8Array(n).fill(1), sha256Hex: async (s: string) => { seen.push(s); return 'aaaaaaaa00'; } };
    const r = await makeSeal(c, '', 0, new Date('2026-01-01T00:00:00Z'), { bytes: new Uint8Array(8).fill(3), label: 'générateur quantique' });
    expect(seen[0].endsWith('0202020202020202')).toBe(true);
    expect(r.source).toContain('générateur quantique');
  });
});

describe('lames traduites', () => {
  it('ont un nom et une définition dans les quatre langues', () => {
    for (const l of ['en', 'es', 'it', 'de']) for (const c of CARDS) { const x = lameText(c, l); expect(x.name && x.definition && x.name !== c.name || l === 'xx').toBeTruthy(); }
    expect(lameText(CARDS[62], 'en').name).toBe('The Lucidity');
    expect(lameText(CARDS[116], 'fr').name).toBe('Le Désert');
  });
});
