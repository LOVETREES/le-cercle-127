// L'ACQUIS : ce que le ciel de naissance met en avant, lu à travers les Sœurs (lecture symbolique).
// Chaque Sœur a son astre (correspondances du Cercle) ; son poids dépend de la place de cet astre :
// domicile, exaltation, exil, chute (dignités traditionnelles) et proximité des luminaires.
// Calcul local avec Astronomy Engine (licence MIT) : rien n'est envoyé.
import { Ecliptic, GeoVector, type Body } from 'astronomy-engine';

export type SisterName = 'Oni' | 'Alka' | 'Naïa' | 'Terra' | 'Ignis' | 'Astria' | 'Irma';
export const ORDER: SisterName[] = ['Oni', 'Alka', 'Naïa', 'Terra', 'Ignis', 'Astria', 'Irma'];

export const ASTRE: Record<SisterName, { body: Body; name: string }> = {
  Oni: { body: 'Moon' as Body, name: 'Lune' },
  Alka: { body: 'Mercury' as Body, name: 'Mercure' },
  Naïa: { body: 'Venus' as Body, name: 'Vénus' },
  Terra: { body: 'Saturn' as Body, name: 'Saturne' },
  Ignis: { body: 'Mars' as Body, name: 'Mars' },
  Astria: { body: 'Sun' as Body, name: 'Soleil' },
  Irma: { body: 'Jupiter' as Body, name: 'Jupiter' },
};

export const SIGNS = ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'];

// Dignités traditionnelles, par indice de signe (0 = Bélier).
const DIG: Record<SisterName, { dom: number[]; exa: number[]; exil: number[]; chute: number[] }> = {
  Astria: { dom: [4], exa: [0], exil: [10], chute: [6] },
  Oni: { dom: [3], exa: [1], exil: [9], chute: [7] },
  Alka: { dom: [2, 5], exa: [5], exil: [8, 11], chute: [11] },
  Naïa: { dom: [1, 6], exa: [11], exil: [7, 0], chute: [5] },
  Ignis: { dom: [0, 7], exa: [9], exil: [6, 1], chute: [3] },
  Irma: { dom: [8, 11], exa: [3], exil: [2, 5], chute: [9] },
  Terra: { dom: [9, 10], exa: [6], exil: [3, 4], chute: [0] },
};

export type Birth = { date: string; time?: string }; // AAAA-MM-JJ, HH:MM (heure locale de l'appareil)
export type Placement = { sister: SisterName; astre: string; lon: number; sign: string; degree: number; weight: number; reasons: string[] };

export function birthInstant(b: Birth): Date | undefined {
  const m = b.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return undefined;
  const t = b.time?.match(/^(\d{1,2}):(\d{2})$/);
  // Sans heure : midi, l'erreur reste faible pour tous les astres sauf la Lune (≈ 6° au plus).
  const d = new Date(+m[1], +m[2] - 1, +m[3], t ? +t[1] : 12, t ? +t[2] : 0);
  return Number.isNaN(d.getTime()) || d.getFullYear() < 1900 || d > new Date() ? undefined : d;
}

const sep = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/** Les sept placements et le poids de chaque Sœur (≈ 0,5 à 3). */
export function acquis(b: Birth): Placement[] | undefined {
  const when = birthInstant(b);
  if (!when) return undefined;
  const lon = (s: SisterName) => Ecliptic(GeoVector(ASTRE[s].body, when, true)).elon;
  const L = Object.fromEntries(ORDER.map((s) => [s, lon(s)])) as Record<SisterName, number>;
  return ORDER.map((s) => {
    const signIdx = Math.floor(L[s] / 30) % 12;
    const d = DIG[s];
    const reasons: string[] = [];
    let w = 1;
    if (d.dom.includes(signIdx)) { w += 1.5; reasons.push('en domicile'); }
    if (d.exa.includes(signIdx)) { w += 1; reasons.push('en exaltation'); }
    if (d.exil.includes(signIdx)) { w -= 0.5; reasons.push('en exil'); }
    if (d.chute.includes(signIdx)) { w -= 0.5; reasons.push('en chute'); }
    if (s !== 'Astria' && s !== 'Oni') {
      if (sep(L[s], L.Astria) <= 8) { w += 0.5; reasons.push('près du Soleil'); }
      if (sep(L[s], L.Oni) <= 8) { w += 0.5; reasons.push('près de la Lune'); }
    }
    if (s === 'Oni' && sep(L.Oni, L.Astria) <= 12) { w += 0.5; reasons.push('nouvelle lune'); }
    if (s === 'Oni' && sep(L.Oni, L.Astria) >= 168) { w += 0.5; reasons.push('pleine lune'); }
    return { sister: s, astre: ASTRE[s].name, lon: L[s], sign: SIGNS[signIdx], degree: Math.floor(L[s] % 30), weight: Math.max(0.5, w), reasons };
  });
}

/** Poids ramenés entre 0 et 1 (le plus fort = 1). */
export function acquisLevels(p: Placement[]): Record<SisterName, number> {
  const max = Math.max(...p.map((x) => x.weight));
  return Object.fromEntries(p.map((x) => [x.sister, x.weight / max])) as Record<SisterName, number>;
}
