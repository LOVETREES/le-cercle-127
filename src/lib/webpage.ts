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

const GRIMOIRE_HINT_CSS =
  '.c127-app-hint{margin:0 0 16px;padding:14px 16px;border:1px solid rgba(223,194,125,.5);border-radius:14px;background:#11172b;color:#f2eadc;font:400 15px/1.45 Manrope,system-ui,sans-serif}' +
  '.c127-app-hint a{display:inline-block;margin-top:10px;padding:10px 16px;border-radius:999px;background:#e8cf8f;color:#1b1730!important;font-weight:600;text-decoration:none}';

/**
 * Au-dessus des formulaires « confier un rêve » du site, propose l'écran Rêve de l'application,
 * le seul qui enregistre le rêve dans le Grimoire du compte connecté dans l'app.
 */
const GRIMOIRE_HINT_JS =
  "function c127hint(){document.querySelectorAll('form.wpcf7-form').forEach(function(f){" +
  "if(f.dataset.c127hint||!f.querySelector('textarea'))return;f.dataset.c127hint='1';" +
  "var d=document.createElement('div');d.className='c127-app-hint';" +
  "d.innerHTML='Pour qu’il rejoigne votre Grimoire, confiez ce rêve depuis l’écran Rêve de l’application.<br><a href=\"cercle127://reve\">Confier mon rêve dans l’app</a>';" +
  "f.parentNode.insertBefore(d,f);});}" +
  "if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',c127hint);else c127hint();setTimeout(c127hint,1500);";

/** Remonte à l'application les erreurs JavaScript des pages du site (diagnostic). */
const ERROR_BRIDGE_JS =
  "window.addEventListener('error',function(e){try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'c127-web-error',message:String(e.message||e),source:String(e.filename||''),line:e.lineno||0,page:location.pathname}))}catch(x){}});" +
  "window.addEventListener('unhandledrejection',function(e){try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'c127-web-error',message:'Promesse rejetée : '+String(e.reason&&e.reason.message||e.reason),source:'',line:0,page:location.pathname}))}catch(x){}});";

export function injectedScript(): string {
  const css = HIDE_SITE_CHROME_CSS + GRIMOIRE_HINT_CSS;
  // Le style est ajouté dès que la page existe (le script peut s'exécuter avant elle).
  return `(function(){if(window.__c127)return;window.__c127=1;${ERROR_BRIDGE_JS}function st(){var r=document.head||document.documentElement;if(!r)return setTimeout(st,30);var s=document.createElement('style');s.innerHTML=${JSON.stringify(css)};r.appendChild(s);}st();${GRIMOIRE_HINT_JS}})();true;`;
}

export type NavDecision = 'allow' | 'external' | 'block' | 'native';

/**
 * Pages du site remplacées par un écran de l'application : un rêve confié ou un compte
 * créé depuis l'app est ainsi relié au Grimoire de l'utilisateur connecté.
 */
const NATIVE_ROUTES: [RegExp, string][] = [
  [/^\/(parcours-reve-127|interpreter-mon-reve|raconter-un-reve)(\/|$)/, '/reve'],
  [/^\/(grimoire|mon-espace)(\/|$)/, '/grimoire'],
  [/^\/creer-un-compte(\/|$)/, '/connexion'],
  [/^\/oracle-127(\/|$)/, '/oracle'],
];

/** Écran de l'application à ouvrir à la place d'une page du site, ou undefined. */
export function nativeRouteFor(url: string): string | undefined {
  const m = url.match(/^cercle127:\/\/(.+)$/);
  if (m) return '/' + m[1].replace(/^\/+/, '');
  const u = url.match(/^https?:\/\/(?:www\.)?lecercle127\.com(\/[^?#]*)?/);
  if (!u) return undefined;
  const path = u[1] ?? '/';
  for (const [re, route] of NATIVE_ROUTES) if (re.test(path)) return route;
  return undefined;
}

export type NavRequest = { url: string; isTopFrame?: boolean; navigationType?: string };

/**
 * Où ouvrir un chargement demandé par une page du site.
 * Les cadres intégrés (reCAPTCHA, widgets, vidéos…) se chargent dans la page :
 * seuls les vrais clics de l'utilisateur vers un autre site ouvrent le navigateur.
 */
export function decideRequest(req: NavRequest): NavDecision {
  if (req.isTopFrame === false) return 'allow';
  const userAction = req.navigationType === undefined || req.navigationType === 'click' || req.navigationType === 'formsubmit';
  if (userAction && nativeRouteFor(req.url)) return 'native';
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
