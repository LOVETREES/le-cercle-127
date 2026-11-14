// « Mon chemin » : le chemin d'individuation (Jung) porté par les Sept Sœurs, autour du Soi.
// Chaque Sœur veille sur une part du chemin ; son indice d'évolution vient de ce que la personne fait déjà
// dans le Cercle. Le calcul est pur (testé) ; loadChemin() rassemble les données gardées sur l'appareil.
import type { Dream } from './model';

export type SisterSlug = 'oni' | 'alka' | 'naia' | 'terra' | 'ignis' | 'astria' | 'irma';
export type Level = 0 | 1 | 2 | 3; // à éveiller, graine, pousse, arbre
export const LEVEL_LABEL = ['À éveiller', 'Graine', 'Pousse', 'Arbre'] as const;

export type Tool = { title: string; sub: string; route: string };
export type Station = {
  slug: SisterSlug;
  name: string;
  verb: string;
  color: string;
  /** La rencontre du chemin (Jung) à laquelle la Sœur appartient. */
  meeting: 1 | 2 | 3 | 4;
  role: string;
  /** Unité de l'indice : « {n} rêves gardés »… */
  unit: [string, string];
  thresholds: [number, number, number];
  tools: Tool[];
  next: string;
};

export const MEETINGS: { n: 1 | 2 | 3 | 4; title: string; text: string }[] = [
  { n: 1, title: 'Accueillir l’inconscient', text: 'Écouter ce que disent tes rêves et repérer ce qui revient.' },
  { n: 2, title: 'Traverser l’Ombre', text: 'Rencontrer les émotions et les parts de toi que tu évites, et les ancrer dans le corps.' },
  { n: 3, title: 'Transformer', text: 'Passer de la compréhension au geste, et entendre ce qui t’appelle.' },
  { n: 4, title: 'Le Soi qui choisit', text: 'Faire des choix fidèles à qui tu es vraiment.' },
];

