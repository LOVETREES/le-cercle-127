import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it } from 'vitest';

import sisters from './fixtures/sisters-facebook.json';
import { isFacebookUrl } from '../lib/facebook-links';
import { decideNavigation, decideRequest, injectedScript } from '../lib/webpage';

const pages: JSDOM[] = [];
function page(html: string) {
  const dom = new JSDOM(html, { url: 'https://lecercle127.com/oni-gardienne-des-reves/', runScripts: 'outside-only' });
  pages.push(dom);
  dom.window.eval(injectedScript());
  return dom;
}
afterEach(() => { pages.splice(0).forEach((dom) => dom.window.close()); });

describe('boutons Facebook des Sœurs', () => {
  it.each(sisters)('retire les boutons réels de $slug et garde les actions internes', ({ html, facebookCount, internalCount }) => {
    const dom = page(`<main><h1>La Sœur</h1>${html}<p>Un espace de réflexion.</p></main>`);
    const doc = dom.window.document;
    expect(facebookCount).toBeGreaterThan(0);
    expect(Array.from(doc.querySelectorAll('a[href]')).filter((a) => isFacebookUrl(a.getAttribute('href')!))).toHaveLength(0);
    expect(doc.querySelectorAll('a')).toHaveLength(internalCount);
    expect(doc.querySelector('h1')?.textContent).toBe('La Sœur');
    expect(doc.querySelector('p')?.textContent).toBe('Un espace de réflexion.');
  });

  it('retire un bouton à destination JavaScript ainsi qu’une icône sans texte', () => {
    const dom = page(`<button data-url="https://facebook.com/onirologue/">Suivre Oni</button>
      <button onclick="window.open('https://www.facebook.com/alka7soeurs/')">Suivre Alka</button>
      <a href="/social/" aria-label="Page Facebook"><svg></svg></a>
      <button id="keep">Parler à Oni</button>`);
    expect(dom.window.document.querySelectorAll('a,button')).toHaveLength(1);
    expect(dom.window.document.querySelector('#keep')?.textContent).toBe('Parler à Oni');
  });

  it('retire un lien inséré après le chargement et un lien dont la destination change', async () => {
    const dom = page('<main><a id="change" href="/grimoire/">Suivre Astria</a></main>');
    const doc = dom.window.document;
    doc.querySelector('main')!.insertAdjacentHTML('beforeend', '<a id="late" href="https://m.facebook.com/Astria7Soeurs/">Suivre</a>');
    doc.querySelector('#change')!.setAttribute('href', 'https://fb.me/astria');
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(doc.querySelectorAll('a')).toHaveLength(0);
  });

  it('bloque aussi un clic avant que le nettoyage différé se soit exécuté', () => {
    const dom = page('<main></main>');
    const link = dom.window.document.createElement('a');
    link.href = 'https://facebook.com/profile.php?id=61570303858131';
    link.textContent = 'Page Facebook';
    dom.window.document.querySelector('main')!.append(link);
    expect(link.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))).toBe(false);
    expect(link.isConnected).toBe(false);
  });

  it('garde les textes informatifs, le Grimoire et les liens Instagram', () => {
    const dom = page('<p id="info">Notre page Facebook existe aussi.</p><a href="/grimoire/">Grimoire</a><a href="https://instagram.com/lecercle127/">Instagram</a>');
    expect(dom.window.document.querySelector('#info')!.textContent).toContain('Facebook');
    expect(dom.window.document.querySelectorAll('a')).toHaveLength(2);
  });
});

describe('navigation Facebook depuis l’application', () => {
  it.each([
    'https://www.facebook.com/onirologue/',
    'https://m.facebook.com/naia7soeurs/',
    'https://web.facebook.com/profile.php?id=123',
    'https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com',
    'https://FACEBOOK.COM/Astria7Soeurs/',
    'https://fb.com/alka7soeurs',
    'https://fb.me/terra7soeurs',
    'https://fb.watch/video',
    'fb://profile/123',
    'fbapi://profile/123',
    'fbauth2://authorize',
  ])('bloque %s avant ouverture du navigateur ou de Facebook', (url) => {
    expect(isFacebookUrl(url)).toBe(true);
    expect(decideNavigation(url)).toBe('block');
    expect(decideRequest({ url, isTopFrame: true, navigationType: 'click' })).toBe('block');
    expect(decideRequest({ url, isTopFrame: false })).toBe('block');
  });

  it('ne bloque pas les domaines qui ne sont pas Facebook', () => {
    for (const url of ['https://notfacebook.com/', 'https://facebook.com.example.org/', '/grimoire/', 'https://lecercle127.com/oni-gardienne-des-reves/']) {
      expect(isFacebookUrl(url)).toBe(false);
    }
    expect(decideNavigation('https://instagram.com/lecercle127/')).toBe('external');
    expect(decideRequest({ url: 'https://www.google.com/recaptcha/api2/anchor', isTopFrame: false })).toBe('allow');
  });
});
