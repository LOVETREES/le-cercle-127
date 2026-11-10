// L'ACQUIS : ce que le ciel de naissance met en avant, lu à travers les Sœurs (lecture symbolique).
// Chaque Sœur a son astre (correspondances du Cercle) ; son poids dépend de la place de cet astre :
// domicile, exaltation, exil, chute (dignités traditionnelles) et proximité des luminaires.
// Calcul local avec Astronomy Engine (licence MIT) : rien n'est envoyé.
import { Ecliptic, GeoVector, SiderealTime, type Body } from 'astronomy-engine';

import { villeByName } from './villes';

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

export type Birth = { date: string; time?: string; place?: string }; // AAAA-MM-JJ, HH:MM (heure locale du lieu), ville de la liste
export type Placement = { sister: SisterName; astre: string; lon: number; sign: string; degree: number; weight: number; reasons: string[] };

/** Décalage (ms) d'un fuseau IANA à un instant donné, heure d'été historique comprise. */
export function tzOffsetMs(instant: number, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(instant));
  const g = (t: string) => +(parts.find((p) => p.type === t)?.value ?? 0);
  return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'), g('second')) - Math.floor(instant / 1000) * 1000;
}

/** Heure murale d'un lieu → instant universel (deux passes pour les changements d'heure). */
export function zonedToUtc(y: number, mo: number, d: number, h: number, mi: number, tz: string): Date {
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  let utc = wall - tzOffsetMs(wall, tz);
  utc = wall - tzOffsetMs(utc, tz);
  return new Date(utc);
}

export function birthInstant(b: Birth): Date | undefined {
  const m = b.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return undefined;
  const t = b.time?.match(/^(\d{1,2}):(\d{2})$/);
  if (t && (+t[1] > 23 || +t[2] > 59)) return undefined;
  // Sans heure : midi, l'erreur reste faible pour tous les astres sauf la Lune (≈ 6° au plus).
  const [h, mi] = t ? [+t[1], +t[2]] : [12, 0];
  const ville = villeByName(b.place);
  let d: Date;
  try {
    d = ville ? zonedToUtc(+m[1], +m[2], +m[3], h, mi, ville.tz) : new Date(+m[1], +m[2] - 1, +m[3], h, mi);
  } catch {
    d = new Date(+m[1], +m[2] - 1, +m[3], h, mi);
  }
  return Number.isNaN(d.getTime()) || +m[1] < 1900 || d > new Date() ? undefined : d;
}

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const rad = Math.PI / 180;

/** Ascendant et milieu du ciel (longitudes écliptiques), à partir de l'instant et du lieu. */
export function angles(when: Date, lat: number, lon: number): { asc: number; mc: number } {
  const ramc = norm360((SiderealTime(when) + lon / 15) * 15) * rad;
  const T = (when.getTime() / 86400000 + 2440587.5 - 2451545) / 36525;
  const eps = (23.4392911 - 0.0130042 * T) * rad;
  const mc = norm360(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / rad);
  const asc = norm360(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat * rad) * Math.sin(eps))) / rad);
  return { asc, mc };
}

export type Angles = { asc: number; mc: number; ascSign: string; mcSign: string };
export function birthAngles(b: Birth): Angles | undefined {
  const ville = villeByName(b.place);
  const when = birthInstant(b);
  if (!ville || !b.time || !when) return undefined;
  const { asc, mc } = angles(when, ville.lat, ville.lon);
  return { asc, mc, ascSign: SIGNS[Math.floor(asc / 30)], mcSign: SIGNS[Math.floor(mc / 30)] };
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
  const ang = birthAngles(b);
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
    if (ang) {
      // Un astre sur un angle du ciel (à 8° près) est mis en avant.
      const near = [[ang.asc, 'sur l’ascendant'], [norm360(ang.asc + 180), 'au descendant'], [ang.mc, 'au milieu du ciel'], [norm360(ang.mc + 180), 'au fond du ciel']] as const;
      const hit = near.find(([x]) => sep(L[s], x) <= 8);
      if (hit) { w += 1; reasons.push(hit[1]); }
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
