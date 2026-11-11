import Constants from 'expo-constants';

import {
  apiErrorMessage,
  dreamPayload,
  extractToken,
  normalizeDream,
  normalizeDreamList,
  normalizeUser,
  plainText,
  type Dream,
  type DreamInput,
  type User,
} from './model';
import { t } from '../i18n';

// Scénario Make « Cercle 127 — App : demande de lecture d'Oni (relue) ».
export const ONI_REQUEST_URL = 'https://hook.eu2.make.com/494v4gvalix9usill8zoynzh2mtyt13w';
// Scénario Make « Cercle 127 — Lecture du jour d'Oni (immédiate, relue après coup) » : une par jour et par compte
// (heure de Paris, tenu par le serveur) ; garde-fou de détresse (pas d'interprétation, 3114 / 112, relecture prioritaire).
export const ONI_DAILY_URL = 'https://hook.eu2.make.com/epuxbt8jq6of4mux15crbkph88rcb59j';

export type DailyReading =
  | { status: 'lue'; reading: string; questions: string[]; closing?: string; saved: boolean }
  | { status: 'accompagnement'; reading: string }
  | { status: 'quota' | 'deja_demandee' | 'indisponible' };

/** Réponse du scénario « lecture du jour » (texte brut du webhook). « Accepted » = rien de lisible pour ce rêve. */
export function parseDailyReading(raw: unknown): DailyReading {
  const b = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  if (b.ok === true && b.status === 'lue' && str(b.reading)) {
    return {
      status: 'lue',
      reading: str(b.reading),
      questions: str(b.questions).split('\n').map((q) => q.trim()).filter(Boolean),
      closing: str(b.closing) || undefined,
      saved: b.saved === true,
    };
  }
  if (b.ok === true && b.status === 'accompagnement' && str(b.reading)) return { status: 'accompagnement', reading: str(b.reading) };
  if (b.ok === true && (b.status === 'quota' || b.status === 'deja_demandee')) return { status: b.status };
  return { status: 'indisponible' };
}

const BASE: string =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ?? 'https://lecercle127.com/wp-json';
const NS = `${BASE}/cercle127/v1`;
const PALM = `${BASE}/c127-palm/v1/readings`;
const PALM_DETAILED = `${BASE}/c127-palm/v1/detailed`;
const LV_BILANS = `${BASE}/c127-lv/v1/bilans`;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type Options = { method?: string; body?: unknown; token?: string | null; timeoutMs?: number };

async function request(url: string, { method = 'GET', body, token, timeoutMs = 20000 }: Options = {}): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  let text: string;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    text = await res.text();
  } catch {
    throw new ApiError(t('Connexion impossible. Vérifiez votre réseau et réessayez.'), 0);
  } finally {
    clearTimeout(timer);
  }
  let json: unknown = undefined;
  let unreadable = false;
  try {
    json = text.trim() ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
    unreadable = true;
  }
  // Une page HTML (erreur, maintenance, portail Wi-Fi) renvoyée avec un statut 200 n'est pas une réussite.
  if (res.ok && unreadable) throw new ApiError(t('Réponse inattendue du serveur. Réessayez dans un instant.'), res.status);
  if (!res.ok) {
    const fallback = res.status === 401 ? 'Votre session a expiré. Reconnectez-vous.' : 'Une erreur est survenue.';
    throw new ApiError(apiErrorMessage(json, fallback), res.status);
  }
  return json;
}

export type Session = { token: string; user: User };

