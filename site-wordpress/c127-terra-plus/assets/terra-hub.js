/* Cercle 127 — Terra : un seul espace au lieu de quatre blocs dispersés.
   Les blocs existants (atelier, lecture détaillée, ancrage, conversation) sont déplacés tels quels
   dans des onglets placés juste sous la présentation de Terra : leur fonctionnement ne change pas. */
(function () {
  'use strict';
  var inApp = !!window.ReactNativeWebView;

  function boot(n) {
    n = n || 0;
    var hero = document.querySelector('.terra-hero');
    var atelier = document.querySelector('.terra127');
    if (document.querySelector('.c127-hub')) return;
    // L'atelier et la lecture détaillée sont posés par d'autres scripts : on les attend un peu.
    if ((!hero || !atelier || !document.querySelector('.c127d')) && n < 15) { setTimeout(function () { boot(n + 1); }, 200); return; }
    if (!hero || !atelier) return;

    var tabs = [
      { key: 'main', label: 'Lire ma main', sub: 'L’atelier du jour', el: atelier },
      { key: 'photo', label: 'Lecture détaillée', sub: 'Sur photo', el: document.querySelector('.c127d') },
      { key: 'ancrage', label: 'M’ancrer', sub: '1 à 5 minutes', el: inApp ? null : document.querySelector('.c127ask--terra') },
      { key: 'parler', label: 'Parler à Terra', sub: 'Conversation', el: document.querySelector('.oschat--terra') }
    ].filter(function (t) { return t.el; });

    var hub = document.createElement('section');
    hub.className = 'c127-hub';
    hub.setAttribute('aria-label', 'Terra : choisir une pratique');
    var bar = document.createElement('div');
    bar.className = 'c127-hub__tabs';
    bar.setAttribute('role', 'tablist');
    hub.appendChild(bar);

    tabs.forEach(function (t, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'c127-hub__tab';
      b.id = 'c127-hub-tab-' + t.key;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', 'c127-hub-panel-' + t.key);
      b.innerHTML = '<b>' + t.label + '</b><small>' + t.sub + '</small>';
      bar.appendChild(b);
      var panel = document.createElement('div');
      panel.className = 'c127-hub__panel';
      panel.id = 'c127-hub-panel-' + t.key;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', b.id);
      panel.appendChild(t.el); // déplacé, pas recopié : les écouteurs restent attachés
      hub.appendChild(panel);
      t.btn = b; t.panel = panel;
      b.addEventListener('click', function () { select(i, true); });
    });

    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.btn.setAttribute('aria-selected', on ? 'true' : 'false');
        t.btn.tabIndex = on ? 0 : -1;
        t.panel.hidden = !on;
      });
      try { sessionStorage.setItem('c127_terra_tab', tabs[i].key); } catch (e) {}
      if (focus) tabs[i].btn.focus({ preventScroll: true });
    }
    bar.addEventListener('keydown', function (e) {
      var cur = tabs.findIndex(function (t) { return t.btn.getAttribute('aria-selected') === 'true'; });
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        select((cur + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true);
      }
    });

    hero.parentNode.insertBefore(hub, hero.nextSibling);
    // L'ancien conteneur de l'atelier, désormais vide, disparaît.
    var old = document.querySelector('.terra127__autoinjected');
    if (old && !old.children.length) old.remove();

    // Onglet de départ : lien direct (#c127-ask-terra-ancrage, #lecture-detaillee…), sinon le dernier utilisé, sinon l'atelier.
    var start = 0, hash = location.hash || '';
    var want = /ancrage/.test(hash) ? 'ancrage' : /detaill|photo/.test(hash) ? 'photo' : /parler|chat/.test(hash) ? 'parler' : '';
    if (!want) { try { want = sessionStorage.getItem('c127_terra_tab') || ''; } catch (e) {} }
    tabs.forEach(function (t, i) { if (t.key === want) start = i; });
    select(start, false);
    if (want && hash) setTimeout(function () { hub.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(0); }); else boot(0);
})();
