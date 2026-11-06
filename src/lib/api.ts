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
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers['X-C127-Token'] = token;
  }
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('Connexion impossible. Vérifiez votre réseau et réessayez.', 0);
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
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

  async register(input: { pseudonym: string; email: string; password: string }): Promise<Session | null> {
    const body = await request(`${NS}/auth/register`, {
      method: 'POST',
      body: {
        pseudonym: input.pseudonym.trim(),
        pseudo: input.pseudonym.trim(),
        display_name: input.pseudonym.trim(),
        username: input.pseudonym.trim(),
        email: input.email.trim(),
        login: input.email.trim(),
        password: input.password,
        consent: true,
        privacy_consent: true,
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

  async exploreWithOni(token: string, id: string): Promise<string> {
    const body = await request(`${NS}/dreams/${encodeURIComponent(id)}/oni`, {
      method: 'POST',
      token,
      body: { consent: true },
      timeoutMs: 90000,
    });
    const reading = normalizeDream((body as { dream?: unknown })?.dream ?? body)?.oniReading;
    return reading ?? plainText(apiErrorMessage(body, ''));
  },

  async privacy(): Promise<{ url: string; oniEnabled: boolean }> {
    const body = (await request(`${NS}/privacy`)) as { privacy_url?: string; oni_enabled?: boolean } | undefined;
    return {
      url: body?.privacy_url ?? 'https://lecercle127.com/confidentialite-le-cercle-127/',
      oniEnabled: Boolean(body?.oni_enabled),
    };
  },

  async searchSymbols(query: string): Promise<Symbol127[]> {
    const params = new URLSearchParams({
      search: query.trim(),
      per_page: '30',
      _fields: 'id,title,excerpt,link',
    });
    const body = await request(`${BASE}/wp/v2/symbole_onirique?${params.toString()}`);
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