export const api = {
  // Lectures de la main gardées dans le compte (extension « Cercle 127 - Lectures de la main »).
  async palmList(token: string): Promise<Record<string, unknown>[]> {
    const body = (await request(PALM, { token })) as { items?: unknown } | undefined;
    return Array.isArray(body?.items) ? (body!.items as Record<string, unknown>[]) : [];
  },
  async palmAdd(token: string, reading: object): Promise<void> {
    await request(PALM, { method: 'POST', token, body: reading });
  },
  async palmDelete(token: string, id: string): Promise<void> {
    await request(`${PALM}/${encodeURIComponent(id)}`, { method: 'DELETE', token });
  },

  // Lecture détaillée de la main sur photo (Terra). La photo n'est pas conservée par le site.
  async palmDetailedList(token: string): Promise<unknown> {
    return request(PALM_DETAILED, { token });
  },
  async palmDetailedCreate(token: string, body: { image: string; hand: string; lang: string; consent: true; remember?: boolean; metrics?: Record<string, number> }): Promise<unknown> {
    return request(PALM_DETAILED, { method: 'POST', token, body, timeoutMs: 190000 });
  },
  // Framework 127 : la Conscience choisit la Sœur qui répond à l'émotion du jour (avec accord).
  async sisterForEmotion(token: string, body: { emotion: string; recent: Record<string, number>; consent: true; remember: boolean; lang: string }): Promise<unknown> {
    return request(`${BASE}/c127-f127/v1/emotion`, { method: 'POST', token, body, timeoutMs: 90000 });
  },
  // Bilans de la semaine du Labyrinthe vivant, gardés dans le compte sur accord (chiffres de 0 à 4 seulement).
  async lvBilans(token: string): Promise<unknown[]> {
    const body = (await request(LV_BILANS, { token })) as { bilans?: unknown[] } | undefined;
    return Array.isArray(body?.bilans) ? body.bilans : [];
  },
  async lvPushBilans(token: string, bilans: object[]): Promise<void> {
    await request(LV_BILANS, { method: 'POST', token, body: { bilans } });
  },
  async lvDeleteBilans(token: string): Promise<void> {
    await request(LV_BILANS, { method: 'DELETE', token });
  },

  async palmDetailedDelete(token: string, id: string): Promise<void> {
    await request(`${PALM_DETAILED}/${encodeURIComponent(id)}`, { method: 'DELETE', token });
  },

  async login(email: string, password: string): Promise<Session> {
    const body = await request(`${NS}/auth/login`, { method: 'POST', body: { login: email.trim(), password } });
    const token = extractToken(body);
    if (!token) throw new ApiError(t('Réponse inattendue du serveur.'), 500);
    return { token, user: normalizeUser(body) ?? { id: '', name: email.split('@')[0] } };
  },

  // Champs attendus par /auth/register (vérifiés sur le site, novembre 2026).
  async register(input: { pseudonym: string; email: string; password: string; ageConfirmed: boolean }): Promise<Session | null> {
    const body = await request(`${NS}/auth/register`, {
      method: 'POST',
      body: {
        display_name: input.pseudonym.trim(),
        email: input.email.trim(),
        password: input.password,
        password_confirmation: input.password,
        privacy_consent: true,
        age_confirmation: input.ageConfirmed,
      },
    });
    const token = extractToken(body);
    if (!token) return null; // compte créé, connexion à faire ensuite
    return { token, user: normalizeUser(body) ?? { id: '', name: input.pseudonym } };
  },

  async forgotPassword(email: string): Promise<string> {
    const body = await request(`${NS}/auth/forgot-password`, {
      method: 'POST',
      body: { email: email.trim(), login: email.trim() },
    });
    return apiErrorMessage(body, 'Si un compte correspond, un e-mail de réinitialisation vient d’être envoyé.');
  },

  async logout(token: string): Promise<void> {
    await request(`${NS}/auth/logout`, { method: 'POST', token }).catch(() => undefined);
  },

  async me(token: string): Promise<User | undefined> {
    return normalizeUser(await request(`${NS}/me`, { token }));
  },

  async deleteAccount(token: string): Promise<void> {
    await request(`${NS}/me`, { method: 'DELETE', token, body: { confirm: true } });
  },

  async listDreams(token: string): Promise<Dream[]> {
    return normalizeDreamList(await request(`${NS}/dreams`, { token }));
  },

  async createDream(token: string, input: DreamInput): Promise<Dream | undefined> {
    const body = await request(`${NS}/dreams`, { method: 'POST', token, body: dreamPayload(input) });
    return normalizeDream((body as { dream?: unknown })?.dream ?? body);
  },

  async deleteDream(token: string, id: string): Promise<void> {
    await request(`${NS}/dreams/${encodeURIComponent(id)}`, { method: 'DELETE', token });
  },

  // Demande de lecture d'Oni : Make vérifie que le rêve appartient à la personne, Oni le lit,
  // puis la lecture est relue par une personne avant d'apparaître dans le Grimoire.
  async requestOniReading(token: string, id: string, consent: boolean): Promise<'en_attente' | 'deja_demandee'> {
    if (consent !== true) throw new ApiError(t('Votre accord est nécessaire avant l’envoi à Oni.'), 400);
    const body = (await request(ONI_REQUEST_URL, {
      method: 'POST',
      body: { dream_id: Number(id), token, consent },
      timeoutMs: 30000,
    })) as { ok?: boolean; status?: string } | undefined;
    if (body?.ok && (body.status === 'en_attente' || body.status === 'deja_demandee')) return body.status;
    throw new ApiError(t('Ce rêve n’a pas pu être confié à Oni. Actualisez votre Grimoire et réessayez.'), 400);
  },

  // Lecture du jour : Oni répond tout de suite (environ 30 s) ; une personne la relit ensuite.
  async requestDailyReading(token: string, id: string, consent: boolean): Promise<DailyReading> {
    if (consent !== true) throw new ApiError(t('Votre accord est nécessaire avant l’envoi à Oni.'), 400);
    let body: unknown;
    try {
      body = await request(ONI_DAILY_URL, { method: 'POST', body: { dream_id: Number(id), token, consent }, timeoutMs: 120000 });
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) throw e;
      return { status: 'indisponible' };
    }
    return parseDailyReading(body);
  },

  async privacy(): Promise<{ url: string; oniEnabled: boolean }> {
    const body = (await request(`${NS}/privacy`)) as { privacy_url?: string; oni_enabled?: boolean } | undefined;
    return {
      url: body?.privacy_url ?? 'https://lecercle127.com/confidentialite-le-cercle-127/',
      oniEnabled: body?.oni_enabled === true,
    };
  },

  async searchSymbols(query: string): Promise<Symbol127[]> {
    const term = query.trim();
    // Chaîne de requête construite à la main (plus fiable sur iOS et Android).
    const url = (extra: string, n: number) =>
      `${BASE}/wp/v2/symbole_onirique?search=${encodeURIComponent(term)}${extra}&per_page=${n}&_fields=id,title,excerpt,link`;
    // D'abord les titres (« dent » → « Perdre une dent »), puis le texte des fiches en complément.
    // La fiche principale (« L’eau », « La maison ») est cherchée directement par son adresse.
    const base = fold(term).trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const forms = base ? [base, base.replace(/s$/, ''), `${base.replace(/s$/, '')}s`] : [];
    const slugs = [...new Set(forms.flatMap((f) => [f, `le-${f}`, `la-${f}`, `les-${f}`, `l-${f}`]))].join(',');
    const [main, inTitles, inText] = await Promise.all([
      slugs
        ? request(`${BASE}/wp/v2/symbole_onirique?slug=${encodeURIComponent(slugs)}&per_page=20&_fields=id,title,excerpt,link`).catch(() => [])
        : Promise.resolve([]),
      request(url('&search_columns=post_title', 100)),
      request(url('', 20)).catch(() => []),
    ]);
    const seen = new Set<string>();
    const list: (Symbol127 & { inTitle: boolean })[] = [];
    for (const [body, inTitle] of [[main, true], [inTitles, true], [inText, false]] as const) {
      if (!Array.isArray(body)) continue;
      for (const s of body as { id: number; title?: { rendered?: string }; excerpt?: { rendered?: string }; link: string }[]) {
        const id = String(s.id);
        if (seen.has(id)) continue;
        seen.add(id);
        list.push({ id, title: plainText(s.title?.rendered), excerpt: plainText(s.excerpt?.rendered), link: s.link, inTitle });
      }
    }
    return rankSymbols(term, list).slice(0, 30);
  },
};

