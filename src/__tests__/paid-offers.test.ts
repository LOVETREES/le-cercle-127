import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it } from 'vitest';

import { isPaidOfferUrl } from '../lib/paid-offers';
import { decideNavigation, decideRequest, injectedScript } from '../lib/webpage';

const pages: JSDOM[] = [];
function page(html: string) {
  const dom = new JSDOM(html, { url: 'https://lecercle127.com/oni-gardienne-des-reves/', runScripts: 'outside-only' });
  pages.push(dom);
  dom.window.eval(injectedScript());
  return dom;
}
afterEach(() => { pages.splice(0).forEach((dom) => dom.window.close()); });

describe('offre de lecture supprimée des pages mobiles', () => {
  it('retire l’encart réel des Sept Sœurs dont le titre ne mentionne pas le prix', () => {
    const dom = page(`<section id="grimoire"><h2>Le Grimoire garde le fil.</h2>
      <p id="free"><a href="/grimoire/">Ouvrir mon Grimoire</a></p>
      <div class="c127-offer">
        <div><p>Lecture détaillée</p><h3>Commencer simplement avec Oni</h3>
          <span class="c127-price">3,90&nbsp;€</span>
          <p>Une lecture détaillée de votre rêve.</p></div>
        <div class="c127-paybox"><a href="https://lecercle127.com/lecture-de-reve/">Demander ma lecture détaillée · 3,90 €</a>
          <p>Paiement sécurisé par Stripe.</p></div>
      </div></section>`);
    expect(dom.window.document.querySelector('.c127-offer')!.hasAttribute('data-c127-paid-hidden')).toBe(true);
    expect(dom.window.getComputedStyle(dom.window.document.querySelector('.c127-offer')!).display).toBe('none');
    expect(dom.window.document.querySelector('#free')!.closest('[data-c127-paid-hidden]')).toBeNull();
  });

  it('retire le bloc entier, titre et prix inclus, et conserve le contenu gratuit', () => {
    const dom = page('<main><article id="learn"><h1>Comprendre ses rêves</h1><p>Notez ce qui revient.</p></article><div id="offer" class="card"><h2>La Perle d’Oni</h2><p>Votre lecture personnalisée</p><p>3,90 €</p><a href="/lecture-de-reve/">Commander</a></div></main>');
    expect(dom.window.getComputedStyle(dom.window.document.querySelector('#offer')!).display).toBe('none');
    expect(dom.window.document.querySelector('#learn')!.closest('[data-c127-paid-hidden]')).toBeNull();
    expect(dom.window.document.querySelector('main')!.hasAttribute('data-c127-paid-hidden')).toBe(false);
  });

  it.each(['3,90 €', '3.90€', '3\u00a0€\u00a090', '3,90 euros', '3.90 EUR', '€ 3.90', '3 euros 90'])(
    'masque un prix écrit « %s », même sans lien de paiement', (price) => {
      const dom = page(`<main><p id="price">Une lecture pour ${price}</p><p id="free">Gardez vos rêves dans le Grimoire.</p></main>`);
      expect(dom.window.document.querySelector('#price')!.hasAttribute('data-c127-paid-hidden')).toBe(true);
      expect(dom.window.document.querySelector('#free')!.hasAttribute('data-c127-paid-hidden')).toBe(false);
    },
  );

  it('repère un prix réparti sur plusieurs balises et une offre sans prix', () => {
    const dom = page('<main><p id="split"><strong>3</strong><span>,90</span> €</p><h2 id="name">La Perle d’Oni</h2></main>');
    expect(dom.window.document.querySelector('#split')!.hasAttribute('data-c127-paid-hidden')).toBe(true);
    expect(dom.window.document.querySelector('#name')!.hasAttribute('data-c127-paid-hidden')).toBe(true);
  });

  it('conserve les fonctions gratuites dans un groupe contenant aussi une publicité', () => {
    const dom = page('<div id="mixed" class="wp-block-group"><h2>Raconter un rêve</h2><form><textarea></textarea><button>Enregistrer</button></form><a id="free" href="/grimoire/">Mon Grimoire</a><p id="price">Lecture à 3,90 €</p><a id="buy" href="https://buy.stripe.com/x">Acheter</a></div>');
    expect(dom.window.document.querySelector('#mixed')!.hasAttribute('data-c127-paid-hidden')).toBe(false);
    expect(dom.window.document.querySelector('#free')!.closest('[data-c127-paid-hidden]')).toBeNull();
    expect(dom.window.document.querySelector('#price')!.hasAttribute('data-c127-paid-hidden')).toBe(true);
    expect(dom.window.document.querySelector('#buy')!.hasAttribute('data-c127-paid-hidden')).toBe(true);
  });

  it('filtre un encart et un prix ajoutés après le chargement', async () => {
    const dom = page('<main><p id="price">Votre espace personnel</p></main>');
    const doc = dom.window.document;
    doc.querySelector('main')!.insertAdjacentHTML('beforeend', '<aside id="late"><h2>Lecture de rêve</h2><p>3,90 €</p><a href="/lecture-de-reve/">Commander</a></aside>');
    doc.querySelector('#price')!.firstChild!.textContent = 'Lecture à 3,90 €';
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(doc.querySelector('#late')!.hasAttribute('data-c127-paid-hidden')).toBe(true);
    expect(doc.querySelector('#price')!.hasAttribute('data-c127-paid-hidden')).toBe(true);
  });

  it('bloque un lien modifié juste avant le clic et un formulaire de paiement', () => {
    const dom = page('<main><a id="buy" href="/grimoire/">Continuer</a><form id="pay"><button>Continuer</button></form></main>');
    const link = dom.window.document.querySelector('#buy')!;
    link.setAttribute('href', '/%6cecture-de-reve/');
    expect(link.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))).toBe(false);
    const form = dom.window.document.querySelector('#pay')!;
    form.setAttribute('action', 'https://checkout.stripe.com/pay/x');
    expect(form.dispatchEvent(new dom.window.SubmitEvent('submit', { bubbles: true, cancelable: true }))).toBe(false);
  });

  it('ignore le texte des scripts et garde les autres montants', () => {
    const dom = page('<div id="content"><script>const offer = "3,90 €";</script><p id="text">Observer ses rêves</p></div><p id="other">3 900 symboles, rappel à 3:90, 13,90 €, 3,900 €.</p>');
    expect(dom.window.document.querySelector('#content')!.hasAttribute('data-c127-paid-hidden')).toBe(false);
    expect(dom.window.document.querySelector('#other')!.hasAttribute('data-c127-paid-hidden')).toBe(false);
  });

  it('supprime une mention sans balise dédiée sans masquer la page entière', () => {
    const dom = page('<main>Lecture à 3,90 €<p id="free">Votre Grimoire</p></main>');
    expect(dom.window.document.querySelector('main')!.textContent).toBe('Votre Grimoire');
    expect(dom.window.document.querySelector('#free')!.closest('[data-c127-paid-hidden]')).toBeNull();
  });

  it('masque un paiement intégré et conserve le cadre de vérification anti-spam', () => {
    const dom = page('<iframe id="pay" src="https://checkout.stripe.com/pay/x"></iframe><iframe id="captcha" src="https://www.google.com/recaptcha/api2/anchor"></iframe>');
    expect(dom.window.document.querySelector('#pay')!.hasAttribute('data-c127-paid-hidden')).toBe(true);
    expect(dom.window.document.querySelector('#captcha')!.hasAttribute('data-c127-paid-hidden')).toBe(false);
  });

  it('ne réinstalle pas le filtre ni les messages quand le script est injecté deux fois', () => {
    const dom = page('<form class="wpcf7-form"><textarea></textarea></form>');
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    dom.window.eval(injectedScript());
    expect(dom.window.document.querySelectorAll('.c127-app-hint')).toHaveLength(1);
  });
});

