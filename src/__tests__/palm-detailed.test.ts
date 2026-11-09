import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/api', () => ({ api: {} }));

import { lineSummary, lineTimeline, parseList } from '../lib/palm-detailed';
import { FEATURES } from '../lib/features';

const item = (id: string, at: string, head: object) => ({ id, at, hand: 'droite', reading: { title: id }, observations: { lines: { head } } });

describe('lecture détaillée de la main', () => {
  it('reste fermée dans la version en revue', () => {
    expect(FEATURES.palmDetailed).toBe(false);
    expect(FEATURES.sisters).toBe(false);
  });

  it('lit prudemment la réponse du site', () => {
    const r = parseList({ items: [item('a', '2026-11-08T10:00:00Z', {}), { id: 3 }, null], quota: { plus: false, free_left: 1, next_at: null } });
    expect(r.items.map((x) => x.id)).toEqual(['a']);
    expect(r.quota).toEqual({ plus: false, free_left: 1, next_at: null });
    expect(parseList(undefined)).toEqual({ items: [], quota: { plus: false, free_left: 0, next_at: null } });
  });

  it('montre l’évolution des lignes et repère les changements', () => {
    const { items } = parseList({
      items: [
        item('new', '2026-12-08T10:00:00Z', { present: true, length: 'moyenne', depth: 'profonde', visibility: 0.9 }),
        item('old', '2026-11-08T10:00:00Z', { present: true, length: 'moyenne', depth: 'fine', visibility: 0.9 }),
      ],
    });
    const head = lineTimeline(items).find((r) => r.key === 'head')!;
    expect(head.cells.map((c) => c.text)).toEqual(['moyenne · fine', 'moyenne · profonde']);
    expect(head.cells.map((c) => c.changed)).toEqual([false, true]);
    expect(lineSummary({ present: false })).toBe('absente');
    expect(lineSummary(undefined)).toBe('—');
  });
});
