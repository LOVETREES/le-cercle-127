/* Cercle 127 — Terra, version jeu : pastilles illustrées à la place des menus, arbre de progression,
   retours à chaque réponse et célébration finale. Le moteur de l'atelier n'est pas modifié :
   chaque pastille règle le <select> d'origine et déclenche son événement « change ». */
(function () {
  'use strict';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Petits dessins (44×28, currentColor) ---------- */
  function svg(inner) { return '<svg viewBox="0 0 44 28" aria-hidden="true" focusable="false">' + inner + '</svg>'; }
  function rr(x, y, w, h) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>'; }
  function line(x1, x2, w, extra) { return '<path d="M' + x1 + ' 14H' + x2 + '" stroke="currentColor" stroke-width="' + (w || 2.6) + '" stroke-linecap="round" fill="none" ' + (extra || '') + '/>'; }
  function fingers(len) { var s = ''; [16, 20, 24, 28].forEach(function (x) { s += '<path d="M' + x + ' 15V' + (15 - len) + '" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'; }); return s; }
  var GLYPHS = {
    palm_shape: {
      'plutôt carrée': svg(rr(15, 7, 14, 14)),
      'plutôt rectangulaire': svg(rr(16, 4, 12, 20)),
      'plutôt longue et étroite': svg(rr(18, 2, 8, 24)),
      'plutôt large': svg(rr(10, 8, 24, 13))
    },
    finger_length: {
      'courts par rapport à la paume': svg(rr(13, 15, 18, 11) + fingers(4)),
      'proportionnés': svg(rr(13, 15, 18, 11) + fingers(8)),
      'longs par rapport à la paume': svg(rr(13, 15, 18, 11) + fingers(12))
    },
    flexibility: {
      'plutôt souple': svg('<path d="M8 22Q22 -2 36 22" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/>'),
      'intermédiaire': svg('<path d="M8 20Q22 6 36 20" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/>'),
      'plutôt ferme': svg('<path d="M8 16H36" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>')
    },
    thumb: {
      'court': svg(rr(18, 6, 16, 18) + '<path d="M18 20L12 17" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'),
      'moyen': svg(rr(18, 6, 16, 18) + '<path d="M18 20L9 15" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'),
      'long': svg(rr(18, 6, 16, 18) + '<path d="M18 20L6 12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'),
      'très ouvert par rapport à la paume': svg(rr(18, 6, 16, 18) + '<path d="M18 20L5 22" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>')
    },
    mount_relief: {
      'peu marqué': svg('<path d="M4 22Q22 17 40 22" stroke="currentColor" stroke-width="2.4" fill="none"/>'),
      'modéré': svg('<path d="M4 22Q22 9 40 22" stroke="currentColor" stroke-width="2.4" fill="none"/>'),
      'très marqué': svg('<path d="M4 22Q22 -4 40 22" stroke="currentColor" stroke-width="2.4" fill="none"/>')
    },
    length: { 'courte': svg(line(16, 28)), 'moyenne': svg(line(11, 33)), 'longue': svg(line(5, 39)) },
    aspect: {
      'fine': svg(line(6, 38, 1.3)),
      'profonde': svg(line(6, 38, 4.6)),
      'courbe': svg('<path d="M6 20Q22 2 38 20" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/>'),
      'droite': svg(line(6, 38)),
      'discontinue': svg(line(6, 38, 2.6, 'stroke-dasharray="5 4"')),
      'bifurquée': svg('<path d="M6 16H24M24 16L38 8M24 16L38 22" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/>')
    }
  };
  var LINE_COLORS = { heart: '#e8a3ae', head: '#d6b66c', life: '#69bd7d', fate: '#8fc8e8' };
  function glyphFor(field, label) {
    var m = /^(heart|head|life|fate)_(length|aspect)$/.exec(field);
    var set = m ? GLYPHS[m[2]] : GLYPHS[field];
    return (set && set[label]) || '';
  }
  function shortLabel(label) {
    return label.replace(/^plutôt /, '').replace(' par rapport à la paume', '').replace('longue et étroite', 'longue, étroite');
  }

  /* ---------- Mémoire locale ---------- */
  function load() { try { return JSON.parse(localStorage.getItem('c127_terra_jeu') || '{}'); } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem('c127_terra_jeu', JSON.stringify(s)); } catch (e) {} }
  function soundOn() { try { return (JSON.parse(localStorage.getItem('c127ov') || '{}').sound) !== false; } catch (e) { return true; } }
  function dayKey(off) { var d = new Date(Date.now() - (off || 0) * 864e5); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /* ---------- Son et vibration (doux) ---------- */
  var AC = null;
  function tone(freqs, vol, dur) {
    if (!soundOn()) return;
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { return; }
    freqs.forEach(function (f, i) {
      var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + i * 0.09;
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.05);
    });
  }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  /* ---------- Feuilles et poussière d'or ---------- */
  var cv = null, parts = [], running = false;
  function leaves(x, y, n, rain) {
    if (REDUCED) return;
    if (!cv) { cv = document.createElement('canvas'); cv.className = 'c127j-canvas'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv); }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cols = ['#69bd7d', '#8fcf8f', '#b9d98a', '#e9cf86', '#d8b66b'];
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = rain ? 0.6 + Math.random() * 1.6 : 1.5 + Math.random() * 3.5;
      parts.push({ x: rain ? Math.random() * innerWidth : x, y: rain ? -20 - Math.random() * innerHeight * 0.5 : y,
        vx: rain ? (Math.random() - 0.5) * 1.2 : Math.cos(a) * sp, vy: rain ? sp : Math.sin(a) * sp - 2,
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2, life: rain ? 2.4 : 1, s: 3 + Math.random() * 4, col: cols[i % cols.length], gold: i % 4 === 0 });
    }
    if (!running) { running = true; requestAnimationFrame(step); }
    function step() {
      c.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter(function (p) { return p.life > 0 && p.y < innerHeight + 40; });
      parts.forEach(function (p) {
        p.vy += 0.05; p.vx += Math.sin(p.rot) * 0.03; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.012;
        c.globalAlpha = Math.min(1, Math.max(0, p.life));
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.col;
        if (p.gold) { c.beginPath(); c.arc(0, 0, p.s * 0.35, 0, 7); c.fill(); }
        else { c.beginPath(); c.ellipse(0, 0, p.s, p.s * 0.45, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(20,40,20,.35)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-p.s, 0); c.lineTo(p.s, 0); c.stroke(); }
        c.restore();
      });
      c.globalAlpha = 1;
      if (parts.length) requestAnimationFrame(step); else { running = false; c.clearRect(0, 0, innerWidth, innerHeight); }
    }
  }

  /* ---------- Arbre de progression ---------- */
  var LEVELS = [
    { at: 0, name: 'Graine', icon: '🌰', say: 'Terra commence à te découvrir.' },
    { at: 20, name: 'Pousse', icon: '🌱', say: 'Tes premières racines apparaissent.' },
    { at: 45, name: 'Arbuste', icon: '🌿', say: 'Ta main prend forme.' },
    { at: 70, name: 'Arbre', icon: '🌲', say: 'Ta carte se déploie.' },
    { at: 100, name: 'Canopée', icon: '🌳', say: 'Ta carte de main est complète.' }
  ];
  function levelOf(p) { var l = LEVELS[0]; LEVELS.forEach(function (x) { if (p >= x.at) l = x; }); return l; }

  function init(root) {
    if (root.getAttribute('data-c127j')) return;
    var selects = Array.prototype.slice.call(root.querySelectorAll('select[data-field]'));
    if (!selects.length || selects.some(function (s) { return s.options.length < 2; })) return; // options pas encore prêtes
    root.setAttribute('data-c127j', '1');
    var S = load();
    var handChosen = false;

    var meter = document.createElement('div');
    meter.className = 'c127j-meter wp-exclude-emoji';
    meter.innerHTML = '<span class="c127j-tree wp-exclude-emoji" aria-hidden="true"></span><div class="c127j-meter__txt"><b class="c127j-lvl"></b><span class="c127j-say"></span>' +
      '<div class="c127j-bar" role="progressbar" aria-label="Ta carte de main" aria-valuemin="0" aria-valuemax="100"><i></i></div></div><span class="c127j-pct"></span>';
    var nav = root.querySelector('.terra127__steps');
    var slot = document.createElement('div');
    slot.className = 'c127j-slot';
    slot.appendChild(meter);
    (nav && nav.parentNode ? nav.parentNode : root).insertBefore(slot, nav ? nav.nextSibling : root.firstChild);
    // Jauge discrète, dans l'atelier seulement (elle ne flotte plus par-dessus la lecture).
    var lastLevel = null;

    function progress(celebrate, fromEl) {
      var filled = selects.filter(function (s) { return s.value; }).length + (handChosen ? 1 : 0);
      var pct = Math.round(filled / (selects.length + 1) * 100);
      var lv = levelOf(pct);
      meter.querySelector('.c127j-tree').textContent = lv.icon;
      meter.querySelector('.c127j-lvl').textContent = lv.name;
      meter.querySelector('.c127j-say').textContent = ' · Terra te connaît à ' + pct + ' %';
      meter.querySelector('.c127j-bar i').style.width = Math.max(3, pct) + '%';
      meter.querySelector('.c127j-bar').setAttribute('aria-valuenow', pct);
      meter.querySelector('.c127j-pct').textContent = pct + ' %';
      if (celebrate && lastLevel && lv.name !== lastLevel) {
        meter.classList.remove('c127j-levelup'); void meter.offsetWidth; meter.classList.add('c127j-levelup');
        toast(lv.icon + ' ' + lv.name, lv.say);
        tone([523.25, 659.25, 783.99], 0.07, 0.9); buzz([12, 40, 18]);
        var r = meter.getBoundingClientRect(); leaves(r.left + 30, r.top + r.height / 2, 28);
      }
      lastLevel = lv.name;
      // Étapes accomplies
      Array.prototype.forEach.call(root.querySelectorAll('[data-step-nav]'), function (b) {
        var panel = root.querySelector('[data-step="' + b.getAttribute('data-step-nav') + '"]');
        var ss = panel ? panel.querySelectorAll('select[data-field]') : [];
        var done = ss.length ? Array.prototype.every.call(ss, function (s) { return s.value; }) : (b.getAttribute('data-step-nav') === '1' && handChosen);
        b.classList.toggle('c127j-done', !!done);
      });
      return pct;
    }

    /* Pastilles à la place des menus */
    selects.forEach(function (sel) {
      var field = sel.getAttribute('data-field');
      var lm = /^(heart|head|life|fate)_/.exec(field);
      var group = document.createElement('div');
      group.className = 'c127j-picks';
      group.setAttribute('role', 'radiogroup');
      var lab = sel.id && root.querySelector('label[for="' + sel.id + '"]');
      group.setAttribute('aria-label', (lab ? lab.textContent : (sel.closest('label') || {}).textContent || field).trim().split('\n')[0]);
      if (lm) group.style.setProperty('--c127j-accent', LINE_COLORS[lm[1]]);
      Array.prototype.forEach.call(sel.options, function (o) {
        if (!o.value) return;
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'c127j-pick'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
        b.setAttribute('data-value', o.value);
        b.innerHTML = glyphFor(field, o.textContent.trim()) + '<span>' + shortLabel(o.textContent.trim()) + '</span>';
        b.addEventListener('click', function () {
          var first = !sel.value;
          sel.value = o.value;
          sel.dispatchEvent(new Event('input', { bubbles: true }));
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          paint();
          b.classList.remove('c127j-pop'); void b.offsetWidth; b.classList.add('c127j-pop');
          buzz(10);
          if (first) { tone([880], 0.04, 0.35); var r = b.getBoundingClientRect(); leaves(r.left + r.width / 2, r.top, 6); }
          progress(true, b);
        });
        group.appendChild(b);
      });
      function paint() {
        Array.prototype.forEach.call(group.children, function (b) {
          var on = b.getAttribute('data-value') === sel.value;
          b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
        });
      }
      sel.addEventListener('change', paint);
      sel.classList.add('c127j-sr');
      sel.setAttribute('tabindex', '-1');
      sel.setAttribute('aria-hidden', 'true');
      sel.parentNode.insertBefore(group, sel.nextSibling);
      paint();
    });

    /* Main gauche / droite */
    Array.prototype.forEach.call(root.querySelectorAll('.terra127__choice'), function (c) {
      c.addEventListener('click', function () { var was = handChosen; handChosen = true; c.classList.add('c127j-pop'); if (!was) { tone([659.25], 0.05, 0.4); } progress(true, c); });
    });

    /* Entrée de chaque étape + célébration finale */
    var panels = root.querySelectorAll('[data-step]');
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        var p = m.target;
        if (!p.classList.contains('is-active') || p.getAttribute('data-c127j-in') === '1') { if (!p.classList.contains('is-active')) p.removeAttribute('data-c127j-in'); return; }
        p.setAttribute('data-c127j-in', '1');
        if (!REDUCED) { p.classList.remove('c127j-enter'); void p.offsetWidth; p.classList.add('c127j-enter'); }
        if (p.getAttribute('data-step') === '6') finale(p);
      });
    }).observe(root, { subtree: true, attributes: true, attributeFilter: ['class'] });

    function finale(panel) {
      var pct = progress(false);
      var today = dayKey(0);
      if (S.last !== today) { S.streak = S.last === dayKey(1) ? (S.streak || 1) + 1 : 1; S.last = today; S.count = (S.count || 0) + 1; save(S); }
      var lv = levelOf(pct);
      var crest = panel.querySelector('.c127j-crest');
      if (!crest) { crest = document.createElement('div'); crest.className = 'c127j-crest wp-exclude-emoji'; panel.insertBefore(crest, panel.firstChild); }
      crest.innerHTML = '<span class="c127j-crest__icon wp-exclude-emoji" aria-hidden="true">' + lv.icon + '</span>' +
        '<div><p class="c127j-crest__k">Lecture accomplie · niveau ' + lv.name + '</p>' +
        '<p class="c127j-crest__t">Ta ' + (S.count || 1) + (S.count === 1 ? 're' : 'e') + ' lecture de main avec Terra' + (S.streak > 1 ? ' · 🔥 ' + S.streak + ' jours de suite' : '') + '</p>' +
        '<p class="c127j-crest__s">' + (pct < 100 ? 'Complète les repères manquants pour atteindre la Canopée 🌳' : 'Tous les repères sont posés : ta carte est complète.') + '</p></div>';
      setTimeout(function () { try { crest.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' }); } catch (e) {} }, 120);
      setTimeout(function () {
        leaves(0, 0, 70, true);
        var r = crest.getBoundingClientRect(); leaves(r.left + 40, r.top + 30, 40);
        tone([392, 523.25, 659.25, 783.99], 0.07, 1.4); buzz([20, 60, 30, 60, 40]);
      }, 650);
      var oc = panel.querySelector('.terra127__oracle-card');
      if (oc && !REDUCED) { oc.classList.remove('c127j-flipin'); void oc.offsetWidth; oc.classList.add('c127j-flipin'); }
    }

    var toastEl = null, tt = null;
    function toast(t, s) {
      if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'c127j-toast wp-exclude-emoji'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
      toastEl.innerHTML = t + (s ? '<small>' + s + '</small>' : '');
      toastEl.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
    }
    progress(false);
  }

  function boot() {
    var root = document.querySelector('.terra127');
    if (!root) return;
    init(root);
    if (!root.getAttribute('data-c127j')) {
      var tries = 0, iv = setInterval(function () { init(root); if (root.getAttribute('data-c127j') || ++tries > 40) clearInterval(iv); }, 250);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