describe('accès aux destinations payantes', () => {
  it.each([
    'https://lecercle127.com/lecture-de-reve/',
    'https://lecercle127.com/%6cecture-de-reve/?utm_source=app',
    'https://lecercle127.com/LECTURE-DE-REVE/',
    'https://lecercle127.com/perle-d-oni/',
    'https://lecercle127.com/produit/lecture-de-reve/',
    'https://buy.stripe.com/x',
    'https://checkout.stripe.com/pay/x',
    'https://www.onirologue.shop/x',
  ])('bloque %s, y compris les cadres de paiement', (url) => {
    expect(decideNavigation(url)).toBe('block');
    expect(decideRequest({ url, isTopFrame: false, navigationType: 'other' })).toBe('block');
  });

  it('traite les liens relatifs et préserve les liens ordinaires', () => {
    expect(isPaidOfferUrl('../lecture-de-reve/', 'https://lecercle127.com/oni/')).toBe(true);
    expect(isPaidOfferUrl('/grimoire/')).toBe(false);
    expect(isPaidOfferUrl('/oracle-127/')).toBe(false);
    expect(isPaidOfferUrl('https://notstripe.com/')).toBe(false);
    expect(isPaidOfferUrl('https://lecercle127.com/lecture-de-reve-lucide/')).toBe(false);
    expect(decideRequest({ url: 'https://www.google.com/recaptcha/api2/anchor', isTopFrame: false })).toBe('allow');
  });
});
