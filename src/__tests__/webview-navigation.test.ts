import { describe, expect, it } from 'vitest';
import { decidePageRequest, nativeRouteFor, sameDocumentUrl } from '../lib/webpage';

describe('navigation des pages du build 10', () => {
  it.each(['/%e2%9c%a6-le-cercle-des-soeurs-%e2%9c%a6/', '/%E2%9C%A6-le-cercle-des-soeurs-%E2%9C%A6/', '/✦-le-cercle-des-soeurs-✦/', '/le-cercle-des-7-soeurs/'])('ouvre les sept Sœurs dans leur écran natif : %s', (path) => {
    expect(nativeRouteFor('https://lecercle127.com' + path)).toBe('/soeurs');
  });
  it('ouvre le journal privé dans son écran utilisable sans cookie WordPress', () => {
    expect(nativeRouteFor('https://lecercle127.com/verification-des-reves/')).toBe('/journal');
    expect(decidePageRequest({ url: 'https://lecercle127.com/wp-login.php?redirect_to=x', navigationType: 'click' }, 'https://lecercle127.com/test/')).toBe('native');
    expect(nativeRouteFor('https://lecercle127.com/wp-login.php?action=register')).toBe('/connexion?mode=register');
    expect(nativeRouteFor('https://lecercle127.com/creer-un-compte/')).toBe('/connexion?mode=register');
  });
  it('ne recharge pas une route au chargement initial, après redirection canonique ou ancre', () => {
    const canonical = 'https://lecercle127.com/oracle-127/';
    expect(sameDocumentUrl(canonical, canonical.slice(0, -1))).toBe(true);
    expect(decidePageRequest({ url: canonical, navigationType: 'other' }, canonical)).toBe('allow');
    expect(decidePageRequest({ url: canonical + '#tirage', navigationType: 'click' }, canonical)).toBe('allow');
  });
  it('recharge les nouvelles pages du site avec le nettoyage, en bloquant les paiements et Facebook', () => {
    const current = 'https://lecercle127.com/oracle-127/';
    expect(decidePageRequest({ url: 'https://lecercle127.com/oni-gardienne-des-reves/', navigationType: 'click' }, current)).toBe('page');
    expect(decidePageRequest({ url: 'https://facebook.com/le-cercle', isTopFrame: false }, current)).toBe('block');
    expect(decidePageRequest({ url: 'https://buy.stripe.com/test', isTopFrame: false }, current)).toBe('block');
  });
});
