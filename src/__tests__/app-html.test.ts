import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { prepareAppHtml } from '../lib/app-html';

describe('pages intégrées à l’app', () => {
  it('retire les scripts et pixels de mesure tout en gardant les fonctions de la page', () => {
    const html = prepareAppHtml(`<html><head>
      <script src="https://stats.wp.com/e-202645.js"></script>
      <script>window._stq.push(['view']);</script>
      <script src="/wp-content/plugins/burst-statistics/assets/js/build/burst.js"></script>
      <script id="oracle">window.drawCard=function(){return 127};</script>
      <script src="/wp-content/plugins/contact-form-7/includes/js/index.js"></script>
      </head><body><img src="https://pixel.wp.com/g.gif"><h1>Oracle 127</h1></body></html>`, 'https://lecercle127.com/oracle-127/');
    expect(html).not.toMatch(/stats\.wp\.com|pixel\.wp\.com|burst-statistics|_stq/);
    const dom = new JSDOM(html);
    expect(dom.window.document.querySelector('#oracle')).not.toBeNull();
    expect(dom.window.document.querySelector('script[src*="contact-form-7"]')).not.toBeNull();
    expect(dom.window.document.querySelector('h1')?.textContent).toBe('Oracle 127');
    expect(dom.window.document.querySelector('base')?.getAttribute('href')).toBe('https://lecercle127.com/oracle-127/');
    dom.window.close();
  });
  it('conserve les choix de consentement aux cookies et retire un ancien base URL', () => {
    const html = prepareAppHtml('<head><base href="https://old.example"></head><body><div class="cmplz-cookiebanner">Choisir</div></body>', 'https://lecercle127.com/test/?a=1&b=2');
    const dom = new JSDOM(html);
    expect(dom.window.document.querySelectorAll('base')).toHaveLength(1);
    expect(dom.window.document.querySelector('base')!.getAttribute('href')).toBe('https://lecercle127.com/test/?a=1&b=2');
    expect(dom.window.getComputedStyle(dom.window.document.querySelector('.cmplz-cookiebanner')!).display).not.toBe('none');
    dom.window.close();
  });
});
