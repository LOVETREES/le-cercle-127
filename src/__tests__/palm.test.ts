import { describe, expect, it, vi } from 'vitest';

import { addPalmReading, parsePalmMessage } from '../lib/palm';
import { PALM_BRIDGE_JS } from '../lib/palm-bridge';
import { injectedScript } from '../lib/webpage';

vi.mock('../lib/api', () => ({ api: {} }));
vi.mock('../lib/storage', () => ({ KEYS: { palmReadings: 'k' }, local: { getJson: vi.fn(), setJson: vi.fn() } }));

describe('lecture de la main (Terra)', () => {
  const msg = JSON.stringify({ type: 'c127-palm-reading', word: '  Ta main sait attendre.  ', mantra: 'Je suis ancrée.', mudra: 'Prithvi Mudra', summary: 'Ligne de cœur : longue' });

  it('lit la parole de Terra', () => {
    const r = parsePalmMessage(msg, new Date('2026-11-07T20:00:00Z'));
    expect(r).toMatchObject({ word: 'Ta main sait attendre.', mantra: 'Je suis ancrée.', mudra: 'Prithvi Mudra', at: '2026-11-07T20:00:00.000Z' });
  });

  it('ignore les autres messages', () => {
    expect(parsePalmMessage('{"type":"c127-ready"}')).toBeUndefined();
    expect(parsePalmMessage(JSON.stringify({ type: 'c127-palm-reading', word: '' }))).toBeUndefined();
    expect(parsePalmMessage('pas du json')).toBeUndefined();
  });

  it('évite les doublons', () => {
    const a = parsePalmMessage(msg, new Date(1))!;
    const b = parsePalmMessage(msg, new Date(2))!;
    const list = addPalmReading([], a);
    expect(addPalmReading(list, b)).toBe(list);
  });

  it('est injecté dans les pages du site', () => {
    expect(injectedScript()).toContain(PALM_BRIDGE_JS);
    expect(injectedScript()).toContain('c127palm()');
  });
});

describe('synchronisation des lectures de la main', () => {
  it('réunit téléphone et compte sans doublon, plus récentes d’abord', async () => {
    const { mergePalmReadings } = await import('../lib/palm');
    const a = { id: 'palm-1', at: '2026-11-01T10:00:00Z', word: 'Un', mantra: 'm' };
    const b = { id: 'palm-2', at: '2026-11-05T10:00:00Z', word: 'Deux' };
    const dupe = { id: 'palm-9', at: '2026-11-02T10:00:00Z', word: 'Un', mantra: 'm' };
    expect(mergePalmReadings([a], [b, dupe]).map((r) => r.id)).toEqual(['palm-2', 'palm-1']);
  });
});

describe('formatPalmSummary', () => {
  it('remet une observation par ligne', async () => {
    const { formatPalmSummary } = await import('../lib/palm');
    const glued = 'Main observée : droitePaume : plutôt carréeDoigts : courts par rapport à la paumeSouplesse : intermédiairePouce : courtLigne Cœur : courte · profondeLigne Tête : moyenne · profondeLigne Vie : courte · droiteLigne Destin : moyenne · droite';
    expect(formatPalmSummary(glued).split('\n')).toEqual([
      'Main observée : droite',
      'Paume : plutôt carrée',
      'Doigts : courts par rapport à la paume',
      'Souplesse : intermédiaire',
      'Pouce : court',
      'Ligne Cœur : courte · profonde',
      'Ligne Tête : moyenne · profonde',
      'Ligne Vie : courte · droite',
      'Ligne Destin : moyenne · droite',
    ]);
    expect(formatPalmSummary('Paume : carrée\nPouce : court')).toBe('Paume : carrée\nPouce : court');
  });
});

describe('lastPalmScript', () => {
  it('transmet la lecture la plus récente sans pouvoir fermer la balise script', async () => {
    const { lastPalmScript } = await import('../lib/palm');
    const storage = await import('../lib/storage');
    const getJson = storage.local.getJson as unknown as ReturnType<typeof vi.fn>;
    getJson.mockResolvedValueOnce([
      { id: 'a', at: '2026-11-07T08:00:00.000Z', word: 'ancienne' },
      { id: 'b', at: '2026-11-08T08:00:00.000Z', word: 'du jour </script><b>', mantra: 'm' },
    ]);
    const s = await lastPalmScript();
    expect(s.startsWith('<script>window.C127_LAST_PALM=')).toBe(true);
    expect(s).toContain('du jour \\u003c/script>');
    expect(s.match(/<\/script>/g)).toHaveLength(1);
  });
});
