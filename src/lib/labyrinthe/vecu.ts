// LE VÉCU : ce que la personne pratique vraiment (30 derniers jours) et ce qu'elle en dit (bilan de la semaine).
// La rencontre ACQUIS / VÉCU donne une phrase, la porte de naissance et la porte du moment.
import { lameByMask, type Lame } from '../oracle/engine';
import { ORDER, type SisterName } from './acquis';

export type Levels = Record<SisterName, number>;
export type Counts = Record<SisterName, number>;

/** Ce qui nourrit chaque Sœur, et le nombre d'actes (sur 30 jours) qui donne ≈ 63 % du niveau. */
export const SOURCES: Record<SisterName, { what: string; k: number }> = {
  Oni: { what: 'rêves notés', k: 6 },
  Alka: { what: 'motifs qui reviennent', k: 3 },
  Naïa: { what: 'émotions accueillies', k: 8 },
  Terra: { what: 'lectures de la main', k: 2 },
  Ignis: { what: 'gestes accomplis', k: 4 },
  Astria: { what: 'pages de journal', k: 6 },
  Irma: { what: 'tirages gardés', k: 4 },
};

/** Les 7 questions du bilan de la semaine (0 = pas du tout … 4 = pleinement). */
export const QUESTIONS: Record<SisterName, string> = {
  Oni: 'Cette semaine, ai-je prêté attention à mes rêves et à mes images intérieures ?',
  Alka: 'Ai-je relié des choses qui se répètent dans ma vie ?',
  Naïa: 'Ai-je accueilli mes émotions sans les juger ?',
  Terra: 'Me suis-je appuyé·e sur mon corps, mes limites, mon sol ?',
  Ignis: 'Ai-je posé un acte au lieu d’attendre le moment parfait ?',
  Astria: 'Ai-je gardé le cap vers ce qui compte pour moi ?',
  Irma: 'Ai-je fait un choix clair, même petit ?',
};

const sat = (n: number, k: number) => 1 - Math.exp(-Math.max(0, n) / k);

/** Niveau vécu de chaque Sœur (0 à 1) : la pratique, et le bilan de la semaine s'il existe (pour moitié). */
export function vecuLevels(counts: Counts, answers?: number[]): Levels {
  return Object.fromEntries(
    ORDER.map((s, i) => {
      const act = sat(counts[s] ?? 0, SOURCES[s].k);
      const a = answers?.[i];
      return [s, typeof a === 'number' ? 0.5 * act + 0.5 * Math.min(4, Math.max(0, a)) / 4 : act];
    }),
  ) as Levels;
}

/** Les Sœurs au-dessus du seuil forment une combinaison : une porte parmi les 127 (jamais vide). */
export function maskOf(l: Levels, threshold = 0.6): number {
  let m = 0;
  ORDER.forEach((s, i) => { if (l[s] >= threshold) m |= 1 << i; });
  if (!m) {
    const best = ORDER.reduce((a, s) => (l[s] > l[a] ? s : a), ORDER[0]);
    m = 1 << ORDER.indexOf(best);
  }
  return m;
}
export const doorOf = (l: Levels, threshold?: number): Lame => lameByMask(maskOf(l, threshold));

export type Phrase = { k: string; v?: Record<string, string> };
export type Reading = { strongSky: SisterName; strongLife: SisterName; next?: SisterName; beyond?: SisterName; text: Phrase[] };

/** La lecture de la rencontre ACQUIS / VÉCU, en quelques phrases tirées des données. */
export function readMeeting(a: Levels, v: Levels): Reading {
  const top = (l: Levels) => ORDER.reduce((x, s) => (l[s] > l[x] ? s : x), ORDER[0]);
  const strongSky = top(a);
  const strongLife = top(v);
  const next = ORDER.filter((s) => a[s] >= 0.6).sort((x, y) => a[y] - v[y] - (a[x] - v[x]))[0];
  const beyond = ORDER.filter((s) => v[s] >= 0.6 && a[s] < 0.6).sort((x, y) => v[y] - v[x])[0];
  const text: Phrase[] = [];
  if (Math.max(...ORDER.map((s) => v[s])) < 0.15) {
    text.push({ k: 'Ton ciel met {a} en avant. Ton chemin vécu ne fait que commencer : chaque rêve, émotion ou geste noté y laissera une trace.', v: { a: strongSky } });
  } else if (strongSky === strongLife) {
    text.push({ k: 'Ton ciel met {a} en avant, et c’est aussi par elle que passe ton chemin ce mois-ci : tu vis ce que tu portes.', v: { a: strongSky } });
  } else {
    text.push({ k: 'Ton ciel met {a} en avant, mais ce mois-ci ton chemin passe surtout par {b}.', v: { a: strongSky, b: strongLife } });
  }
  if (next && a[next] - v[next] > 0.25) text.push({ k: 'Le pas suivant : un petit geste avec {s}, qui t’est donnée dès la naissance mais que tu pratiques peu en ce moment.', v: { s: next } });
  if (beyond) text.push({ k: '{s} ne domine pas ton ciel, et pourtant tu la fais vivre : ce qui s’acquiert compte autant que ce qui est donné.', v: { s: beyond } });
  return { strongSky, strongLife, next, beyond, text };
}

/** Semaine ISO (AAAA-Www) d'une date, pour ranger les bilans. */
export function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${String(w).padStart(2, '0')}`;
}
