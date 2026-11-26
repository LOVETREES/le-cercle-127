// Naïa, Gardienne des Émotions : nommer ce qui traverse, entendre le besoin, retrouver un mouvement.
// Reprend le « Rituel du Lac intérieur » du site (nommer, localiser, écouter, choisir, réconcilier).
import { currentOwner } from './palm';
import { KEYS, local } from './storage';
import { dayKey } from './insights';

export type EmotionKey = 'peur' | 'colere' | 'tristesse' | 'culpabilite' | 'confusion' | 'soulagement' | 'joie' | 'serenite' | 'anxiete' | 'honte' | 'solitude' | 'frustration' | 'fatigue' | 'gratitude';

export type Emotion = {
  key: EmotionKey;
  sign: string;
  color: string;
  name: string;
  need: string;
  body: string;
  gesture: string;
  phrase: string;
};

// Textes en français : ce sont aussi les clés de traduction.
export const EMOTIONS: Emotion[] = [
  {
    key: 'peur', sign: '◇', color: '#a9c2f7', name: 'La peur',
    need: 'Ce que ton corps cherche encore à protéger : un besoin de sécurité.',
    body: 'Souvent un ventre noué, une respiration haute, des épaules qui montent.',
    gesture: 'Pose une main sur le ventre. Expire plus longtemps que tu n’inspires, cinq fois.',
    phrase: 'Dans cet instant, je suis en sécurité. Je peux avancer pas à pas.',
  },
  {
    key: 'colere', sign: '△', color: '#eb9a68', name: 'La colère',
    need: 'Une limite ou un besoin qui n’a pas été entendu.',
    body: 'Souvent une chaleur, des mâchoires serrées, une énergie dans les bras.',
    gesture: 'Presse tes paumes l’une contre l’autre dix secondes, puis relâche. Trois fois.',
    phrase: 'Ma colère protège une limite. Je peux la dire sans me blesser ni blesser.',
  },
  {
    key: 'tristesse', sign: '≈', color: '#8fdad3', name: 'La tristesse',
    need: 'Une perte, une séparation ou un manque qui demande à être reconnu.',
    body: 'Souvent une gorge serrée, une poitrine lourde, une envie de se replier.',
    gesture: 'Croise les bras sur la poitrine, comme une étreinte. Respire lentement et laisse venir.',
    phrase: 'J’ai le droit d’être triste. Ce que j’ai aimé compte.',
  },
  {
    key: 'culpabilite', sign: '○', color: '#d9cdfb', name: 'La culpabilité',
    need: 'Distinguer ce qui relève de ta responsabilité de ce qui est une charge héritée.',
    body: 'Souvent un poids sur les épaules, un regard qui se baisse.',
    gesture: 'Note sur deux colonnes : « ce qui m’appartient » et « ce qui ne m’appartient pas ».',
    phrase: 'Je prends ma part, et je dépose le reste.',
  },
  {
    key: 'confusion', sign: '∞', color: '#f2dea8', name: 'La confusion',
    need: 'Plusieurs émotions contradictoires cohabitent : il faut un peu d’espace.',
    body: 'Souvent une tête pleine, une agitation, du mal à se poser.',
    gesture: 'Nomme trois choses que tu vois, deux que tu entends, une que tu touches.',
    phrase: 'Je n’ai pas besoin de tout comprendre maintenant.',
  },
  {
    key: 'soulagement', sign: '✦', color: '#a9c98a', name: 'Le soulagement',
    need: 'Ce que ton psychisme semble enfin prêt à déposer.',
    body: 'Souvent des épaules qui descendent, un souffle qui s’allonge.',
    gesture: 'Trois respirations lentes, en remarquant ce qui s’est allégé.',
    phrase: 'Je laisse ce poids se poser.',
  },
{"key": "joie", "sign": "○", "color": "#8fdad3", "name": "La joie", "need": "Un élan à partager ou à savourer, sans obligation de rester joyeux.", "body": "Remarque ton souffle, ta posture et les sensations présentes, sans chercher à les changer.", "gesture": "Prends un instant pour nommer ce qui te fait du bien aujourd’hui.", "phrase": "Je peux accueillir ce que je ressens et choisir un petit geste qui me respecte."},

{"key": "serenite", "sign": "○", "color": "#8fdad3", "name": "La sérénité", "need": "Peut-être un besoin de préserver cet espace de calme.", "body": "Remarque ton souffle, ta posture et les sensations présentes, sans chercher à les changer.", "gesture": "Repère une petite habitude qui soutient ton calme et garde-lui une place.", "phrase": "Je peux accueillir ce que je ressens et choisir un petit geste qui me respecte."},

{"key": "anxiete", "sign": "○", "color": "#8fdad3", "name": "L’anxiété", "need": "Peut-être un besoin de sécurité face à une incertitude.", "body": "Remarque ton souffle, ta posture et les sensations présentes, sans chercher à les changer.", "gesture": "Sens tes pieds au sol, puis choisis une seule chose sur laquelle tu peux agir.", "phrase": "Je peux accueillir ce que je ressens et choisir un petit geste qui me respecte."},

{"key": "honte", "sign": "○", "color": "#8fdad3", "name": "La honte", "need": "Peut-être un besoin d’accueil et de dignité, au-delà du regard des autres.", "body": "Remarque ton souffle, ta posture et les sensations présentes, sans chercher à les changer.", "gesture": "Écris une phrase bienveillante que tu dirais à un ami dans cette situation.", "phrase": "Je peux accueillir ce que je ressens et choisir un petit geste qui me respecte."},

{"key": "solitude", "sign": "○", "color": "#8fdad3", "name": "La solitude", "need": "Peut-être un besoin de lien, de présence ou d’être entendu.", "body": "Remarque ton souffle, ta posture et les sensations présentes, sans chercher à les changer.", "gesture": "Si tu le souhaites, envoie un petit message à une personne de confiance.", "phrase": "Je peux accueillir ce que je ressens et choisir un petit geste qui me respecte."},

{"key": "frustration", "sign": "○", "color": "#8fdad3", "name": "La frustration", "need": "Peut-être un besoin de progression, de choix ou d’une limite plus claire.", "body": "Remarque ton souffle, ta posture et les sensations présentes, sans chercher à les changer.", "gesture": "Distingue ce qui dépend de toi et choisis un pas réalisable aujourd’hui.", "phrase": "Je peux accueillir ce que je ressens et choisir un petit geste qui me respecte."},

{"key": "fatigue", "sign": "○", "color": "#8fdad3", "name": "La fatigue", "need": "Peut-être un besoin de repos ou de réduire les sollicitations.", "body": "Remarque ton souffle, ta posture et les sensations présentes, sans chercher à les changer.", "gesture": "Choisis une pause courte ou une tâche que tu peux remettre à plus tard.", "phrase": "Je peux accueillir ce que je ressens et choisir un petit geste qui me respecte."},

{"key": "gratitude", "sign": "○", "color": "#8fdad3", "name": "La gratitude", "need": "Peut-être l’envie de reconnaître un appui, un lien ou un moment précieux.", "body": "Remarque ton souffle, ta posture et les sensations présentes, sans chercher à les changer.", "gesture": "Note un détail précis que tu apprécies, sans nier ce qui reste difficile.", "phrase": "Je peux accueillir ce que je ressens et choisir un petit geste qui me respecte."},
];

