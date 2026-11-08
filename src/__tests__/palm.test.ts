import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addPalmReading, parsePalmMessage } from '../lib/palm';
import { PALM_BRIDGE_JS } from '../lib/palm-bridge';
import { injectedScript } from '../lib/webpage';

vi.mock('../lib/api', () => ({ api: {} }));
// Stockage en mémoire : on vérifie vraiment ce qui est écrit et effacé.
const store = vi.hoisted(() => new Map<string, unknown>());
vi.mock('../lib/storage', () => ({
  KEYS: { palmReadings: 'k' },
  local: {
    getJson: vi.fn(async (k: string, fallback: unknown) => (store.has(k) ? store.get(k) : fallback)),
    setJson: vi.fn(async (k: string, v: unknown) => void store.set(k, v)),
    remove: vi.fn(async (keys: string[]) => keys.forEach((k) => store.delete(k))),
  },
}));

beforeEach(async () => {
  store.clear();
  (await import('../lib/palm')).__resetPalmForTests();
});

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
    store.set('k:local', [
      { id: 'a', at: '2026-11-07T08:00:00.000Z', word: 'ancienne' },
      { id: 'b', at: '2026-11-08T08:00:00.000Z', word: 'du jour </script><b>', mantra: 'm' },
    ]);
    const s = await lastPalmScript();
    expect(s.startsWith('<script>window.C127_LAST_PALM=')).toBe(true);
    expect(s).toContain('du jour \\u003c/script>');
    expect(s.match(/<\/script>/g)).toHaveLength(1);
  });
});

describe('isolation des lectures de la main (audit N01)', () => {
  const msg = (word: string) => JSON.stringify({ type: 'c127-palm-reading', word });

  it('sépare démonstration, personne non connectée et chaque compte', async () => {
    const p = await import('../lib/palm');
    p.setPalmOwner(p.palmOwnerFor(false, null));
    await p.storePalmMessage(msg('lecture personnelle'));
    p.setPalmOwner(p.palmOwnerFor(true, null));
    expect(await p.listPalmReadings()).toEqual([]);
    p.setPalmOwner(p.palmOwnerFor(false, '42'));
    expect(await p.listPalmReadings()).toEqual([]);
    await p.storePalmMessage(msg('lecture du compte 42'));
    p.setPalmOwner(p.palmOwnerFor(false, '7'));
    expect(await p.listPalmReadings()).toEqual([]);
    p.setPalmOwner('local');
    expect((await p.listPalmReadings()).map((r) => r.word)).toEqual(['lecture personnelle']);
  });

  it('efface vraiment les lectures de l’appareil', async () => {
    const p = await import('../lib/palm');
    await p.storePalmMessage(msg('à effacer'));
    expect(await p.listPalmReadings()).toHaveLength(1);
    await p.clearPalmReadings();
    expect(await p.listPalmReadings()).toEqual([]);
  });

  it('confie les anciennes lectures (clé commune) à la première personne réelle, jamais à la démo', async () => {
    const p = await import('../lib/palm');
    store.set('k', [{ id: 'old', at: '2026-11-01T08:00:00.000Z', word: 'ancienne lecture' }]);
    p.setPalmOwner('demo');
    expect(await p.listPalmReadings()).toEqual([]);
    p.setPalmOwner('user-1');
    expect((await p.listPalmReadings()).map((r) => r.id)).toEqual(['old']);
    expect(store.has('k')).toBe(false);
  });

  it('ne synchronise jamais la démonstration ni la personne non connectée', async () => {
    const p = await import('../lib/palm');
    p.setPalmOwner('demo');
    await p.storePalmMessage(msg('démo'));
    expect((await p.syncPalmReadings('jeton')).map((r) => r.word)).toEqual(['démo']);
  });
});
