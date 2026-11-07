import { describe, expect, it } from 'vitest';

import {
  apiErrorMessage,
  dreamPayload,
  extractToken,
  makeDraft,
  mergeDreams,
  normalizeDream,
  normalizeDreamList,
  normalizeUser,
  recurringSymbols,
  searchDreams,
  plainText,
  validateDream,
  validateEmail,
} from '../lib/model';
import { decideNavigation, decideRequest, HIDE_SITE_CHROME_CSS, injectedScript, nativeRouteFor, siteUrl } from '../lib/webpage';

describe('normalisation des réponses WordPress', () => {
  it('lit le jeton quel que soit son nom', () => {
    expect(extractToken({ token: 'abc' })).toBe('abc');
    expect(extractToken({ data: { access_token: 'xyz' } })).toBe('xyz');
    expect(extractToken({ message: 'ok' })).toBeUndefined();
  });

  it('normalise un utilisateur', () => {
    expect(normalizeUser({ user: { id: 12, pseudonym: 'Lune', email: 'a@b.fr' } })).toEqual({ id: '12', name: 'Lune', email: 'a@b.fr' });
    expect(normalizeUser({})).toBeUndefined();
  });

  it('normalise un rêve et nettoie le HTML', () => {
    const d = normalizeDream({
      id: 7,
      title: { rendered: 'La maison qui respire' },
      content: '<p>J&rsquo;étais dans une maison.</p>',
      dream_date: '2026-11-01',
      emotion: 'peur',
      intensity: '4',
      oni_reading: '<p>Une piste…</p>',
    });
    expect(d).toMatchObject({ id: '7', title: 'La maison qui respire', story: 'J’étais dans une maison.', dreamDate: '2026-11-01', emotion: 'peur', intensity: 4, oniReading: 'Une piste…' });
  });

  it('lit le format réel de /cercle127/v1/dreams', () => {
    const d = normalizeDream({
      id: 18322,
      title: 'Privé\u00a0: L&rsquo;eau claire',
      story: 'Je nageais dans un lac.',
      dream_date: '2026-11-01',
      emotion: 'serenite',
      symbols: 'La clé, Le lac',
      interpretation: '',
      created_at: '2026-11-06T12:50:05',
    });
    expect(d).toMatchObject({ id: '18322', title: 'L’eau claire', dreamDate: '2026-11-01', symbols: ['La clé', 'Le lac'] });
    expect(d?.oniReading).toBeUndefined();
  });

  it('repère les symboles qui reviennent', () => {
    const base = { title: 't', story: 's', dreamDate: '2026-11-01', createdAt: 'x' };
    const r = recurringSymbols([
      { ...base, id: '1', symbols: ['La forêt', 'La clé'] },
      { ...base, id: '2', symbols: ['La forêt'] },
      { ...base, id: '3', symbols: ['Le lac'] },
    ]);
    expect(r).toEqual([['La forêt', 2]]);
  });

  it('cherche dans les rêves sans tenir compte des accents ni des majuscules', () => {
    const base = { story: '', dreamDate: '2026-11-01', createdAt: 'x' };
    const dreams = [
      { ...base, id: '1', title: 'La forêt qui chante', symbols: ['La lumière'] },
      { ...base, id: '2', title: 'L’eau claire', story: 'Un lac et une clé', emotion: 'serenite' as const },
    ];
    expect(searchDreams(dreams, 'FORET').map((d) => d.id)).toEqual(['1']);
    expect(searchDreams(dreams, 'lumiere').map((d) => d.id)).toEqual(['1']);
    expect(searchDreams(dreams, 'eau lac').map((d) => d.id)).toEqual(['2']);
    expect(searchDreams(dreams, 'sérénité').map((d) => d.id)).toEqual(['2']);
    expect(searchDreams(dreams, '  ')).toHaveLength(2);
  });

  it('lit la réponse réelle de connexion', () => {
    const body = { token: 'abc', token_type: 'Bearer', user: { id: 5, email: 'a@b.fr', display_name: 'Revue Apple' } };
    expect(extractToken(body)).toBe('abc');
    expect(normalizeUser(body)).toEqual({ id: '5', name: 'Revue Apple', email: 'a@b.fr' });
  });

  it('ignore les éléments sans identifiant et accepte une liste enveloppée', () => {
    expect(normalizeDreamList({ dreams: [{ id: 1, content: 'x' }, { content: 'sans id' }] })).toHaveLength(1);
    expect(normalizeDreamList('nope')).toEqual([]);
  });

  it('extrait un message d’erreur lisible', () => {
    expect(apiErrorMessage({ code: 'x', message: 'Adresse e-mail ou mot de passe incorrect.' }, 'f')).toBe('Adresse e-mail ou mot de passe incorrect.');
    expect(apiErrorMessage(undefined, 'défaut')).toBe('défaut');
  });

  it('décode les entités courantes', () => {
    expect(plainText('L&rsquo;eau &amp; le feu&hellip;')).toBe('L’eau & le feu…');
  });
});

