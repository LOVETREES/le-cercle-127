/* Cercle 127 — Terra Plus : mudras illustrés, schéma des lignes, fin de lecture claire, une lecture par jour. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var GOLD = '#d8b66b';
  var inApp = !!window.ReactNativeWebView || /Cercle127App/.test(navigator.userAgent);

  /* ---------- Illustrations des mudras (bibliothèque du site) ---------- */
  var UP = 'https://lecercle127.com/wp-content/uploads/2026/11/';
  var MUDRAS = {
    prithvi: { img: 'Terra-Prithvi-Mudra', how: 'Le bout du pouce rejoint le bout de l’annulaire (4e doigt). Index, majeur et auriculaire restent détendus.' },
    jnana: { img: 'Terra-Jnana-Mudra', how: 'Le bout du pouce rejoint le bout de l’index et forme un petit cercle. Les trois autres doigts restent détendus.' },
    anjali: { img: 'Terra-Anjali-Mudra', how: 'Les deux paumes se rejoignent devant la poitrine, doigts vers le haut, sans appuyer.' },
    dhyana: { img: 'Terra-Dhyana-Mudra-v2', how: 'Les mains reposent l’une dans l’autre, paumes vers le ciel ; les pouces se touchent légèrement.' }
  };
  var MUDRA_KEYS = [['prithvi', /prithvi/i], ['jnana', /jnana|jñana/i], ['anjali', /anjali/i], ['dhyana', /dhyana/i]];

  function drawMudra(root) {
    var nameEl = root.querySelector('[data-mudra-name]');
    var vis = root.querySelector('[data-mudra-visual]');
    if (!nameEl || !vis) return;
    var name = nameEl.textContent || '';
    var key = null;
    MUDRA_KEYS.forEach(function (k) { if (!key && k[1].test(name)) key = k[0]; });
    if (!key || vis.getAttribute('data-c127') === key) return;
    var m = MUDRAS[key];
    var short = name.split('—')[0].trim();
    vis.setAttribute('data-c127', key);
    vis.classList.add('c127-mudra');
    vis.removeAttribute('aria-hidden');
    vis.innerHTML = '<img src="' + UP + m.img + '-300x300.png" srcset="' + UP + m.img + '-300x300.png 300w, ' + UP + m.img + '-768x768.png 768w" sizes="260px" width="300" height="300" loading="lazy" alt="Illustration du geste ' + short + '">' +
      '<p class="c127-mudra__how"><strong>Comment faire :</strong> ' + m.how + '</p>';
  }

  /* ---------- Schéma de la main : la ligne travaillée s'allume ---------- */
  var HAND = 'M330 1400C300 1280 210 1180 190 1040C172 920 120 800 100 690C88 620 125 585 170 600C200 610 215 560 232 520C232 400 235 250 258 175C275 140 320 140 330 175C345 260 350 400 358 505C362 400 378 220 400 130C415 85 490 85 508 130C525 230 530 400 532 500C540 400 566 270 585 190C600 150 655 150 668 190C685 280 690 420 692 520C705 440 740 340 762 300C778 270 820 275 828 310C838 380 830 470 818 560C835 700 860 800 850 900C840 1050 740 1250 700 1400Z';
  var LINES = {
    heart: { n: 'Ligne de cœur', c: '#e8a3ae', d: 'M826 640 C720 600 600 590 500 610 C440 622 400 600 372 560',
      w: 'La plus haute des grandes lignes : elle part sous l’auriculaire et traverse la paume vers l’index ou le majeur.' },
    head: { n: 'Ligne de tête', c: '#d6b66c', d: 'M236 650 C340 690 480 720 600 760 C680 786 740 820 790 860',
      w: 'Juste en dessous : elle part entre le pouce et l’index et file en travers de la paume.' },
    life: { n: 'Ligne de vie', c: '#69bd7d', d: 'M236 660 C300 760 330 860 320 980 C312 1080 330 1180 380 1290',
      w: 'Elle fait le tour de la base du pouce, en arc, jusqu’au poignet.' },
    fate: { n: 'Ligne du destin', c: '#8fc8e8', d: 'M560 1330 C556 1150 548 960 540 640',
      w: 'Verticale, au milieu de la paume, du poignet vers le majeur. Elle peut être absente : c’est fréquent.' }
  };
  var ORDER = ['heart', 'head', 'life', 'fate'];

  function buildDiagram(root) {
    var panel = root.querySelector('[data-step="5"]');
    var cards = panel && panel.querySelector('.terra127__linecards');
    if (!cards || panel.querySelector('.c127-linemap')) return;

    var fig = document.createElement('figure');
    fig.className = 'c127-linemap';
    var svg = '<svg viewBox="60 60 860 1360" role="img" aria-label="Schéma de la main avec ses quatre grandes lignes">' +
      '<path d="' + HAND + '" fill="rgba(42,63,122,.35)" stroke="' + GOLD + '" stroke-opacity=".7" stroke-width="7"/>';
    ORDER.forEach(function (k) {
      var L = LINES[k];
      svg += '<path class="c127-line" data-k="' + k + '" d="' + L.d + '" stroke="' + L.c + '" stroke-width="16" stroke-linecap="round" fill="none"/>';
    });
    svg += '</svg>';
    fig.innerHTML = svg + '<figcaption><strong class="c127-linemap__title">Touche une ligne pour la repérer</strong>' +
      '<span class="c127-linemap__where">Compare ta paume au schéma : la ligne qui s’allume est celle que tu observes.</span>' +
      '<span class="c127-linemap__progress"></span></figcaption>';
    cards.parentNode.insertBefore(fig, cards);

    var byKey = {};
    cards.querySelectorAll('.terra127__linecard').forEach(function (card) {
      var sel = card.querySelector('[data-field$="_length"]');
      if (!sel) return;
      var k = sel.getAttribute('data-field').replace('_length', '');
      if (!LINES[k]) return;
      byKey[k] = card;
      card.setAttribute('data-c127-line', k);
      card.style.setProperty('--c127-line', LINES[k].c);
      var hint = document.createElement('p');
      hint.className = 'c127-where';
      hint.innerHTML = '<span aria-hidden="true">◉</span> Où la trouver ? ' + LINES[k].w;
      var h4 = card.querySelector('h4');
      if (h4) h4.after(hint);
      card.addEventListener('focusin', function () { focus(k); });
      card.addEventListener('click', function () { focus(k); });
      card.querySelectorAll('select').forEach(function (s) { s.addEventListener('change', function () { refresh(); focus(k); }); });
    });

    fig.querySelectorAll('.c127-line').forEach(function (p) {
      p.addEventListener('click', function () {
        var k = p.getAttribute('data-k');
        focus(k);
        if (byKey[k]) byKey[k].scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    function done(k) {
      var c = byKey[k];
      if (!c) return false;
      return [].some.call(c.querySelectorAll('select'), function (s) { return !!s.value; });
    }
    function refresh() {
      var n = 0;
      ORDER.forEach(function (k) {
        var ok = done(k);
        if (ok) n++;
        fig.querySelector('.c127-line[data-k="' + k + '"]').classList.toggle('is-done', ok);
        if (byKey[k]) byKey[k].classList.toggle('c127-done', ok);
      });
      fig.querySelector('.c127-linemap__progress').textContent = n + ' / 4 lignes observées' + (n === 4 ? ' ✓' : '');
    }
    function focus(k) {
      fig.setAttribute('data-focus', k);
      fig.querySelectorAll('.c127-line').forEach(function (p) { p.classList.toggle('is-focus', p.getAttribute('data-k') === k); });
      fig.querySelector('.c127-linemap__title').textContent = LINES[k].n;
      fig.querySelector('.c127-linemap__title').style.color = LINES[k].c;
      fig.querySelector('.c127-linemap__where').textContent = LINES[k].w;
      ORDER.forEach(function (x) { if (byKey[x]) byKey[x].classList.toggle('c127-active', x === k); });
    }
    refresh();
    focus('heart');
  }

  /* ---------- Une lecture par jour ---------- */
  var DAY_KEY = 'c127_terra_day';
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function dayOf(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function readToday() {
    var r = null;
    try { r = JSON.parse(localStorage.getItem(DAY_KEY) || 'null'); } catch (_) {}
    if (r && r.d === today()) return r;
    var app = window.C127_LAST_PALM; // fourni par l'application (qui garde ses lectures)
    if (app && app.at && dayOf(app.at) === today()) return { d: today(), word: app.word, mantra: app.mantra, mudra: app.mudra, question: app.question };
    return null;
  }
  function saveToday(root) {
    var q = function (s) { var e = root.querySelector(s); return e ? String(e.textContent || '').trim() : ''; };
    var r = { d: today(), word: q('[data-terra-word]'), mantra: q('[data-mantra]'), mudra: q('[data-mudra-name]'), question: q('[data-question]') };
    if (!r.word) return;
    try { localStorage.setItem(DAY_KEY, JSON.stringify(r)); } catch (_) {}
  }
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function dayLock(root) {
    if (/[?&]terra=nouveau\b/.test(location.search)) return false;
    var r = readToday();
    if (!r) return false;
    var card = document.createElement('div');
    card.className = 'c127-daycard';
    card.setAttribute('role', 'status');
    card.innerHTML =
      '<p class="c127-daycard__eyebrow">TA MAIN DU JOUR</p>' +
      '<h3>Ta main a déjà parlé aujourd’hui</h3>' +
      '<p>Terra propose une seule lecture par jour : le temps de laisser le geste et la question faire leur chemin. Reviens demain pour une nouvelle lecture.</p>' +
      (r.word ? '<blockquote>' + esc(r.word) + '</blockquote>' : '') +
      (r.mantra ? '<p><span class="c127-daycard__label">MANTRA</span><br>' + esc(r.mantra) + '</p>' : '') +
      (r.mudra ? '<p><span class="c127-daycard__label">GESTE</span><br>' + esc(r.mudra) + '</p>' : '') +
      (r.question ? '<p><span class="c127-daycard__label">QUESTION POUR LE GRIMOIRE</span><br>' + esc(r.question) + '</p>' : '') +
      (inApp ? '<p class="c127-daycard__muted">Ta lecture complète est gardée dans « Mes lectures » de l’application.</p>' : '');
    root.classList.add('c127-day-done');
    root.insertBefore(card, root.firstChild);
    return true;
  }

  /* ---------- Fin de lecture claire ---------- */
  function finale(root) {
    var panel = root.querySelector('[data-step="6"]');
    if (!panel) return;
    var shown = false;
    var check = function () {
      var visible = !panel.hidden;
      if (visible && !shown) {
        shown = true;
        if (!panel.querySelector('.c127-finale')) {
          var b = document.createElement('div');
          b.className = 'c127-finale';
          b.setAttribute('role', 'status');
          b.innerHTML = '<span class="c127-finale__check" aria-hidden="true">✓</span><div><strong>Ta lecture de la main est terminée.</strong><br>' +
            (inApp ? 'Elle est gardée automatiquement dans « Mes lectures ». Voici ta carte du jour.' :
              'Voici ta carte du jour. Dépose-la dans ton Grimoire pour la retrouver.') + '</div>';
          panel.insertBefore(b, panel.firstChild);
          var anchor = panel.querySelector('[data-save]') || panel.querySelector('[data-print]');
          if (anchor) {
            var e = b.cloneNode(true);
            e.classList.add('c127-finale--end');
            e.querySelector('div').innerHTML = inApp ?
              '<strong>C’est fait : ta lecture est enregistrée.</strong><br>Retrouve-la quand tu veux dans « Mes lectures ». Terra t’attend demain pour une nouvelle lecture.' :
              '<strong>Ta lecture est prête.</strong><br>Touche « Déposer cette pratique dans le Grimoire » pour la garder. Terra t’attend demain pour une nouvelle lecture.';
            var host = anchor.closest('.terra127__actions') || anchor;
            host.parentNode.insertBefore(e, host);
          }
        }
        setTimeout(function () { saveToday(root); }, 800);
      }
      if (!visible) shown = false;
    };
    new MutationObserver(check).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
    check();
    if (inApp) root.classList.add('c127-in-app');
  }

  function boot(n) {
    var root = document.querySelector('[data-terra127], section.terra127');
    if (!root || !root.querySelector('[data-step="6"]')) { if (n < 60) setTimeout(function () { boot(n + 1); }, 200); return; }
    if (root.getAttribute('data-c127-plus') === '1') return;
    root.setAttribute('data-c127-plus', '1');
    dayLock(root);
    buildDiagram(root);
    finale(root);
    var nameEl = root.querySelector('[data-mudra-name]');
    if (nameEl) {
      new MutationObserver(function () { drawMudra(root); }).observe(nameEl, { childList: true, characterData: true, subtree: true });
      drawMudra(root);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(0); });
  else boot(0);
})();