export const STATIONS: Station[] = [
  {
    slug: 'oni', name: 'Oni', verb: 'Lire', color: '#d9cdfb', meeting: 1,
    role: 'Tes rêves sont les lettres de ton inconscient. Oni t’aide à les garder et à les lire : c’est la porte d’entrée de tout le chemin.',
    unit: ['{n} rêve gardé', '{n} rêves gardés'], thresholds: [1, 5, 15],
    tools: [
      { title: 'Raconter un rêve', sub: 'Au clavier ou à voix haute', route: '/reve' },
      { title: 'Mes lectures', sub: 'Lecture du jour et Perle d’Oni', route: '/mes-lectures' },
      { title: 'Carnet vocal', sub: 'Garder ta voix au réveil', route: '/carnet-vocal' },
    ],
    next: 'Note ton prochain rêve dès le réveil, avant qu’il ne s’efface.',
  },
  {
    slug: 'alka', name: 'Alka', verb: 'Relier', color: '#a9c2f7', meeting: 1,
    role: 'Ce qui revient d’un rêve à l’autre insiste en toi. Alka relie les symboles et les motifs pour montrer ce qui cherche à être vu.',
    unit: ['{n} motif qui revient', '{n} motifs qui reviennent'], thresholds: [1, 3, 6],
    tools: [
      { title: 'Mon parcours onirique', sub: 'Ce qui revient, ce qui change', route: '/parcours' },
      { title: 'Dictionnaire des symboles', sub: '3 900 symboles', route: '/symboles' },
      { title: 'Mon Grimoire', sub: 'Tous tes rêves reliés', route: '/grimoire' },
    ],
    next: 'Ouvre ton parcours et regarde le symbole qui revient le plus.',
  },
  {
    slug: 'naia', name: 'Naïa', verb: 'Apaiser', color: '#8fdad3', meeting: 2,
    role: 'L’émotion du réveil montre souvent ton Ombre : ce que tu n’oses pas encore regarder. Naïa t’aide à la nommer sans t’y noyer.',
    unit: ['{n} émotion nommée', '{n} émotions nommées'], thresholds: [1, 7, 21],
    tools: [
      { title: 'Ton émotion du jour', sub: 'Sur l’accueil, avec Naïa', route: '/' },
      { title: 'Apprendre et explorer', sub: 'Cauchemar : comprendre et s’apaiser', route: '/explorer' },
    ],
    next: 'Nomme l’émotion avec laquelle tu t’es réveillé·e ce matin.',
  },
  {
    slug: 'terra', name: 'Terra', verb: 'Enraciner', color: '#a9c98a', meeting: 2,
    role: 'Ce que le rêve révèle doit descendre dans le corps pour devenir réel. Terra te ramène à tes mains, à ton souffle, au sol.',
    unit: ['{n} lecture de la main', '{n} lectures de la main'], thresholds: [1, 4, 10],
    tools: [{ title: 'Ta main du jour', sub: 'Ce que ta main dit aujourd’hui', route: '/lecture-main' }],
    next: 'Pose ta main et écoute ce que Terra en lit aujourd’hui.',
  },
  {
    slug: 'ignis', name: 'Ignis', verb: 'Agir', color: '#eb9a68', meeting: 3,
    role: 'Une prise de conscience sans geste reste une idée. Ignis transforme ce que tu as compris en un acte, même tout petit.',
    unit: ['{n} geste accompli', '{n} gestes accomplis'], thresholds: [1, 4, 10],
    tools: [
      { title: 'Les gestes du Labyrinthe', sub: 'Un geste proposé par ton bilan', route: '/labyrinthe' },
      { title: 'Laboratoire des rêveurs', sub: 'Des exercices simples', route: '/explorer' },
    ],
    next: 'Choisis un geste de cinq minutes inspiré de ton dernier rêve.',
  },
  {
    slug: 'astria', name: 'Astria', verb: 'Orienter', color: '#f2dea8', meeting: 3,
    role: 'Derrière tes rêves, une direction se dessine : ce qui t’appelle à devenir. Astria met en regard ton ciel de naissance et ta semaine vécue.',
    unit: ['{n} bilan de la semaine', '{n} bilans de la semaine'], thresholds: [1, 3, 8],
    tools: [{ title: 'Le Labyrinthe vivant', sub: 'Ton ciel et ta semaine', route: '/labyrinthe' }],
    next: 'Fais ton bilan de la semaine dans le Labyrinthe : deux minutes.',
  },
  {
    slug: 'irma', name: 'Irma', verb: 'Choisir', color: '#f3f1fb', meeting: 4,
    role: 'Le chemin aboutit à des choix faits en conscience, fidèles à qui tu es. Irma éclaire tes décisions sans jamais les prendre à ta place.',
    unit: ['{n} tirage pour éclairer un choix', '{n} tirages pour éclairer un choix'], thresholds: [1, 5, 15],
    tools: [
      { title: 'Oracle 127', sub: 'Une carte pour éclairer un choix', route: '/oracle' },
      { title: 'Apprendre et explorer', sub: 'Les 127 portes', route: '/explorer' },
    ],
    next: 'Tire une carte sur la décision qui t’occupe en ce moment.',
  },
];

/** Dates (ISO ou AAAA-MM-JJ) de ce que la personne a fait, par Sœur ; pour Alka, le nombre de motifs. */
export type CheminInput = {
  dreams: string[];
  motifs: number;
  motifDreams: string[];
  emotions: string[];
  palms: string[];
  gestes: string[];
  bilans: string[];
  draws: string[];
};

export type StationState = Station & {
  count: number;
  level: Level;
  /** Activité des 6 dernières semaines, de la plus ancienne à la plus récente. */
  weeks: number[];
  trend: 'up' | 'steady' | 'calm' | 'none';
};

export type Chemin = { stations: StationState[]; awakened: number; selfShare: number; nextIndex: number };

