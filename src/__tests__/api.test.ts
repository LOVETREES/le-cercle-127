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