export type EmotionEntry = { day: string; key: EmotionKey; at: string };

const keyFor = () => `${KEYS.emotions}:${currentOwner()}`;

export async function listEmotions(): Promise<EmotionEntry[]> {
  const list = await local.getJson<EmotionEntry[]>(keyFor(), []);
  return Array.isArray(list) ? list : [];
}

/** Garde l'émotion du jour (une par jour : la dernière choisie compte), 90 jours au plus. */
export async function recordEmotion(key: EmotionKey, now = new Date()): Promise<EmotionEntry[]> {
  const day = dayKey(now);
  const next = [{ day, key, at: now.toISOString() }, ...(await listEmotions()).filter((e) => e.day !== day)].slice(0, 90);
  await local.setJson(keyFor(), next);
  return next;
}

export async function clearEmotions(owner?: string): Promise<void> {
  await local.remove([owner ? `${KEYS.emotions}:${owner}` : keyFor()]);
}

/** Les 7 derniers jours, du plus ancien à aujourd'hui, avec l'émotion notée (ou rien). */
export function lastSevenDays(list: EmotionEntry[], now = new Date()): { day: string; key?: EmotionKey }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const day = dayKey(d);
    return { day, key: list.find((e) => e.day === day)?.key };
  });
}

export const emotionOf = (key?: EmotionKey) => EMOTIONS.find((e) => e.key === key);
