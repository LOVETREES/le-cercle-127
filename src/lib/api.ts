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

// Scénario Make « Cercle 127 — App : demande de lecture d'Oni (relue) ».
export const ONI_REQUEST_URL = 'https://hook.eu2.make.com/494v4gvalix9usill8zoynzh2mtyt13w';

const BASE: string =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ?? 'https://lecercle127.com/wp-json';
const NS = `${BASE}/cercle127/v1`;

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
    throw new ApiError('Connexion impossible. Vérifiez votre réseau et réessayez.', 0);
  } finally {
    clearTimeout(timer);
  }
  let json: unknown = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  if (!res.ok) {
    const fallback = res.status === 401 ? 'Votre session a expiré. Reconnectez-vous.' : 'Une erreur est survenue.';
    throw new ApiError(apiErrorMessage(json, fallback), res.status);
  }
  return json;
}

export type Session = { token: string; user: User };

export const api = {
  async login(email: string, password: string): Promise<Session> {
    const body = await request(`${NS}/auth/login`, { method: 'POST', body: { login: email.trim(), password } });
    const token = extractToken(body);
    if (!token) throw new ApiError('Réponse inattendue du serveur.', 500);
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
    if (consent !== true) throw new ApiError('Votre accord est nécessaire avant l’envoi à Oni.', 400);
    const body = (await request(ONI_REQUEST_URL, {
      method: 'POST',
      body: { dream_id: Number(id), token, consent },
      timeoutMs: 30000,
    })) as { ok?: boolean; status?: string } | undefined;
    if (body?.ok && (body.status === 'en_attente' || body.status === 'deja_demandee')) return body.status;
    throw new ApiError('Ce rêve n’a pas pu être confié à Oni. Actualisez votre Grimoire et réessayez.', 400);
  },

  async privacy(): Promise<{ url: string; oniEnabled: boolean }> {
    const body = (await request(`${NS}/privacy`)) as { privacy_url?: string; oni_enabled?: boolean } | undefined;
    return {
      url: body?.privacy_url ?? 'https://lecercle127.com/confidentialite-le-cercle-127/',
      oniEnabled: body?.oni_enabled === true,
    };
  },

  async searchSymbols(query: string): Promise<Symbol127[]> {
    // Chaîne de requête construite à la main (plus fiable sur iOS et Android).
    const qs = `search=${encodeURIComponent(query.trim())}&per_page=30&_fields=id,title,excerpt,link`;
    const body = await request(`${BASE}/wp/v2/symbole_onirique?${qs}`);
    if (!Array.isArray(body)) return [];
    return body.map((s: { id: number; title?: { rendered?: string }; excerpt?: { rendered?: string }; link: string }) => ({
      id: String(s.id),
      title: plainText(s.title?.rendered),
      excerpt: plainText(s.excerpt?.rendered),
      link: s.link,
    }));
  },
};

export type Symbol127 = { id: string; title: string; excerpt: string; link: string };
