import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
vi.mock('expo-constants', () => ({ default: { expoConfig: { extra: { apiBaseUrl: 'https://example.test/wp-json' } } } }));

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe('API : consentement, disponibilité et effacement', () => {
  it('ne transmet pas la conversation sans accord ou en cas de détresse explicite', async () => {
    const chat = { sister: 'naia', message: 'Bonjour', history: [], session: 'test', consent: false };
    await expect(api.sisterChat(chat)).rejects.toThrow();
    await expect(api.sisterChat({ ...chat, consent: true, message: 'Je veux me suicider' })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('utilise le service de dialogue avec la Sœur choisie et les échanges récents', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ answer: 'Je vous écoute.' }), { status: 200 }));
    const history = [{ role: 'user' as const, content: 'Bonjour' }, { role: 'assistant' as const, content: 'Bonjour à vous.' }];
    expect(await api.sisterChat({ sister: 'terra', message: ' Mon message ', history, session: 'test', consent: true })).toEqual({ answer: 'Je vous écoute.' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/wp-json/onirologue/v1/sister-chat');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ sister: 'terra', message: 'Mon message', history, session: 'test', image: null, website: '' });
  });
  it('signale une réponse de conversation vide', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(api.sisterChat({ sister: 'oni', message: 'Bonjour', history: [], session: 'test', consent: true })).rejects.toThrow();
  });
  it('ne partage pas une page sans accord explicite ou si elle contient une formulation explicite de crise', async () => {
    const base = { sister: 'oni', excerpt: 'Une page privée', lang: 'fr' };
    await expect(api.sisterForChapter('session', { ...base, consent: false as unknown as true })).rejects.toThrow('accord');
    await expect(api.sisterForChapter('session', { ...base, excerpt: 'Je veux me suicider', consent: true })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('envoie seulement l’extrait accepté dans la demande d’éclairage', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true, sister: 'oni', answer: 'Une question ?' }), { status: 200 }));
    const data = { sister: 'oni', excerpt: 'Un extrait choisi', consent: true as const, lang: 'fr' };
    await api.sisterForChapter('session', data);
    expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/wp-json/c127-f127/v1/chapter-light');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual(data);
  });
  it('n’envoie aucune demande à Make sans accord explicite', async () => {
    await expect(api.requestOniReading('test-session', '42', false)).rejects.toThrow('accord');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('transmet l’accord uniquement dans la demande autorisée', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true, status: 'en_attente' }), { status: 200 }));
    expect(await api.requestOniReading('test-session', '42', true)).toBe('en_attente');
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body).toMatchObject({ dream_id: 42, consent: true });
  });
  it.each([false, undefined, 'false', 'true'])('n’active pas l’IA avec une valeur autre que le booléen vrai : %s', async (value) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ oni_enabled: value }), { status: 200 }));
    expect((await api.privacy()).oniEnabled).toBe(false);
  });
  it('active le service lorsqu’il est effectivement ouvert', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ oni_enabled: true }), { status: 200 }));
    expect((await api.privacy()).oniEnabled).toBe(true);
  });
  it('demande la suppression au serveur et accepte une réponse sans contenu', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await api.deleteAccount('test-session');
    expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/wp-json/cercle127/v1/me');
    expect(fetchMock.mock.calls[0][1]?.method).toBe('DELETE');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ confirm: true });
  });
  it('ne signale pas une suppression réussie si le serveur renvoie une page HTML avec un statut 200', async () => {
    fetchMock.mockResolvedValue(new Response('<html><body>Maintenance</body></html>', { status: 200 }));
    await expect(api.deleteAccount('test-session')).rejects.toThrow('Réponse inattendue');
  });
  it('ne signale pas une suppression réussie en cas d’erreur serveur', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'Suppression refusée' }), { status: 503 }));
    await expect(api.deleteAccount('test-session')).rejects.toThrow('Suppression refusée');
  });
});

describe('recherche dans le dictionnaire des symboles', () => {
  const sym = (id: number, title: string) => ({ id, title: { rendered: title }, excerpt: { rendered: '' }, link: `https://x/${id}` });
  it('met « dent » devant « accident », « identité » ou un symbole trouvé seulement dans le texte', async () => {
    fetchMock.mockImplementation(async (url) => {
      if (String(url).includes('slug=')) return new Response(JSON.stringify([sym(4, 'Les dents')]), { status: 200 });
      const titles = String(url).includes('search_columns=post_title');
      const list = titles
        ? [sym(1, 'Un accident dans la famille'), sym(2, 'Perdre son identité numérique'), sym(3, 'Perdre ses dents'), sym(4, 'Les dents'), sym(5, 'Perdre une dent')]
        : [sym(9, 'Jérusalem'), sym(3, 'Perdre ses dents')];
      return new Response(JSON.stringify(list), { status: 200 });
    });
    const titles = (await api.searchSymbols(' dent ')).map((s) => s.title);
    expect(titles.slice(0, 3)).toEqual(['Les dents', 'Perdre une dent', 'Perdre ses dents']);
    expect(titles.indexOf('Jérusalem')).toBe(titles.length - 1);
    expect(titles.indexOf('Un accident dans la famille')).toBeGreaterThan(2);
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('search=dent&search_columns=post_title'))).toBe(true);
    expect(fetchMock.mock.calls.some(([u]) => decodeURIComponent(String(u)).includes('slug=dent,le-dent,la-dent,les-dent,l-dent,dents,le-dents'))).toBe(true);
  });
  it('ignore les accents et l’apostrophe', async () => {
    const { rankSymbols } = await import('../lib/api');
    expect(rankSymbols('jerusalem', [{ title: 'Le temple' }, { title: 'Jérusalem' }])[0].title).toBe('Jérusalem');
    expect(rankSymbols('eau', [{ title: 'Un bateau' }, { title: 'L’eau trouble' }])[0].title).toBe('L’eau trouble');
  });
});
