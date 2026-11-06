// Règles d'affichage des pages du site dans l'application (fonctions pures, testées).
export const SITE = 'https://lecercle127.com';

/**
 * CSS injecté dans les pages du site : on retire l'en-tête, la barre du bas,
 * le pied de page et le bandeau cookies du site (l'application a les siens),
 * ainsi que les liens vers l'offre payante, vendue uniquement sur le site
 * (règles des boutiques sur les achats de contenus numériques).
 */
export const HIDE_SITE_CHROME_CSS = [
  'header.site-header', '.site-header', '.site-nav', '.oni-app-nav', 'footer.site-footer', '.site-footer',
  '.cmplz-cookiebanner', '#cmplz-manage-consent', '.cmplz-manage-consent', '.c127-app', '.c127-install',
  '[class*="install-banner"]', '.breadcrumbs', '.breadcrumb',
  'a[href*="/lecture-de-reve"]', 'a[href*="buy.stripe.com"]', 'a[href*="checkout.stripe.com"]', '.simpay-form-wrap',
].join(',') + '{display:none!important}body{padding-bottom:24px!important;margin-top:0!important}';

export function injectedScript(): string {
  return `(function(){var s=document.createElement('style');s.innerHTML=${JSON.stringify(HIDE_SITE_CHROME_CSS)};document.documentElement.appendChild(s);})();true;`;
}

export type NavDecision = 'allow' | 'external' | 'block';

export type NavRequest = { url: string; isTopFrame?: boolean; navigationType?: string };

/**
 * Où ouvrir un chargement demandé par une page du site.
 * Les cadres intégrés (reCAPTCHA, widgets, vidéos…) se chargent dans la page :
 * seuls les vrais clics de l'utilisateur vers un autre site ouvrent le navigateur.
 */
export function decideRequest(req: NavRequest): NavDecision {
  if (req.isTopFrame === false) return 'allow';
  const d = decideNavigation(req.url);
  if (d === 'external' && req.navigationType !== undefined && req.navigationType !== 'click') return 'block';
  return d;
}

/** Où ouvrir un lien cliqué dans une page du site. */
export function decideNavigation(url: string): NavDecision {
  if (url.startsWith('about:') || url.startsWith('data:') || url.startsWith('blob:')) return 'allow';
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return 'block';
  }
  const host = u.hostname.replace(/^www\./, '');
  if (host === 'lecercle127.com') {
    if (u.pathname.startsWith('/lecture-de-reve') || u.pathname.startsWith('/wp-admin') || u.pathname.startsWith('/wp-login')) return 'block';
    return 'allow';
  }
  if (host.endsWith('stripe.com')) return 'block';
  if (u.protocol === 'mailto:' || u.protocol === 'tel:' || u.protocol === 'https:' || u.protocol === 'http:') return 'external';
  return 'block';
}

export function siteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return SITE + (path.startsWith('/') ? path : `/${path}`);
}
