const PAID_HOSTS = ['stripe.com', 'onirologue.shop', 'netmedia.best'];
const PAID_PATH = /\/(lecture-de-reves?|interpreter-mes-reves-recurrents|perle-(?:d-?oni|oni))(\/|$)/;

/** Même règle pour les chargements natifs et les liens présents dans le HTML du site. */
export function isPaidOfferUrl(value: string, base = 'https://lecercle127.com'): boolean {
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return false;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (PAID_HOSTS.some((domain) => host === domain || host.endsWith('.' + domain))) return true;
  if (host !== 'lecercle127.com') return false;
  let path = url.pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    // Une URL mal encodée reste soumise aux règles sur son chemin brut.
  }
  path = path.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return PAID_PATH.test(path);
}

/** Source JavaScript explicite : Hermes ne conserve pas le source des fonctions pour toString(). */
export function paidOfferFilterScript(): string {
  return String.raw`(function () {
  const paidHosts = ${JSON.stringify(PAID_HOSTS)};
  const paidPath = new RegExp(${JSON.stringify(PAID_PATH.source)});
  function isPaidUrl(value, base) {
    let url;
    try { url = new URL(value, base); } catch { return false; }
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (paidHosts.some((domain) => host === domain || host.endsWith('.' + domain))) return true;
    if (host !== 'lecercle127.com') return false;
    let path = url.pathname;
    try { path = decodeURIComponent(path); } catch { /* garder le chemin brut */ }
    return paidPath.test(path.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
  }
  const hidden = '[data-c127-paid-hidden]';
  const excluded = 'script,style,noscript,template,' + hidden;
  const containers = '[data-c127-paid-offer],.simpay-form-wrap,.os-book-wrap,aside,[class*="card"],[class*="offre"],[class*="offer"],[class*="pricing"],[class*="tarif"],[class*="cta"],.wp-block-group,.elementor-widget-container';
  const promotion = /(?:^|\D)(?:3\s*[,.]\s*90\s*(?:€|euros?\b|eur\b)|3\s*(?:€|euros?\b)\s*90\b|€\s*3\s*[,.]\s*90\b)|\bperle\s+d['’\s-]*oni\b/i;

  function paidLink(el) {
    const value = el.getAttribute('href') || el.getAttribute('formaction') || el.getAttribute('action') || el.getAttribute('src');
    return Boolean(value && isPaidUrl(value, location.href));
  }

  function visibleText(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.parentElement?.closest(excluded) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    let text = '';
    while (walker.nextNode()) text += walker.currentNode.textContent || '';
    return text;
  }

  function hide(el) {
    if (el.closest(excluded)) return;
    const card = el.closest(containers);
    // Ne pas masquer une page entière ni un groupe contenant des fonctions gratuites.
    const safeAction = card && Array.from(card.querySelectorAll('a[href],form,textarea')).some((item) => !paidLink(item));
    const headings = card ? Array.from(card.querySelectorAll('h1,h2,h3,h4,h5,h6')) : [];
    const dedicatedHeading = card?.matches('.c127-offer') || headings.length === 0 || (headings.length === 1 && /lecture|perle|offre|tarif/i.test(headings[0].textContent || ''));
    const target = card && !card.matches('html,body,main,article') && !card.querySelector('main,article') &&
      !safeAction && dedicatedHeading && (card.textContent || '').length < 2000 ? card : el;
    target.setAttribute('data-c127-paid-hidden', '');
    // Le style inline couvre aussi l'intervalle avant l'insertion de la feuille CSS.
    target.style.setProperty('display', 'none', 'important');
  }

  function scan() {
    if (!document.body) return;
    document.querySelectorAll('a[href],form[action],button[formaction],iframe[src]').forEach((el) => {
      if (paidLink(el)) hide(el);
    });
    document.querySelectorAll('p,li,h1,h2,h3,h4,h5,h6,a,button,label,span,strong,b,small,div,aside,section').forEach((el) => {
      if (el.closest(excluded) || !promotion.test(visibleText(el))) return;
      // Chercher le plus petit bloc contenant le prix, même réparti entre plusieurs balises.
      if (Array.from(el.children).some((child) => !child.matches(excluded) && promotion.test(visibleText(child)))) return;
      hide(el);
    });
    // Texte sans paragraphe, directement sous <main> ou <body> : garder le reste de la page.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement?.closest(excluded) && promotion.test(node.textContent || '')) {
        if (node.parentElement?.matches('body,main,article')) node.textContent = '';
        else if (node.parentElement) hide(node.parentElement);
      }
    }
  }

  let scheduled = false;
  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; scan(); }, 0);
  }
  function start() {
    scan();
    if (!document.documentElement) return;
    new MutationObserver(scheduleScan).observe(document.documentElement, {
      subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ['href', 'action', 'formaction', 'src'],
    });
  }
  if (document.documentElement) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
  document.addEventListener('DOMContentLoaded', scheduleScan, { once: true });
  // Bloquer aussi un lien ou formulaire ajouté juste avant l'action de la personne.
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href],button[formaction]') : null;
    if (link && paidLink(link)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      hide(link);
    }
  }, true);
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form instanceof Element && (paidLink(form) || (event.submitter instanceof Element && paidLink(event.submitter)))) {
      event.preventDefault();
      event.stopImmediatePropagation();
      hide(form);
    }
  }, true);
})();`;
}