describe('rêves et brouillons', () => {
  const input = { title: '  ', story: 'Je volais', dreamDate: '2026-11-04' };

  it('valide le récit et la date', () => {
    expect(validateDream(input)).toBeUndefined();
    expect(validateDream({ ...input, story: ' ' })).toMatch(/quelques mots/);
    expect(validateDream({ ...input, dreamDate: '04/11/2026' })).toMatch(/AAAA-MM-JJ/);
    expect(validateDream({ ...input, intensity: 9 })).toMatch(/1 à 5/);
  });

  it('crée un brouillon local en attente', () => {
    const d = makeDraft(input, new Date('2026-11-05T07:00:00Z'));
    expect(d.id.startsWith('draft-')).toBe(true);
    expect(d.pending).toBe(true);
    expect(d.title).toBe('Rêve sans titre');
  });

  it('trie par nuit puis par création, du plus récent au plus ancien', () => {
    const a = { ...makeDraft({ ...input, dreamDate: '2026-11-01' }), createdAt: '2026-11-01T08:00:00Z' };
    const b = { id: '9', title: 'b', story: 's', dreamDate: '2026-11-03', createdAt: '2026-11-03T08:00:00Z' };
    const c = { id: '8', title: 'c', story: 's', dreamDate: '2026-11-03', createdAt: '2026-11-03T09:00:00Z' };
    expect(mergeDreams([b, c], [a]).map((d) => d.id)).toEqual(['8', '9', a.id]);
  });

  it('envoie le récit sous plusieurs noms de champ', () => {
    const p = dreamPayload({ ...input, title: ' Titre ' });
    expect(p).toMatchObject({ title: 'Titre', story: 'Je volais', content: 'Je volais', dream_date: '2026-11-04' });
  });

  it('valide une adresse e-mail', () => {
    expect(validateEmail('contact@lecercle127.com')).toBe(true);
    expect(validateEmail('pas-un-mail')).toBe(false);
  });
});

describe('pages du site dans l’application', () => {
  it('garde la navigation sur le site et bloque l’offre payante', () => {
    expect(decideNavigation('https://lecercle127.com/oracle-127/')).toBe('allow');
    expect(decideNavigation('https://www.lecercle127.com/grimoire/')).toBe('allow');
    expect(decideNavigation('https://lecercle127.com/lecture-de-reve/')).toBe('block');
    expect(decideNavigation('https://checkout.stripe.com/pay/x')).toBe('block');
    expect(decideNavigation('https://lecercle127.com/wp-admin/')).toBe('block');
  });

  it('laisse les cadres intégrés se charger dans la page (reCAPTCHA, widgets)', () => {
    expect(decideRequest({ url: 'https://www.google.com/recaptcha/api2/anchor', isTopFrame: false, navigationType: 'other' })).toBe('allow');
    expect(decideRequest({ url: 'https://widgets.wp.com/x', isTopFrame: false })).toBe('allow');
  });

  it('n’ouvre le navigateur que sur un vrai clic vers un autre site', () => {
    expect(decideRequest({ url: 'https://www.instagram.com/lecercle127/', isTopFrame: true, navigationType: 'click' })).toBe('external');
    expect(decideRequest({ url: 'https://tracker.example.com/', isTopFrame: true, navigationType: 'other' })).toBe('block');
    expect(decideRequest({ url: 'https://www.instagram.com/lecercle127/' })).toBe('external'); // Android
    expect(decideRequest({ url: 'https://lecercle127.com/oracle-127/', isTopFrame: true, navigationType: 'other' })).toBe('allow');
  });

  it('ouvre les écrans de l’application à la place des parcours du site', () => {
    expect(nativeRouteFor('https://lecercle127.com/parcours-reve-127/')).toBe('/reve');
    expect(nativeRouteFor('https://www.lecercle127.com/grimoire/?x=1')).toBe('/grimoire');
    expect(nativeRouteFor('https://lecercle127.com/creer-un-compte/')).toBe('/connexion');
    expect(nativeRouteFor('cercle127://reve')).toBe('/reve');
    expect(nativeRouteFor('https://lecercle127.com/')).toBe('/');
    expect(nativeRouteFor('https://lecercle127.com')).toBe('/');
    expect(nativeRouteFor('https://lecercle127.com/application/')).toBe('/');
    expect(nativeRouteFor('https://lecercle127.com/ignis-flamme-de-la-transformation/')).toBeUndefined();
    expect(HIDE_SITE_CHROME_CSS).toContain('.c127-appcard');
    expect(decideNavigation('https://lecercle127.com/interpreter-mes-reves-recurrents/')).toBe('block');
    expect(decideNavigation('https://onirologue.shop/produit/livre')).toBe('block');
    expect(decideNavigation('https://netmedia.best/produit/livre-reves-recurrents/')).toBe('block');
    expect(HIDE_SITE_CHROME_CSS).toContain('.os-book-wrap');
    expect(nativeRouteFor('https://lecercle127.com/carnet-vocal/')).toBe('/carnet-vocal');
    expect(decideRequest({ url: 'https://lecercle127.com/grimoire/', isTopFrame: true, navigationType: 'click' })).toBe('native');
    expect(decideRequest({ url: 'https://lecercle127.com/grimoire/', isTopFrame: true, navigationType: 'other' })).toBe('allow');
  });

  it('ouvre les liens externes hors de l’application', () => {
    expect(decideNavigation('https://www.instagram.com/lecercle127/')).toBe('external');
    expect(decideNavigation('mailto:contact@lecercle127.com')).toBe('external');
    expect(decideNavigation('intent://x')).toBe('block');
  });

  it('masque l’en-tête, la barre du bas et les liens vers la lecture payante', () => {
    for (const sel of ['.oni-app-nav', '.site-footer', 'a[href*="/lecture-de-reve"]']) {
      expect(HIDE_SITE_CHROME_CSS).toContain(sel);
    }
    expect(HIDE_SITE_CHROME_CSS).not.toContain('.cmplz-cookiebanner');
  });

  it('produit un script injecté valide qui propose l’écran Rêve', () => {
    const js = injectedScript();
    expect(() => new Function(js)).not.toThrow();
    expect(js).toContain('cercle127://reve');
  });

  it('construit des URL absolues', () => {
    expect(siteUrl('/oracle-127/')).toBe('https://lecercle127.com/oracle-127/');
    expect(siteUrl('https://lecercle127.com/symbole-reve/la-seve/')).toBe('https://lecercle127.com/symbole-reve/la-seve/');
  });
});
