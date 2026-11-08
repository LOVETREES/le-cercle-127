/* Cercle 127 — Terra Plus : mudras illustrés, schéma des lignes, fin de lecture claire, une lecture par jour. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var GOLD = '#d8b66b';
  var INK = '#11162b';
  var inApp = !!window.ReactNativeWebView || /Cercle127App/.test(navigator.userAgent);

  /* ---------- Illustrations originales des mudras (traits dorés) ---------- */
  function finger(d) {
    return '<path d="' + d + '" stroke="' + GOLD + '" stroke-width="19" stroke-linecap="round" fill="none"/>' +
      '<path d="' + d + '" stroke="' + INK + '" stroke-width="14" stroke-linecap="round" fill="none"/>';
  }
  var PALM = '<path d="M68 104 C64 150 72 178 102 180 C134 180 142 150 138 104 Z" fill="' + INK + '" stroke="' + GOLD + '" stroke-width="2.6" stroke-linejoin="round"/>' +
    '<path d="M84 168 C94 172 112 172 122 168" stroke="' + GOLD + '" stroke-opacity=".35" stroke-width="1.6" fill="none"/>';
  function spark(x, y) {
    return '<circle cx="' + x + '" cy="' + y + '" r="16" fill="url(#c127glow)"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="3.6" fill="#f6e3b0"/>';
  }
  var DEFS = '<defs><radialGradient id="c127glow"><stop offset="0" stop-color="#f6e3b0" stop-opacity=".85"/>' +
    '<stop offset="1" stop-color="#f6e3b0" stop-opacity="0"/></radialGradient></defs>';
  var IDX = 'M80 108 L77 44', MID = 'M97 104 L97 32', RING = 'M114 106 L116 40', PINKY = 'M130 112 L135 58';
  var THUMB = 'M74 146 Q52 128 46 102';

  var MUDRAS = {
    // Prithvi : pouce et annulaire se rejoignent, les autres doigts restent libres.
    prithvi: DEFS + finger(IDX) + finger(MID) + finger(PINKY) + PALM +
      finger('M114 106 Q118 84 100 96') + finger('M72 148 Q70 118 96 100') + spark(98, 98),
    // Jnana : pouce et index forment un cercle.
    jnana: DEFS + finger(MID) + finger(RING) + finger(PINKY) + PALM +
      finger('M80 108 Q76 70 56 80') + finger('M72 148 Q48 124 54 86') + spark(55, 83),
    // Anjali : les deux paumes réunies devant le cœur.
    anjali: DEFS +
      '<path d="M56 196 C70 188 80 182 86 176 M144 196 C130 188 120 182 114 176" stroke="' + GOLD + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M86 178 C78 146 72 116 76 86 C79 60 88 38 100 20 C112 38 121 60 124 86 C128 116 122 146 114 178 Z" fill="' + INK + '" stroke="' + GOLD + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M100 22 L100 176" stroke="' + GOLD + '" stroke-opacity=".6" stroke-width="1.6"/>' +
      '<path d="M93 34 C89 52 87 70 87 90 M86 52 C82 66 80 80 80 96 M107 34 C111 52 113 70 113 90 M114 52 C118 66 120 80 120 96" stroke="' + GOLD + '" stroke-opacity=".45" stroke-width="1.4" fill="none"/>' +
      '<path d="M80 136 C84 120 92 112 99 110 M120 136 C116 120 108 112 101 110" stroke="' + GOLD + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      spark(100, 122),
    // Dhyana : mains posées l'une dans l'autre, paumes vers le ciel, pouces qui se touchent.
    dhyana: DEFS +
      '<path d="M10 128 C26 126 36 122 44 116 M190 128 C174 126 164 122 156 116" stroke="' + GOLD + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M36 112 Q100 196 164 112 Q100 150 36 112 Z" fill="' + INK + '" stroke="' + GOLD + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M48 108 Q100 176 152 108 Q100 140 48 108 Z" fill="' + INK + '" stroke="' + GOLD + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M64 128 Q100 156 136 128 M74 138 Q100 158 126 138 M84 146 Q100 160 116 146" stroke="' + GOLD + '" stroke-opacity=".4" stroke-width="1.4" fill="none"/>' +
      finger('M56 108 Q64 70 97 74') + finger('M144 108 Q136 70 103 74') + spark(100, 74)
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
    vis.setAttribute('data-c127', key);
    vis.classList.add('c127-mudra');
    vis.innerHTML = '<svg viewBox="0 0 200 200" role="img" aria-label="Illustration du geste ' + name.split('—')[0].trim() + '">' + MUDRAS[key] + '</svg>';
    vis.removeAttribute('aria-hidden');
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
