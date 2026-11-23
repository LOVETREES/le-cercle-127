import type { JournalEntry } from './journal-intime';

export const SISTER_ECHOES: Record<string, string> = {
  oni: 'L’Ombre : éclairer les images que l’on redoute ou évite.',
  naia: 'L’Anima et l’Animus : accueillir sa sensibilité, ses émotions et son intuition.',
  terra: 'La Terre nourricière : retrouver le corps, le vivant et ses appuis.',
  irma: 'L’Ombre : regarder avec discernement ce que l’on évite.',
  astria: 'La Boussole intérieure : relier son expérience à un sens plus vaste.',
  ignis: 'Le Créateur : traverser une difficulté et choisir un geste possible.',
  alka: 'Le Soi : relier les différentes facettes de son expérience, sans chercher à être parfait·e.',
};

export const FAMILIES = [
  { key: 'ombre', title: 'L’Ombre', words: ['fuite', 'fuir', 'fuis', 'peur', 'peurs', 'enferme', 'enfermee', 'enfermement'], question: 'Qu’aimerais-tu regarder avec douceur plutôt que fuir ?', sisters: ['oni', 'irma'] },
  { key: 'exploration', title: 'L’Explorateur · la Boussole', words: ['quete', 'quetes', 'voyage', 'voyages', 'voyager', 'etoile', 'etoiles', 'choix', 'choisir'], question: 'Quel choix ou quel horizon te semble important en ce moment ?', sisters: ['astria'] },
  { key: 'elan', title: 'Le Bâtisseur · le Créateur', words: ['combat', 'combats', 'combattre', 'feu', 'feux', 'blocage', 'blocages', 'bloque', 'bloquee', 'colere', 'coleres'], question: 'Quel petit geste pourrait t’aider à avancer sans te brusquer ?', sisters: ['ignis'] },
] as const;

export function archetypalEchoes(entries: Pick<JournalEntry, 'text'>[]) {
  // listEntries fournit les pages de la plus récente à la plus ancienne.
  const recent = entries.slice(0, 15);
  return FAMILIES.map((family) => {
    const foundWords = new Set<string>();
    const matched = recent.filter((entry) => {
      const tokens = new Set(entry.text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z]+/g) ?? []);
      const words = family.words.filter((word) => tokens.has(word));
      words.forEach((word) => foundWords.add(word));
      return words.length > 0;
    }).length;
    return { ...family, matched, foundWords: [...foundWords].slice(0, 4) };
  }).filter((family) => family.matched >= 2).sort((a, b) => b.matched - a.matched);
}

const MIRRORS: Record<string, { name: string; question: string }> = {
  Oni: { name: 'Le Veilleur', question: 'Quelle image demande un peu de ton attention ?' },
  Alka: { name: 'La Tisseuse', question: 'Quel lien aimerais-tu regarder autrement ?' },
  Naïa: { name: 'La Source', question: 'Quelle émotion aimerais-tu accueillir avec douceur ?' },
  Terra: { name: 'La Gardienne', question: 'Quel appui concret te ferait du bien aujourd’hui ?' },
  Ignis: { name: 'L’Alchimiste', question: 'Quel petit geste peut donner une forme à ton élan ?' },
  Astria: { name: 'L’Étoile', question: 'Quel horizon te donne envie d’avancer ?' },
  Irma: { name: 'Le Passeur', question: 'Quel seuil aimerais-tu franchir à ton rythme ?' },
};

/** Correspondance symbolique avec la première Sœur associée à la carte. */
export function mirrorForSister(sister?: string) { return sister ? MIRRORS[sister] : undefined; }
