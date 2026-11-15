import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { prepareAppHtml } from '../lib/app-html';

describe('pages intégrées à l’app', () => {
  it('ouvre l’import de la main sur Android sans forcer une caméra non autorisée', () => {
    const page = '<head></head><body><label class="terra127__upload"><input type="file" accept="image/*" capture="environment" data-file><span>Prendre une photo<br>ou importer</span></label><label><input type="file" capture="user" id="other"></label></body>';
    const dom = new JSDOM(prepareAppHtml(page, 'https://lecercle127.com/terra-gardienne-de-lancrage/', 'android'));
    const input = dom.window.document.querySelector('[data-file]')!;
    expect(input.hasAttribute('capture')).toBe(false);
    expect(input.getAttribute('type')).toBe('file');
    expect(input.getAttribute('accept')).toBe('image/*');
    expect(input.closest('label')!.textContent).toContain('Choisir une photo de ma main');
    expect(dom.window.document.querySelector('#other')!.getAttribute('capture')).toBe('user');
    dom.window.close();
    const ios = new JSDOM(prepareAppHtml(page, 'https://lecercle127.com/terra-gardienne-de-lancrage/', 'ios'));
    expect(ios.window.document.querySelector('[data-file]')!.getAttribute('capture')).toBe('environment');
    ios.window.close();
  });

  it('accepte aussi l’attribut capture sans valeur utilisé par les champs photo', () => {
    const html = prepareAppHtml('<label><input type="file" data-file capture><span>Photo</span></label>', 'https://lecercle127.com/', 'android');
    const dom = new JSDOM(html);
    expect(dom.window.document.querySelector('input')!.hasAttribute('capture')).toBe(false);
    dom.window.close();
  });
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
  it('désactive le bandeau du site et ses scripts, tout en retirant un ancien base URL', () => {
    const html = prepareAppHtml('<head><base href="https://old.example"><script id="cmplz-cookiebanner-js" src="/wp-content/plugins/complianz-gdpr/cookiebanner/js/complianz.min.js"></script></head><body><div class="cmplz-cookiebanner">Choisir</div></body>', 'https://lecercle127.com/test/?a=1&b=2');
    const dom = new JSDOM(html);
    expect(dom.window.document.querySelectorAll('base')).toHaveLength(1);
    expect(dom.window.document.querySelector('base')!.getAttribute('href')).toBe('https://lecercle127.com/test/?a=1&b=2');
    expect(dom.window.getComputedStyle(dom.window.document.querySelector('.cmplz-cookiebanner')!).display).toBe('none');
    expect(dom.window.document.querySelector('script[src*="complianz"]')).toBeNull();
    dom.window.close();
  });
});
