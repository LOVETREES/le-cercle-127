// Oni lit le récit et choisit au plus trois questions facultatives qui peuvent vraiment éclairer
// SON rêve (pas un questionnaire). Tout se décide sur l'appareil, sans envoi.
// « Je ne cherche pas à tout savoir de vous. Je cherche à comprendre ce que votre rêve signifie pour vous. »
import type { Emotion } from './model';

export type QuestionKind = 'reconnaissance' | 'personne' | 'recurrence' | 'emotion' | 'contexte';
export type OniQuestion = {
  id: string;
  kind: QuestionKind;
  label: string; // « Reconnaissance », « Émotion »…
  text: string;
  options?: string[]; // réponses rapides (facultatives)
  multi?: boolean;
  setsEmotion?: boolean; // les options sont des émotions du rêve
};
export type OniAnswer = { id: string; choices: string[]; text: string };

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const PLACE = /\b(maison|appartement|chambre|ecole|college|lycee|ville|village|immeuble|batiment|hotel|eglise|chateau|hopital|bureau|gare|magasin|endroit|lieu|piece|grenier|cave)\b/;
const UNKNOWN_PLACE = /(ne connais(sais)? pas|inconnu|jamais vu|etrange|bizarre)/;
const PERSON = /\b(mere|pere|maman|papa|ami|amie|copain|copine|ex|frere|soeur|enfant|bebe|fils|fille|collegue|patron|patronne|chef|mari|epoux|epouse|femme|compagnon|compagne|grand-mere|grand-pere|mamie|papi|oncle|tante|cousin|cousine|voisin|voisine|prof|professeur)\b/;
const RECURRENT = /(encore ce reve|meme reve|deja reve|recurrent|revient souvent|toujours le meme|une nouvelle fois|encore une fois|a nouveau)/;
const ANXIOUS = /(peur|angoiss|poursuiv|pourchass|tomb|chute|mort|mourir|cri|cauchemar|panique|fuir|fuyais|attaqu|noy|perdu|bloque|enferme|paralys)/;
const PASSAGE = /\b(porte|portes|cle|fenetre|escalier|escaliers|couloir|chemin|route|pont|seuil|ascenseur)\b/;
const HEAVY: Emotion[] = ['peur', 'tristesse', 'colere', 'confusion'];

export const LIFE_AREAS = ['Relations et famille', 'Travail et projets', 'Changement de vie', 'Émotions et bien-être', 'Aspirations et décisions', 'Autre'];
export const DREAM_FEELINGS: { label: string; emotion: Emotion }[] = [
  { label: 'Peur / angoisse', emotion: 'peur' },
  { label: 'Tristesse', emotion: 'tristesse' },
  { label: 'Colère', emotion: 'colere' },
  { label: 'Confusion', emotion: 'confusion' },
  { label: 'Sérénité', emotion: 'serenite' },
  { label: 'Joie', emotion: 'joie' },
  { label: 'Émerveillement', emotion: 'emerveillement' },
];

