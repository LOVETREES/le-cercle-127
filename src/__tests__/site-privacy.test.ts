import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { prepareAppHtml } from '../lib/app-html';
import { injectedScript } from '../lib/webpage';

describe('pages sans bandeau cookies', () => {
  it('retire le bandeau statique, ses réinsertions et signale que le contenu est prêt', async () => {
    const fixture = readFileSync(new URL('./fixtures/oracle-cookie.html', import.meta.url), 'utf8');
    const dom = new JSDOM(prepareAppHtml(fixture, 'https://lecercle127.com/oracle-127/'), { runScripts: 'outside-only', url: 'https://lecercle127.com/oracle-127/' });
    const postMessage = vi.fn();
    Object.assign(dom.window, { ReactNativeWebView: { postMessage } });
    dom.window.eval(injectedScript());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(dom.window.document.querySelector('.cmplz-cookiebanner')).toBeNull();
    expect(dom.window.document.querySelector('#tirage')).not.toBeNull();
    const banner = dom.window.document.createElement('div'); banner.className = 'cmplz-cookiebanner';
    dom.window.document.body.append(banner);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(dom.window.document.querySelector('.cmplz-cookiebanner')).toBeNull();
    expect(postMessage.mock.calls.some(([message]) => JSON.parse(message).type === 'c127-ready')).toBe(true);
    expect(dom.window.document.cookie).toBe('');
    dom.window.close();
  });
});
