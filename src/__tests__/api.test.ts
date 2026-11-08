import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
vi.mock('expo-constants', () => ({ default: { expoConfig: { extra: { apiBaseUrl: 'https://example.test/wp-json' } } } }));

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe('API : consentement, disponibilité et effacement', () => {
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