/** Les questions qu'Oni choisit pour ce récit, de la plus utile à la moins utile (3 au plus). */
export function oniQuestions(story: string, emotion?: Emotion): OniQuestion[] {
  const s = norm(story);
  const picks: OniQuestion[] = [];

  // 1. Reconnaissance : un lieu ou une personne du rêve renvoie-t-il à la vie éveillée ?
  const place = s.match(PLACE)?.[1];
  const person = s.match(PERSON)?.[1];
  if (place && (UNKNOWN_PLACE.test(s) || !person)) {
    picks.push({
      id: 'lieu', kind: 'reconnaissance', label: 'Reconnaissance',
      text: UNKNOWN_PLACE.test(s) ? 'Ce lieu inconnu vous rappelle-t-il quand même un endroit réel ou une période de votre vie ?' : 'Ce lieu vous rappelle-t-il un endroit réel ou une période de votre vie ?',
      options: ['Un lieu que je connais', 'Une période de ma vie', 'Ça ne me dit rien'],
    });
  } else if (person) {
    picks.push({
      id: 'personne', kind: 'personne', label: 'Reconnaissance',
      text: 'Quelle place cette personne occupe-t-elle dans votre vie en ce moment ?',
      options: ['Très proche', 'Quelqu’un du passé', 'Une relation compliquée', 'Je ne la connais pas'],
    });
  }

  // 2. Récurrence, sinon émotion : ce qui manque le plus pour lire le rêve.
  if (RECURRENT.test(s)) {
    picks.push({
      id: 'recurrence', kind: 'recurrence', label: 'Récurrence',
      text: 'Depuis quand ce rêve revient-il ? Que se passait-il dans votre vie la première fois ?',
      options: ['Depuis l’enfance', 'Depuis quelques années', 'Depuis peu'],
    });
  } else if (!emotion || emotion === 'aucune' || emotion === 'autre') {
    picks.push({
      id: 'emotion', kind: 'emotion', label: 'Émotion',
      text: PASSAGE.test(s) ? 'Comment vous sentiez-vous devant ce passage (porte, chemin, escalier…) ?' : 'Quelle émotion vous a accompagné·e dans ce rêve, jusqu’au réveil ?',
      options: DREAM_FEELINGS.map((f) => f.label), setsEmotion: true,
    });
  } else if (ANXIOUS.test(s) || HEAVY.includes(emotion)) {
    picks.push({
      id: 'moment', kind: 'emotion', label: 'Émotion',
      text: 'À quel moment du rêve ce que vous ressentiez était-il le plus fort ? Et au réveil, qu’en restait-il ?',
    });
  } else if (PASSAGE.test(s)) {
    picks.push({ id: 'passage', kind: 'emotion', label: 'Émotion', text: 'Que ressentiez-vous devant ce passage (porte, chemin, escalier…) ? Vouliez-vous le franchir ?' });
  }

  // 3. Contexte de vie : toujours la dernière, toujours facultative.
  picks.push({
    id: 'contexte', kind: 'contexte', label: 'Contexte',
    text: 'Vivez-vous en ce moment quelque chose qui pourrait résonner avec ce rêve ?',
    options: LIFE_AREAS, multi: true,
  });
  return picks.slice(0, 3);
}

/** L'émotion déduite d'une réponse rapide (« Peur / angoisse » → peur). */
export function emotionFromAnswer(q: OniQuestion, a?: OniAnswer): Emotion | undefined {
  if (!q.setsEmotion || !a?.choices.length) return undefined;
  return DREAM_FEELINGS.find((f) => f.label === a.choices[0])?.emotion;
}

export const CONTEXT_MARK = '— Précisions pour Oni —';

/**
 * Le récit contextualisé : les réponses sont jointes au rêve, à part, pour qu'Oni les lise avec lui.
 * Les questions passées sont simplement omises. `tr` traduit les libellés (les réponses restent telles quelles).
 */
export function withContext(story: string, questions: OniQuestion[], answers: OniAnswer[], tr: (s: string) => string = (s) => s): string {
  const lines: string[] = [];
  for (const q of questions) {
    const a = answers.find((x) => x.id === q.id);
    if (!a) continue;
    const reply = [a.choices.map(tr).join(', '), a.text.trim()].filter(Boolean).join(' — ');
    if (reply) lines.push(`• ${tr(q.text)}\n  ${reply}`);
  }
  const base = story.trim();
  return lines.length ? `${base}\n\n${tr(CONTEXT_MARK)}\n${lines.join('\n')}` : base;
}

/** Sépare le récit de ses précisions (pour l'affichage). */
export function splitContext(story: string): { story: string; context?: string } {
  const i = story.search(/\n\n— (Précisions pour Oni|Notes for Oni|Precisiones para Oni|Precisazioni per Oni|Hinweise für Oni) —\n/);
  return i < 0 ? { story } : { story: story.slice(0, i), context: story.slice(i + 2) };
}
