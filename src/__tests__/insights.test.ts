import { describe, expect, it } from 'vitest';

import { addPresence, DAILY_THOUGHTS, dailyThought, journey, recurringMotifs, streaks } from '../lib/insights';
import type { Dream } from '../lib/model';

const dream = (id: string, date: string, extra: Partial<Dream> = {}): Dream =>
  ({ id, title: id, story: 'x', dreamDate: date, createdAt: `${date}T07:00:00Z`, ...extra }) as Dream;

describe('mesures d’évolution', () => {
  it('compte les symboles qui reviennent', () => {
    const d = [dream('1', '2026-11-01', { symbols: ['La maison', 'Le rat'] }), dream('2', '2026-11-03', { symbols: ['La maison'] })];
    expect(recurringMotifs(d)).toEqual([['La maison', 2]]);
  });

  it('calcule les séries de jours', () => {
    const today = new Date(2026, 10, 7);
    expect(streaks(['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-01'], today)).toEqual({ longest: 3, current: 3 });
    expect(streaks(['2026-11-05', '2026-11-06'], today)).toEqual({ longest: 2, current: 2 });
    expect(streaks(['2026-11-04'], today).current).toBe(0);
  });

  it('résume six mois et la transformation émotionnelle', () => {
    const today = new Date(2026, 10, 7);
    const d = [
      dream('1', '2026-09-02', { emotion: 'peur', intensity: 4 }),
      dream('2', '2026-10-02', { emotion: 'tristesse', intensity: 3 }),
      dream('3', '2026-11-02', { emotion: 'serenite', intensity: 2 }),
      dream('4', '2026-11-05', { emotion: 'joie', intensity: 2 }),
    ];
    const j = journey(d, today);
    expect(j.months).toHaveLength(6);
    expect(j.months[5]).toMatchObject({ label: 'nov.', count: 2, avgIntensity: 2 });
    expect(j.calmShare).toEqual({ before: 0, after: 100 });
  });

  it('ajoute un jour de présence une seule fois', () => {
    const t = new Date(2026, 10, 7);
    const once = addPresence([], t);
    expect(addPresence(once, t)).toEqual(['2026-11-07']);
  });

  it('donne une pensée du jour stable', () => {
    const t = new Date(2026, 10, 7);
    expect(dailyThought(t)).toBe(dailyThought(new Date(2026, 10, 7, 22)));
    expect(DAILY_THOUGHTS).toContain(dailyThought(t));
    expect(dailyThought(new Date(2026, 10, 8))).not.toBe(dailyThought(t));
  });
});
