const FACEBOOK_HOSTS = ['facebook.com', 'fb.com', 'fb.me', 'fb.watch'];
const FACEBOOK_PROTOCOLS = ['fb:', 'fbapi:', 'fbauth2:'];

/** Les profils et pages Facebook ne sont pas proposés depuis l’application. */
export function isFacebookUrl(value: string, base = 'https://lecercle127.com'): boolean {
  try {
    const url = new URL(value, base);
    return FACEBOOK_PROTOCOLS.includes(url.protocol) || FACEBOOK_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith('.' + host));
  } catch {
    return false;
  }
}

/** Source explicite pour les WebViews Hermes, sans dépendre de Function.toString(). */
export function facebookFilterScript(): string {
  return String.raw`(function () {
    const hosts = ${JSON.stringify(FACEBOOK_HOSTS)};
    const protocols = ${JSON.stringify(FACEBOOK_PROTOCOLS)};
    const controls = 'a,button,[role="link"],[role="button"]';
    function facebookUrl(value) {
      try {
        const url = new URL(value, location.href);
        return protocols.includes(url.protocol) || hosts.some(host => url.hostname === host || url.hostname.endsWith('.' + host));
      } catch { return false; }
    }
    function facebookControl(el) {
      if (['href','data-href','data-url'].some(name => {
        const value = el.getAttribute(name);
        return value && facebookUrl(value);
      })) return true;
      const label = [el.textContent, el.getAttribute('aria-label'), el.getAttribute('title')].join(' ');
      if (/\bfacebook\b|\bpage\s+fb\b/i.test(label)) return true;
      return /(?:https?:)?\/\/(?:[a-z0-9-]+\.)*(?:facebook\.com|fb\.com|fb\.me|fb\.watch)(?=[/:?#'"\s]|$)/i.test(el.getAttribute('onclick') || '');
    }
    function clean() {
      document.querySelectorAll(controls).forEach(el => {
        if (facebookControl(el)) el.remove();
      });
    }
    let pending = false;
    function schedule() {
      if (pending) return;
      pending = true;
      setTimeout(() => { pending = false; clean(); }, 0);
    }
    function start() {
      clean();
      if (!document.documentElement) return;
      new MutationObserver(schedule).observe(document.documentElement, {
        subtree: true, childList: true, characterData: true,
        attributes: true, attributeFilter: ['href','data-href','data-url','aria-label','title','onclick'],
      });
    }
    if (document.documentElement) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
    document.addEventListener('click', event => {
      const control = event.target instanceof Element ? event.target.closest(controls) : null;
      if (control && facebookControl(control)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        control.remove();
      }
    }, true);
  })();`;
}
