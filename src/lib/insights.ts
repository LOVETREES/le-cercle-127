// Mesures d'évolution et pensée du jour, calculées sur l'appareil à partir des rêves de la personne.
import { EMOTIONS, type Dream } from './model';

export type MonthStat = { key: string; label: string; count: number; avgIntensity?: number };

export type Journey = {
  total: number;
  recurring: [string, number][];
  /** Nombre total de motifs récurrents (la liste `recurring` n'en garde que les premiers). */
  recurringCount: number;
  months: MonthStat[];
  emotions: { label: string; count: number }[];
  longestStreak: number;
  currentStreak: number;
  calmShare?: { before: number; after: number };
};

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const CALM = new Set(['joie', 'serenite', 'emerveillement']);

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Symboles et émotions qui reviennent au moins deux fois. */
export function recurringMotifs(dreams: Dream[], limit = 8): [string, number][] {
  return allRecurringMotifs(dreams).slice(0, limit);
}

/** Tous les motifs revenus au moins deux fois (sans tenir compte des majuscules), du plus fréquent au moins fréquent. */
export function allRecurringMotifs(dreams: Dream[]): [string, number][] {
  const counts = new Map<string, [string, number]>();
  for (const d of dreams) {
    const seen = new Set<string>();
    for (const s of d.symbols ?? []) {
      const label = s.trim();
      const k = label.toLowerCase();
      if (label && !seen.has(k)) {
        seen.add(k);
        const prev = counts.get(k);
        counts.set(k, [prev?.[0] ?? label, (prev?.[1] ?? 0) + 1]);
      }
    }
  }
  return [...counts.values()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Jours consécutifs avec au moins un rêve noté (série la plus longue et série en cours). */
export function streaks(dates: string[], today = new Date()): { longest: number; current: number } {
  const days = [...new Set(dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort();
  let longest = 0;
  let run = 0;
  let prev: number | undefined;
  for (const d of days) {
    const t = Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86400000;
    run = prev !== undefined && t - prev === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = t;
  }
  const set = new Set(days);
  let current = 0;
  const cursor = new Date(today);
  if (!set.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1); // la série du jour peut encore commencer ce matin
  while (set.has(dayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { longest, current };
}

export function journey(dreams: Dream[], today = new Date()): Journey {
  const months: MonthStat[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const inMonth = dreams.filter((x) => x.dreamDate.startsWith(key));
    const intens = inMonth.map((x) => x.intensity).filter((n): n is number => typeof n === 'number');
    months.push({
      key,
      label: MONTHS[d.getMonth()],
      count: inMonth.length,
      avgIntensity: intens.length ? Math.round((intens.reduce((a, b) => a + b, 0) / intens.length) * 10) / 10 : undefined,
    });
  }
  const emo = new Map<string, number>();
  for (const d of dreams) if (d.emotion && d.emotion !== 'aucune') emo.set(d.emotion, (emo.get(d.emotion) ?? 0) + 1);
  const emotions = [...emo.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([v, count]) => ({ label: EMOTIONS.find((e) => e.value === v)?.label ?? v, count }));

  // Part de rêves apaisés : première moitié de l'historique comparée à la seconde.
  const dated = dreams.filter((d) => d.emotion && d.emotion !== 'aucune').sort((a, b) => a.dreamDate.localeCompare(b.dreamDate));
  let calmShare: Journey['calmShare'];
  if (dated.length >= 4) {
    const half = Math.floor(dated.length / 2);
    const share = (xs: Dream[]) => Math.round((xs.filter((d) => CALM.has(d.emotion as string)).length / xs.length) * 100);
    calmShare = { before: share(dated.slice(0, half)), after: share(dated.slice(half)) };
  }
  const { longest, current } = streaks(dreams.map((d) => d.dreamDate), today);
  const allRecurring = allRecurringMotifs(dreams);
  return { total: dreams.length, recurring: allRecurring.slice(0, 8), recurringCount: allRecurring.length, months, emotions, longestStreak: longest, currentStreak: current, calmShare };
}

/** Ajoute aujourd'hui aux jours de présence (sans doublon, 400 jours gardés au plus). */
export function addPresence(days: string[], today = new Date()): string[] {
  const k = dayKey(today);
  return days.includes(k) ? days : [...days, k].sort().slice(-400);
}

// Pensées du jour : bien-être et amour, une par jour, la même pour tout le monde ce jour-là.
export const DAILY_THOUGHTS: string[] = [
  'Tu n’as pas à mériter la douceur : offre-t’en un peu aujourd’hui.',
  'Ce que tu ressens a le droit d’exister. Accueille-le, puis respire.',
  'Aimer, c’est aussi s’écouter quand personne ne le fait.',
  'Chaque matin est une page blanche. Écris-y une intention tendre.',
  'Ta valeur ne se mesure pas à ce que tu accomplis aujourd’hui.',
  'Un pas lent reste un pas. Avance à ton rythme.',
  'Sois pour toi l’ami·e que tu es pour les autres.',
  'Le calme ne vient pas d’ailleurs : il naît d’un souffle, ici, maintenant.',
  'Tes rêves te parlent avec douceur. Écoute-les sans te juger.',
  'Il y a de la beauté dans ce que tu traverses, même si tu ne la vois pas encore.',
  'Laisse aujourd’hui un peu de place à ce qui te fait du bien.',
  'Tu as déjà survécu à tous tes jours difficiles. Tu es plus fort·e que tu ne le crois.',
  'L’amour commence par un regard bienveillant posé sur soi.',
  'Ralentis : ce qui est important ne s’envolera pas.',
  'Une gratitude par jour suffit à éclairer une vie entière.',
  'Tu peux être en chemin et déjà entier·ère.',
  'Pardonne-toi d’avoir appris lentement : tu as appris.',
  'Ce que tu arroses grandit. Choisis ce que tu nourris aujourd’hui.',
  'Ton corps te porte depuis toujours. Remercie-le d’un geste doux.',
  'L’amour que tu donnes revient souvent par des chemins inattendus.',
  'Respire profondément : tu es exactement là où tu dois être.',
  'Tes émotions sont des messagères, pas des ennemies.',
  'Ose dire non à ce qui t’éteint, et oui à ce qui t’éclaire.',
  'La nuit prépare toujours le jour. Aie confiance en ton rythme.',
  'Un sourire offert à soi-même est déjà un soin.',
  'Ce qui se répète dans tes rêves t’invite à grandir, pas à t’inquiéter.',
  'Tu mérites un amour qui te laisse respirer, à commencer par le tien.',
  'Prends soin de toi comme on prend soin d’un jardin : patiemment.',
  'La lumière que tu cherches est déjà en toi.',
  'Aujourd’hui, choisis la douceur, envers toi et envers les autres.',
  'Chaque rêve noté est un pas de plus vers toi-même.',
];

export function dailyThought(today = new Date()): string {
  const start = Date.UTC(today.getFullYear(), 0, 0);
  const day = Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - start) / 86400000);
  return DAILY_THOUGHTS[(day + today.getFullYear()) % DAILY_THOUGHTS.length];
}
