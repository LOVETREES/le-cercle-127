import { Body, Illumination, MoonPhase } from 'astronomy-engine';

const PHASES = [
  { label: 'Nouvelle lune', icon: 'moon-new' },
  { label: 'Premier croissant', icon: 'moon-waxing-crescent' },
  { label: 'Premier quartier', icon: 'moon-first-quarter' },
  { label: 'Lune gibbeuse croissante', icon: 'moon-waxing-gibbous' },
  { label: 'Pleine lune', icon: 'moon-full' },
  { label: 'Lune gibbeuse décroissante', icon: 'moon-waning-gibbous' },
  { label: 'Dernier quartier', icon: 'moon-last-quarter' },
  { label: 'Dernier croissant', icon: 'moon-waning-crescent' },
] as const;

/** Quarts et pleines lunes près de leur instant exact ; les phases intermédiaires restent distinctes. */
export function moonAt(date: Date) {
  const angle = MoonPhase(date);
  const fraction = Illumination(Body.Moon, date).phase_fraction;
  const illuminated = Math.round(fraction * 100);
  const phase = angle < 3 || angle >= 357 ? 0 : angle < 87 ? 1 : angle < 93 ? 2 : angle < 177 ? 3 : angle < 183 ? 4 : angle < 267 ? 5 : angle < 273 ? 6 : 7;
  return { ...PHASES[phase], illuminated, fraction, waxing: angle < 180 };
}
