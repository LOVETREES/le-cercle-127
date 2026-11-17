import { describe, expect, it } from 'vitest';
import { moonAt } from '../lib/moon';

describe('phase lunaire', () => {
  it('reflète la nouvelle et la pleine lune aux instants astronomiques connus', () => {
    const newMoon = moonAt(new Date('2024-04-08T18:21:00Z'));
    const fullMoon = moonAt(new Date('2024-03-25T07:00:00Z'));
    expect(newMoon.label).toBe('Nouvelle lune');
    expect(newMoon.illuminated).toBeLessThan(2);
    expect(fullMoon.label).toBe('Pleine lune');
    expect(fullMoon.illuminated).toBeGreaterThan(98);
  });
  it('distingue la Lune croissante et décroissante avec une valeur comprise entre 0 et 100', () => {
    const growing = moonAt(new Date('2024-04-15T19:13:00Z'));
    const waning = moonAt(new Date('2024-05-01T11:27:00Z'));
    expect(growing.icon).toBe('moon-first-quarter');
    expect(waning.icon).toBe('moon-last-quarter');
    expect(growing.waxing).toBe(true);
    expect(waning.waxing).toBe(false);
    expect(growing.fraction).toBeCloseTo(0.5, 1);
    expect(waning.fraction).toBeCloseTo(0.5, 1);
    expect(growing.illuminated).toBeGreaterThanOrEqual(0);
    expect(waning.illuminated).toBeLessThanOrEqual(100);
  });
});