export type Symbol127 = { id: string; title: string; excerpt: string; link: string };

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ');
const ARTICLES = new Set(['le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd']);

/** Classe les symboles : titre exact, puis mot entier (singulier/pluriel), puis début de mot, puis le reste. */
export function rankSymbols<T extends { title: string; inTitle?: boolean }>(query: string, list: T[]): T[] {
  const q = fold(query).trim();
  const qWords = q.split(/[^a-z0-9]+/).filter(Boolean);
  const same = (w: string, x: string) => w === x || w === x + 's' || w === x + 'x' || x === w + 's' || x === w + 'x';
  const score = (item: T) => {
    const words = fold(item.title).split(/[^a-z0-9]+/).filter(Boolean);
    const core = words.filter((w) => !ARTICLES.has(w));
    if (core.join(' ') === qWords.filter((w) => !ARTICLES.has(w)).join(' ')) return 0;
    if (qWords.every((x) => words.some((w) => same(w, x)))) return 1;
    if (qWords.every((x) => words.some((w) => w.startsWith(x)))) return 2;
    if (fold(item.title).includes(q)) return 3;
    return item.inTitle === false ? 5 : 4;
  };
  return list
    .map((item, i) => ({ item, i, s: score(item) }))
    .sort((a, b) => a.s - b.s || a.item.title.length - b.item.title.length || a.i - b.i)
    .map((x) => x.item);
}
