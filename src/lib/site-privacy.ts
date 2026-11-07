// Les pages de l’app n’activent pas les mesures facultatives du site.
export const COOKIE_UI = '.cmplz-cookiebanner,#cmplz-cookiebanner-container,#cmplz-manage-consent,.cmplz-manage-consent,.cmplz-cookiebanner-overlay,#cookie-law-info-bar,.cky-consent-container';
export const HIDE_COOKIE_UI_CSS = COOKIE_UI.split(',').map((selector) => `html body ${selector}`).join(',') + '{display:none!important;visibility:hidden!important;pointer-events:none!important}';

export function cookieUiFilterScript(): string {
  return `(function(){const selectors=${JSON.stringify(COOKIE_UI)};let pending=false;function clean(){document.querySelectorAll(selectors).forEach(el=>el.remove());}function schedule(){if(pending)return;pending=true;setTimeout(()=>{pending=false;clean();},0);}function start(){clean();if(document.documentElement)new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});}if(document.documentElement)start();else document.addEventListener('DOMContentLoaded',start,{once:true});document.addEventListener('DOMContentLoaded',clean,{once:true});})();`;
}
