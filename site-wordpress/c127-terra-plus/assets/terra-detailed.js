/* Cercle 127 — Terra : lecture détaillée de la main sur photo, et la main dans le temps. */
(function () {
  'use strict';
  var CFG = window.C127TerraDetailed || {};
  var inApp = !!window.ReactNativeWebView || /Cercle127App/.test(navigator.userAgent);
  var MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  var MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
  var LINES = { heart: ['Ligne de cœur', '#e8a3ae'], head: ['Ligne de tête', '#d6b66c'], life: ['Ligne de vie', '#69bd7d'], fate: ['Ligne du destin', '#8fc8e8'], sun: ['Ligne du soleil', '#f2dea8'] };
  var SECTIONS = [['overview', 'Vue d’ensemble', '#d8b66b'], ['heart', 'Cœur · tes liens', '#e8a3ae'], ['head', 'Tête · tes choix', '#d6b66c'], ['life', 'Vie · ton énergie', '#69bd7d'], ['fate', 'Destin · ta direction', '#8fc8e8'], ['mounts', 'Monts et doigts · tes forces', '#d9cdfb'], ['month', 'Ce que ta main t’invite à vivre ce mois-ci', '#f2dea8']];
  var FIELD = { length: 'longueur', depth: 'profondeur', shape: 'forme', present: 'présence' };

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(iso) { try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (_) { return iso; } }
  function api(path, opts) {
    opts = opts || {};
    return fetch(CFG.rest + path, {
      method: opts.method || 'GET', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': CFG.nonce || '' },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, data: j }; }); });
  }

  /* ---------- MediaPipe : la main est-elle bien là, et ses proportions ---------- */
  var landmarkerP = null;
  function landmarker() {
    if (!landmarkerP) {
      landmarkerP = import(MP + '/vision_bundle.mjs').then(function (m) {
        return m.FilesetResolver.forVisionTasks(MP + '/wasm').then(function (files) {
          return m.HandLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL }, runningMode: 'IMAGE', numHands: 1 });
        });
      });
    }
    return landmarkerP;
  }
  function d(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function metricsFrom(p) {
    var palmLen = d(p[0], p[9]);
    if (!palmLen) return {};
    return {
      palm_width_to_length: d(p[5], p[17]) / palmLen,
      middle_finger_to_palm: (d(p[9], p[10]) + d(p[10], p[11]) + d(p[11], p[12])) / palmLen,
      index_to_ring: (d(p[5], p[6]) + d(p[6], p[7]) + d(p[7], p[8])) / Math.max(0.0001, d(p[13], p[14]) + d(p[14], p[15]) + d(p[15], p[16])),
      thumb_to_palm: (d(p[1], p[2]) + d(p[2], p[3]) + d(p[3], p[4])) / palmLen,
      little_to_palm: (d(p[17], p[18]) + d(p[18], p[19]) + d(p[19], p[20])) / palmLen
    };
  }
  var BONES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];

  function loadImage(file) {
    return new Promise(function (ok, ko) {
      var img = new Image();
      img.onload = function () { ok(img); };
      img.onerror = ko;
      img.src = URL.createObjectURL(file);
    });
  }
  function toJpeg(img) {
    var max = 1400, s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    var c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  /* ---------- Affichage d'une lecture ---------- */
  function renderReading(item) {
    var r = item.reading || {};
    var box = el('article', 'c127d-reading');
    box.appendChild(el('p', 'c127d-eyebrow', 'LECTURE DÉTAILLÉE · ' + esc(fmt(item.at)).toUpperCase() + (item.hand && item.hand !== 'inconnue' ? ' · MAIN ' + esc(item.hand).toUpperCase() : '')));
    box.appendChild(el('h3', 'c127d-title', esc(r.title || 'Ta main, aujourd’hui')));
    SECTIONS.forEach(function (s) {
      if (!r[s[0]]) return;
      var sec = el('section', 'c127d-sec');
      sec.style.setProperty('--c', s[2]);
      sec.appendChild(el('h4', null, esc(s[1])));
      sec.appendChild(el('p', null, esc(r[s[0]]).replace(/\n/g, '<br>')));
      box.appendChild(sec);
    });
    function list(title, arr, cls) {
      if (!arr || !arr.length) return;
      var s = el('section', 'c127d-sec ' + cls);
      s.appendChild(el('h4', null, title));
      var ul = el('ul');
      arr.forEach(function (x) { ul.appendChild(el('li', null, esc(x))); });
      s.appendChild(ul); box.appendChild(s);
    }
    list('Tes forces', r.strengths, 'c127d-strengths');
    list('À accueillir avec douceur', r.watch, 'c127d-watch');
    var ritual = el('section', 'c127d-ritual');
    if (r.mudra && r.mudra.name) ritual.appendChild(el('p', null, '<span>LE GESTE</span><br><strong>' + esc(r.mudra.name) + '</strong><br>' + esc(r.mudra.how || '')));
    if (r.mantra) ritual.appendChild(el('p', null, '<span>TON MANTRA</span><br><em>« ' + esc(r.mantra) + ' »</em>'));
    if (r.question) ritual.appendChild(el('p', null, '<span>QUESTION POUR LE GRIMOIRE</span><br>' + esc(r.question)));
    box.appendChild(ritual);
    if (item.evolution) {
      var ev = el('section', 'c127d-evolution');
      ev.appendChild(el('h4', null, '◷ Ce qui a bougé depuis ta lecture précédente'));
      ev.appendChild(el('p', null, esc(item.evolution)));
      (item.changes || []).forEach(function (c) {
        var L = LINES[c.line] || [c.line, '#ccc'];
        ev.appendChild(el('p', 'c127d-change', '<b style="color:' + L[1] + '">' + esc(L[0]) + '</b> · ' + esc(FIELD[c.field] || c.field) + ' : ' + esc(String(c.from)) + ' → ' + esc(String(c.to))));
      });
      box.appendChild(ev);
    }
    box.appendChild(el('p', 'c127d-muted', 'Une lecture symbolique, pour réfléchir et s’ancrer : jamais un diagnostic ni une prédiction.'));
    var del = el('button', 'c127d-del', 'Supprimer cette lecture');
    del.type = 'button';
    del.addEventListener('click', function () {
      if (!window.confirm('Supprimer cette lecture ? Elle et sa fiche d’observations seront effacées de ton compte.')) return;
      del.disabled = true;
      api('detailed/' + encodeURIComponent(item.id), { method: 'DELETE' }).then(function () { load(); }, function () { del.disabled = false; });
    });
    box.appendChild(del);
    return box;
  }

  function renderTimeline(items) {
    if (items.length < 1) return null;
    var wrap = el('section', 'c127d-timeline');
    wrap.appendChild(el('h3', null, 'Ma main dans le temps'));
    wrap.appendChild(el('p', 'c127d-muted', items.length < 2 ? 'Refais une lecture détaillée dans quelques semaines : Terra comparera tes lignes. Les lignes changent lentement ; garde la même main et une lumière semblable.' : 'Chaque colonne est une lecture. Un changement compte surtout s’il se confirme d’une lecture à l’autre.'));
    var table = el('div', 'c127d-grid');
    var recent = items.slice(0, 6).reverse();
    table.style.gridTemplateColumns = '120px repeat(' + recent.length + ', minmax(92px, 1fr))';
    table.appendChild(el('div', 'c127d-cell c127d-head', ''));
    recent.forEach(function (it) { table.appendChild(el('div', 'c127d-cell c127d-head', esc(new Date(it.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })))); });
    Object.keys(LINES).forEach(function (k) {
      table.appendChild(el('div', 'c127d-cell c127d-line', '<span style="color:' + LINES[k][1] + '">●</span> ' + esc({ heart: 'Cœur', head: 'Tête', life: 'Vie', fate: 'Destin', sun: 'Soleil' }[k])));
      recent.forEach(function (it, i) {
        var l = ((it.observations || {}).lines || {})[k] || {};
        var prev = i ? ((((recent[i - 1].observations || {}).lines) || {})[k] || {}) : null;
        var txt = l.present === false ? 'absente' : [l.length, l.depth].filter(Boolean).join(' · ');
        var changed = prev && txt && (prev.length !== l.length || prev.depth !== l.depth || prev.present !== l.present);
        table.appendChild(el('div', 'c127d-cell' + (changed ? ' c127d-changed' : '') + ((l.visibility || 1) < 0.5 ? ' c127d-faint' : ''), esc(txt || '—')));
      });
    });
    wrap.appendChild(table);
    var hist = el('div', 'c127d-hist');
    items.forEach(function (it, i) {
      var b = el('button', 'c127d-histbtn', esc(fmt(it.at)) + ' · ' + esc((it.reading || {}).title || 'Lecture'));
      b.type = 'button';
      b.addEventListener('click', function () { show(it); });
      hist.appendChild(b);
    });
    wrap.appendChild(hist);
    return wrap;
  }

  /* ---------- Parcours ---------- */
  var host, view;
  function show(item) {
    view.innerHTML = '';
    view.appendChild(renderReading(item));
    view.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function intro(html) {
    host.innerHTML = '';
    host.appendChild(el('p', 'c127d-eyebrow', '✦ TERRA · LECTURE DÉTAILLÉE DE TA MAIN'));
    host.appendChild(el('h2', 'c127d-h2', 'Ta main, lue comme un horoscope'));
    host.appendChild(el('p', 'c127d-lead', 'Une photo de ta paume, et Terra te remet une lecture complète : cœur, tête, vie, destin, monts, et ce que ta main t’invite à vivre ce mois-ci. Refais-la au fil des mois pour voir tes lignes évoluer.'));
    if (html) host.appendChild(el('div', 'c127d-note', html));
  }

  function form(quota) {
    var f = el('div', 'c127d-form');
    f.innerHTML =
      '<p class="c127d-tip"><b>Pour une bonne photo :</b> paume ouverte et à plat, doigts légèrement écartés, lumière du jour, toute la main dans le cadre, sans bijou si possible.</p>' +
      '<div class="c127d-hands" role="radiogroup" aria-label="Main photographiée">' +
      '<label><input type="radio" name="c127d-hand" value="droite" checked> Main droite</label>' +
      '<label><input type="radio" name="c127d-hand" value="gauche"> Main gauche</label></div>' +
      '<label class="c127d-pick">📷 Prendre ou choisir la photo<input type="file" accept="image/*" capture="environment" hidden></label>' +
      '<div class="c127d-preview" hidden><canvas></canvas><p class="c127d-check"></p></div>' +
      '<label class="c127d-consent"><input type="checkbox"> J’accepte que Terra analyse cette photo pour ma lecture. La photo est transmise de façon sécurisée à un service d’analyse d’image (OpenAI), puis <b>n’est pas conservée</b> : seules les observations de mes lignes sont gardées dans mon compte, et je peux les effacer.</label>' +
      '<label class="c127d-consent"><input type="checkbox" class="c127d-remember"> Les Sœurs peuvent <b>se souvenir</b> de cette lecture pour suivre mon chemin : seules les observations de mes lignes, jamais la photo ni le texte. Je peux l’effacer en supprimant la lecture.</label>' +
      '<button type="button" class="c127d-go" disabled>Recevoir ma lecture</button>' +
      '<p class="c127d-status" role="status"></p>' +
      (quota.plus ? '' : '<p class="c127d-muted">' + (quota.free_left > 0 ? 'Ta première lecture détaillée est offerte.' : '') + '</p>');
    var file = f.querySelector('input[type=file]'), canvas = f.querySelector('canvas'), check = f.querySelector('.c127d-check'), prev = f.querySelector('.c127d-preview');
    var consent = f.querySelector('.c127d-consent input'), go = f.querySelector('.c127d-go'), status = f.querySelector('.c127d-status');
    var photo = null, metrics = {};
    function ready() { go.disabled = !(photo && consent.checked); }
    consent.addEventListener('change', ready);
    file.addEventListener('change', function () {
      var fl = file.files && file.files[0];
      if (!fl) return;
      status.textContent = '';
      loadImage(fl).then(function (img) {
        var c = toJpeg(img);
        photo = c.toDataURL('image/jpeg', 0.86);
        canvas.width = c.width; canvas.height = c.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(c, 0, 0);
        prev.hidden = false;
        check.textContent = 'Terra repère ta main…';
        ready();
        landmarker().then(function (lm) {
          var res = lm.detect(c);
          var p = res && res.landmarks && res.landmarks[0];
          if (!p) { check.textContent = '⚠︎ Terra ne voit pas bien ta main. Tu peux envoyer quand même, ou reprendre la photo (paume face à l’objectif).'; metrics = {}; return; }
          metrics = metricsFrom(p);
          ctx.lineWidth = Math.max(2, c.width / 300); ctx.strokeStyle = 'rgba(216,182,107,.9)'; ctx.fillStyle = '#f6e3b0';
          BONES.forEach(function (b) { ctx.beginPath(); ctx.moveTo(p[b[0]].x * c.width, p[b[0]].y * c.height); ctx.lineTo(p[b[1]].x * c.width, p[b[1]].y * c.height); ctx.stroke(); });
          p.forEach(function (q) { ctx.beginPath(); ctx.arc(q.x * c.width, q.y * c.height, Math.max(3, c.width / 180), 0, 7); ctx.fill(); });
          check.textContent = '✓ Main repérée : Terra a mesuré ta paume, tes doigts et ton pouce.';
        }).catch(function () { check.textContent = 'Photo prête.'; });
      }).catch(function () { status.textContent = 'Cette image ne peut pas être ouverte. Essaie une autre photo.'; });
    });
    go.addEventListener('click', function () {
      go.disabled = true;
      var msgs = ['Terra observe la forme de ta paume…', 'Elle suit ta ligne de cœur…', 'Elle lit ta ligne de tête…', 'Elle écoute ta ligne de vie…', 'Elle cherche ta ligne du destin…', 'Elle rassemble ta lecture…'], k = 0;
      status.textContent = msgs[0];
      var timer = setInterval(function () { k = Math.min(k + 1, msgs.length - 1); status.textContent = msgs[k] + ' (cela peut prendre une minute)'; }, 9000);
      var hand = (f.querySelector('input[name=c127d-hand]:checked') || {}).value || 'inconnue';
      var remember = !!(f.querySelector('.c127d-remember') || {}).checked;
      api('detailed', { method: 'POST', body: { image: photo, hand: hand, metrics: metrics, consent: true, remember: remember, lang: (document.documentElement.lang || 'fr').slice(0, 2) } }).then(function (r) {
        clearInterval(timer);
        photo = null;
        if (r.ok && r.data.item) { status.textContent = '✓ Ta lecture est prête. La photo n’a pas été conservée.'; load(r.data.item); return; }
        status.textContent = (r.data && r.data.message) || 'Terra n’a pas pu lire ta main pour le moment. Réessaie dans quelques minutes.';
        go.disabled = false;
      }).catch(function () { clearInterval(timer); status.textContent = 'Connexion interrompue. Réessaie.'; go.disabled = false; });
    });
    return f;
  }

  function load(justDone) {
    api('detailed').then(function (r) {
      if (!r.ok) { intro('Connexion nécessaire.'); return; }
      var items = r.data.items || [], q = r.data.quota || {};
      intro();
      if (!q.plus && q.free_left < 1) host.appendChild(el('div', 'c127d-note', 'Ta première lecture détaillée t’a été offerte. Les suivantes arrivent avec <b>Le Cercle 127+</b>, très bientôt.'));
      else if (q.next_at) host.appendChild(el('div', 'c127d-note', 'Prochaine lecture détaillée possible le ' + esc(new Date(q.next_at).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })) + '. Les lignes changent lentement : une lecture par mois suffit pour suivre leur évolution.'));
      else host.appendChild(form(q));
      view = el('div', 'c127d-view');
      host.appendChild(view);
      var tl = renderTimeline(items);
      if (tl) host.appendChild(tl);
      if (justDone) show(justDone); else if (items[0]) { view.appendChild(renderReading(items[0])); }
    });
  }

  function boot(n) {
    var root = document.querySelector('[data-terra127], section.terra127');
    if (!root) { if (n < 60) setTimeout(function () { boot(n + 1); }, 200); return; }
    if (document.querySelector('.c127d')) return;
    host = el('section', 'c127d');
    root.parentNode.insertBefore(host, root);
    if (inApp) { intro('La lecture détaillée de ta main arrive très bientôt dans l’application. Tu peux déjà la faire sur <b>lecercle127.com</b>, connecté·e à ton compte.'); return; }
    if (!CFG.loggedIn) {
      intro('<a class="c127d-btn" href="' + esc(CFG.login) + '">Me connecter pour ma lecture</a> <span class="c127d-muted">La première lecture détaillée est offerte. Ton compte garde l’évolution de ta main.</span>');
      return;
    }
    load();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(0); }); else boot(0);
})();