const DAY = 86400000;

/** Activité par semaine glissante (7 jours), sur `n` semaines se terminant aujourd'hui. */
export function weekly(dates: string[], now = new Date(), n = 6): number[] {
  const end = now.getTime();
  const out = new Array(n).fill(0);
  for (const d of dates) {
    const t = Date.parse(d.length === 10 ? d + 'T12:00:00' : d);
    if (!Number.isFinite(t) || t > end + DAY) continue;
    const w = Math.floor((end - t) / (7 * DAY));
    if (w >= 0 && w < n) out[n - 1 - w] += 1;
  }
  return out;
}

export function levelFor(count: number, th: [number, number, number]): Level {
  return count >= th[2] ? 3 : count >= th[1] ? 2 : count >= th[0] ? 1 : 0;
}

export function trendOf(weeks: number[]): StationState['trend'] {
  const recent = weeks.slice(-3).reduce((a, b) => a + b, 0);
  const before = weeks.slice(0, 3).reduce((a, b) => a + b, 0);
  if (!recent && !before) return 'none';
  if (recent > before) return 'up';
  if (recent === before) return 'steady';
  return 'calm';
}

export function computeChemin(input: CheminInput, now = new Date()): Chemin {
  const src: Record<SisterSlug, { count: number; dates: string[] }> = {
    oni: { count: input.dreams.length, dates: input.dreams },
    alka: { count: input.motifs, dates: input.motifDreams },
    naia: { count: input.emotions.length, dates: input.emotions },
    terra: { count: input.palms.length, dates: input.palms },
    ignis: { count: input.gestes.length, dates: input.gestes },
    astria: { count: input.bilans.length, dates: input.bilans },
    irma: { count: input.draws.length, dates: input.draws },
  };
  const stations = STATIONS.map((s) => {
    const { count, dates } = src[s.slug];
    const weeks = weekly(dates, now);
    return { ...s, count, level: levelFor(count, s.thresholds), weeks, trend: trendOf(weeks) };
  });
  const total = stations.reduce((n, s) => n + s.level, 0);
  // Prochain pas : la première Sœur du chemin la moins éveillée (le chemin se parcourt dans l'ordre, en spirale).
  const min = Math.min(...stations.map((s) => s.level));
  return {
    stations,
    awakened: stations.filter((s) => s.level > 0).length,
    selfShare: Math.round((total / (3 * stations.length)) * 100),
    nextIndex: stations.findIndex((s) => s.level === min),
  };
}

/** Rassemble les données déjà gardées par l'application (rien de nouveau n'est collecté). */
export async function loadChemin(dreams: Dream[], recurring: [string, number][], now = new Date()): Promise<Chemin> {
  const [{ listEmotions }, { listPalmReadings }, store, { listDraws }] = await Promise.all([
    import('./naia'),
    import('./palm'),
    import('./labyrinthe/store'),
    import('./oracle/history'),
  ]);
  const safe = async <T,>(p: Promise<T>, f: T) => p.catch(() => f);
  const [emotions, palms, gestes, bilans, draws] = await Promise.all([
    safe(listEmotions(), []),
    safe(listPalmReadings(), []),
    safe(store.listGestes(), []),
    safe(store.listBilans(), []),
    safe(listDraws(), []),
  ]);
  const motifSet = new Set(recurring.map(([s]) => s.toLowerCase()));
  return computeChemin({
    dreams: dreams.map((d) => d.dreamDate),
    motifs: recurring.length,
    motifDreams: dreams.filter((d) => (d.symbols ?? []).some((s) => motifSet.has(s.toLowerCase()))).map((d) => d.dreamDate),
    emotions: emotions.map((e) => e.at || e.day),
    palms: palms.map((p) => p.at),
    gestes,
    bilans: bilans.map((b) => b.at),
    draws: draws.map((d) => d.at),
  }, now);
}
