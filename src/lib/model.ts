// Fonctions pures (sans React Native) : normalisation des réponses de l'API
// et gestion des brouillons hors ligne. Testées avec Vitest.

export type Emotion =
  | 'joie'
  | 'serenite'
  | 'peur'
  | 'tristesse'
  | 'colere'
  | 'confusion'
  | 'emerveillement'
  | 'surprise'
  | 'aucune'
  | 'autre';

export const EMOTIONS: { value: Emotion; label: string }[] = [
  { value: 'joie', label: 'Joie' },
  { value: 'serenite', label: 'Sérénité' },
  { value: 'peur', label: 'Peur / angoisse' },
  { value: 'tristesse', label: 'Tristesse' },
  { value: 'colere', label: 'Colère' },
  { value: 'confusion', label: 'Confusion' },
  { value: 'emerveillement', label: 'Émerveillement' },
  { value: 'surprise', label: 'Surprise' },
  { value: 'aucune', label: 'Aucune en particulier' },
  { value: 'autre', label: 'Autre' },
];

export type DreamInput = {
  title: string;
  story: string;
  dreamDate: string; // AAAA-MM-JJ
  emotion?: Emotion;
  intensity?: number; // 1 à 5
};

export type Dream = DreamInput & {
  id: string; // identifiant serveur, ou « draft-… » pour un brouillon local
  createdAt: string;
  oniReading?: string;
  pending?: boolean; // vrai tant que le rêve n'est pas synchronisé
};

export type User = { id: string; name: string; email?: string };

type Json = Record<string, unknown>;

const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Retourne la première valeur non vide parmi plusieurs clés possibles. */
export function pick(obj: unknown, keys: string[]): unknown {
  if (!isObj(obj)) return undefined;
  for (const k of keys) {
    const path = k.split('.');
    let cur: unknown = obj;
    for (const p of path) cur = isObj(cur) ? cur[p] : undefined;
    if (cur !== undefined && cur !== null && cur !== '') return cur;
  }
  return undefined;
}

const str = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : isObj(v) && typeof v.rendered === 'string' ? v.rendered : undefined;

/** Retire les balises HTML et décode les entités courantes (texte venant de WordPress). */
export function plainText(html: string | undefined): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;|&#8217;/g, '’')
    .replace(/&lsquo;|&#8216;/g, '‘')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&hellip;|&#8230;/g, '…')
    .replace(/&ndash;|&#8211;/g, '–')
    .replace(/&mdash;|&#8212;/g, '—')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

export function extractToken(body: unknown): string | undefined {
  const t = pick(body, ['token', 'access_token', 'device_token', 'jwt', 'data.token', 'data.access_token', 'auth.token']);
  return typeof t === 'string' && t.length > 0 ? t : undefined;
}

export function normalizeUser(body: unknown): User | undefined {
  const u = pick(body, ['user', 'data.user', 'me']) ?? body;
  const id = str(pick(u, ['id', 'ID', 'user_id']));
  const name = str(pick(u, ['pseudonym', 'pseudo', 'display_name', 'name', 'username', 'user_login']));
  if (!id && !name) return undefined;
  return { id: id ?? '', name: name ?? 'Rêveur', email: str(pick(u, ['email', 'user_email'])) };
}

const today = () => new Date().toISOString().slice(0, 10);

export function normalizeDream(raw: unknown): Dream | undefined {
  if (!isObj(raw)) return undefined;
  const id = str(pick(raw, ['id', 'ID', 'dream_id']));
  if (!id) return undefined;
  const story = plainText(str(pick(raw, ['story', 'recit', 'content', 'text', 'description', 'body'])));
  const title = plainText(str(pick(raw, ['title', 'titre', 'name']))) || 'Rêve sans titre';
  const created = str(pick(raw, ['created_at', 'date', 'createdAt', 'created'])) ?? new Date().toISOString();
  const dreamDate = (str(pick(raw, ['dream_date', 'night', 'dreamDate', 'date'])) ?? created).slice(0, 10);
  const intensityRaw = Number(pick(raw, ['intensity', 'intensite', 'emotion_intensity']));
  const reading = str(pick(raw, ['oni_reading', 'oni.reading', 'oni.text', 'reading', 'interpretation', 'oni_response']));
  return {
    id,
    title,
    story,
    dreamDate: /^\d{4}-\d{2}-\d{2}$/.test(dreamDate) ? dreamDate : today(),
    emotion: str(pick(raw, ['emotion', 'emotion_dominante'])) as Emotion | undefined,
    intensity: Number.isFinite(intensityRaw) && intensityRaw > 0 ? intensityRaw : undefined,
    createdAt: created,
    oniReading: reading ? plainText(reading) : undefined,
  };
}

export function normalizeDreamList(body: unknown): Dream[] {
  const list = Array.isArray(body) ? body : pick(body, ['dreams', 'items', 'data']);
  if (!Array.isArray(list)) return [];
  return list.map(normalizeDream).filter((d): d is Dream => Boolean(d));
}

/** Corps envoyé au serveur : plusieurs alias pour rester compatible avec le contrat WordPress. */
export function dreamPayload(d: DreamInput): Json {
  return {
    title: d.title.trim(),
    story: d.story.trim(),
    content: d.story.trim(),
    dream_date: d.dreamDate,
    emotion: d.emotion ?? '',
    intensity: d.intensity ?? null,
  };
}

export function validateDream(d: DreamInput): string | undefined {
  if (d.story.trim().length < 3) return 'Racontez au moins quelques mots de votre rêve.';
  if (d.story.length > 20000) return 'Le récit est trop long (20 000 caractères au maximum).';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.dreamDate)) return 'La date doit être au format AAAA-MM-JJ.';
  if (d.intensity !== undefined && (d.intensity < 1 || d.intensity > 5)) return 'L’intensité va de 1 à 5.';
  return undefined;
}

export function makeDraft(input: DreamInput, now = new Date()): Dream {
  return {
    ...input,
    title: input.title.trim() || 'Rêve sans titre',
    id: `draft-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now.toISOString(),
    pending: true,
  };
}

/** Fusionne les rêves du serveur et les brouillons locaux, du plus récent au plus ancien. */
export function mergeDreams(server: Dream[], drafts: Dream[]): Dream[] {
  return [...drafts, ...server].sort((a, b) =>
    b.dreamDate === a.dreamDate ? b.createdAt.localeCompare(a.createdAt) : b.dreamDate.localeCompare(a.dreamDate),
  );
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function apiErrorMessage(body: unknown, fallback: string): string {
  const m = str(pick(body, ['message', 'error', 'data.message']));
  return m ? plainText(m) : fallback;
}
