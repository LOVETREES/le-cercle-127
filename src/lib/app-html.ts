import { HIDE_SITE_CHROME_CSS } from './webpage';

// Scripts de mesure effectivement présents sur les pages consultées, et pixels usuels.
const ANALYTICS = /stats\.wp\.com|pixel\.wp\.com|burst-statistics|burst[-_]js|burst_before_track_hit|_stq\b|_jpStatsCheck|googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|\bfbq\s*\(/i;
const CONSENT_UI = /complianz|\bcmplz[-_]|cookieyes|cookie-law-info|wp-consent-api/i;

/** Retire les scripts de suivi connus AVANT que la WebView mobile ne lise le document. */
export function prepareAppHtml(html: string, baseUrl: string): string {
  const cleaned = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, (script) => ANALYTICS.test(script) || CONSENT_UI.test(script) ? '' : script)
    .replace(/<(?:img|iframe|link)\b[^>]*>/gi, (tag) => ANALYTICS.test(tag) ? '' : tag)
    .replace(/<base\b[^>]*>/gi, '');
  const escaped = baseUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const setup = `<base href="${escaped}"><style>${HIDE_SITE_CHROME_CSS}</style>`;
  return /<head\b[^>]*>/i.test(cleaned)
    ? cleaned.replace(/<head\b[^>]*>/i, (head) => head + setup)
    : `<!doctype html><html><head>${setup}</head><body>${cleaned}</body></html>`;
}
