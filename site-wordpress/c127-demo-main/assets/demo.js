/* Cercle 127 — démonstration animée de lecture de la main. */
(function () {
  'use strict';
  var D = window.C127DemoMain || {}; if (!D.P) return;
  var NS = 'http://www.w3.org/2000/svg', $ = function (id) { return document.getElementById(id); };
  var stage = $('c127dm-scene'), status = $('c127dm-status'), bar = $('c127dm-bar'), hud = $('c127dm-hud');
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var P = D.P;
  var BONES = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
  var NAMES = { heart: 'Cœur', head: 'Tête', life: 'Vie' };
  function mk(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  var timers = [];
  function wait(ms) { return new Promise(function (r) { timers.push(setTimeout(r, REDUCED ? 0 : ms)); }); }
  function say(t, pct) { status.textContent = t; bar.style.width = pct + '%'; }

  /* Construction des calques */
  var bones = BONES.map(function (b) {
    var l = mk('line', { class: 'bone', x1: P[b[0]][0], y1: P[b[0]][1], x2: P[b[1]][0], y2: P[b[1]][1] }, $('c127dm-bones'));
    var len = Math.hypot(P[b[1]][0] - P[b[0]][0], P[b[1]][1] - P[b[0]][1]);
    l.style.strokeDasharray = len; l.style.strokeDashoffset = len; l._len = len; return l;
  });
  var joints = P.map(function (p, i) { return mk('circle', { class: 'joint', cx: p[0], cy: p[1], r: i === 0 ? 9 : 7 }, $('c127dm-joints')); });
  var ax1 = mk('line', { class: 'axis', x1: P[0][0], y1: P[0][1], x2: P[9][0], y2: P[9][1] }, $('c127dm-frame'));
  var ax2 = mk('line', { class: 'axis', x1: P[17][0], y1: P[17][1], x2: P[5][0], y2: P[5][1] }, $('c127dm-frame'));
  var mid = lerp(P[0], P[9], 0.5);
  var axl = mk('text', { class: 'axis-l', x: mid[0] + 16, y: mid[1] }, $('c127dm-frame')); axl.textContent = '1,63';
  var groups = {};
  ['heart', 'head', 'life'].forEach(function (k) {
    var L = D.lines[k]; if (!L) return;
    var g = mk('g', { class: 'lg', 'data-k': k }, $('c127dm-lines'));
    var glow = mk('path', { class: 'pl pl-glow', d: L.d }, g), core = mk('path', { class: 'pl pl-core', d: L.d }, g);
    var len = core.getTotalLength();
    [glow, core].forEach(function (p) { p.style.strokeDasharray = len; p.style.strokeDashoffset = len; });
    var tip = mk('circle', { class: 'tip', r: 10, cx: L.a[0], cy: L.a[1] }, g); tip.style.opacity = 0;
    var spot = k === 'heart' ? core.getPointAtLength(len * 0.12) : k === 'head' ? core.getPointAtLength(len * 0.2) : core.getPointAtLength(len * 0.55);
    var t = mk('text', { class: 'lname', x: spot.x + (k === 'life' ? 18 : -14), y: spot.y + (k === 'life' ? 0 : 34), 'text-anchor': k === 'life' ? 'start' : 'end' }, g); t.textContent = NAMES[k];
    groups[k] = { glow: glow, core: core, len: len, tip: tip, tag: t };
  });
  // Les monts, posés sous la base de chaque doigt et de part et d'autre du poignet
  var M = [['Jupiter', lerp(P[5], P[0], 0.07)], ['Saturne', lerp(P[9], P[0], 0.06)], ['Apollon', lerp(P[13], P[0], 0.06)], ['Mercure', lerp(P[17], P[0], 0.07)],
    ['Vénus', lerp(lerp(P[1], P[2], 0.3), P[9], 0.12)], ['Lune', lerp(lerp(P[0], P[17], 0.42), P[9], 0.08)]];
  M.forEach(function (m) { var t = mk('text', { class: 'mount', x: m[1][0], y: m[1][1], 'text-anchor': 'middle' }, $('c127dm-mounts')); t.textContent = m[0]; });

  function draw(k, ms) {
    var G = groups[k]; if (!G) return Promise.resolve();
    var sec = document.querySelector('.dm-sec[data-k="' + k + '"]');
    if (sec) { sec.classList.remove('is-live'); void sec.offsetWidth; sec.classList.add('is-live'); }
    if (REDUCED) { G.glow.style.strokeDashoffset = 0; G.core.style.strokeDashoffset = 0; G.tag.classList.add('on'); return Promise.resolve(); }
    return new Promise(function (res) {
      var t0 = performance.now(); G.tip.style.opacity = 1;
      (function step(now) {
        var t = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - t, 3), off = G.len * (1 - e);
        G.glow.style.strokeDashoffset = off; G.core.style.strokeDashoffset = off;
        var p = G.core.getPointAtLength(G.len * e); G.tip.setAttribute('cx', p.x); G.tip.setAttribute('cy', p.y);
        if (t < 1) requestAnimationFrame(step); else { G.tip.style.opacity = 0; G.tag.classList.add('on'); res(); }
      })(t0);
    });
  }
  function sweep(ms) {
    var s = $('c127dm-sweep');
    if (REDUCED) return Promise.resolve();
    return new Promise(function (res) {
      var t0 = performance.now();
      (function step(now) { var t = Math.min(1, (now - t0) / ms); s.setAttribute('transform', 'translate(0 ' + (t * 1420) + ')'); if (t < 1) requestAnimationFrame(step); else res(); })(t0);
    });
  }
  function reset() {
    timers.forEach(clearTimeout); timers = [];
    stage.className = 'dm-scene is-raw'; hud.classList.remove('done'); delete stage.dataset.focus;
    bones.forEach(function (l) { l.style.transition = 'none'; l.style.strokeDashoffset = l._len; });
    joints.forEach(function (c) { c.classList.remove('on'); });
    [ax1, ax2, axl].forEach(function (e) { e.classList.remove('on'); });
    Object.keys(groups).forEach(function (k) { var G = groups[k]; G.glow.style.strokeDashoffset = G.len; G.core.style.strokeDashoffset = G.len; G.tag.classList.remove('on'); G.tip.style.opacity = 0; });
  }
  var run = 0;
  function play() {
    var me = ++run; reset();
    var alive = function () { return me === run; };
    say('Lecture de la photo…', 6);
    return wait(250).then(function () {
      if (!alive()) return; stage.classList.add('is-sweeping'); stage.classList.remove('is-raw');
      return sweep(1700);
    }).then(function () {
      if (!alive()) return; stage.classList.remove('is-sweeping');
      say('Repérage des points de la main…', 22);
      joints.forEach(function (c, i) {
        timers.push(setTimeout(function () { c.classList.add('on'); }, REDUCED ? 0 : i * 45));
      });
      bones.forEach(function (l, i) { timers.push(setTimeout(function () { l.style.transition = 'stroke-dashoffset .45s ease, opacity 1s'; l.style.strokeDashoffset = 0; }, REDUCED ? 0 : 200 + i * 40)); });
      return wait(1400);
    }).then(function () {
      if (!alive()) return; say('21 points repérés · proportions de la paume : 1,63', 40);
      [ax1, ax2, axl].forEach(function (e) { e.classList.add('on'); });
      return wait(1300);
    }).then(function () {
      if (!alive()) return; say('Ligne de cœur…', 55); return draw('heart', 1300);
    }).then(function () {
      if (!alive()) return; say('Ligne de tête…', 70); return draw('head', 1200);
    }).then(function () {
      if (!alive()) return; say('Ligne de vie…', 85); return draw('life', 1400);
    }).then(function () {
      if (!alive()) return; stage.classList.add('is-settled'); hud.classList.add('done');
      say('Lecture terminée · 3 lignes suivies sur tes plis réels', 100);
    });
  }
  $('c127dm-replay').addEventListener('click', play);

  /* Une section de la lecture met sa ligne en lumière sur la photo */
  var root = stage.closest('.c127dm') || document;
  var secs = root.querySelectorAll('.dm-sec');
  function focus(k) {
    secs.forEach(function (s) { s.classList.toggle('is-on', s.dataset.k === k); });
    if (groups[k]) stage.dataset.focus = k; else delete stage.dataset.focus;
  }
  secs.forEach(function (s) {
    s.addEventListener('mouseenter', function () { focus(s.dataset.k); });
    s.addEventListener('mouseleave', function () { focus(null); });
    s.addEventListener('focus', function () { focus(s.dataset.k); });
    s.addEventListener('blur', function () { focus(null); });
    s.addEventListener('click', function (e) {
      if (e.target.closest('button')) return;
      var on = stage.dataset.focus === s.dataset.k; focus(on ? null : s.dataset.k);
      if (!on && groups[s.dataset.k] && window.innerWidth < 920) stage.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
    });
  });

  var FATE = {
    nette: 'Une ligne du destin nette, qui monte vers le majeur : tu as un sens de la direction, une vocation qui te tient. Avec une main de Feu, c’est le carburant qui donne une route à ton élan.',
    legere: 'Une ligne légère ou faite de morceaux : ton chemin se construit par étapes, au gré des rencontres. Plus de liberté qu’un destin tout tracé, ce qui va bien à une main de Feu.',
    absente: 'Pas de ligne du destin visible : c’est très courant. Elle dit une vie que tu inventes au jour le jour, sans scénario imposé.'
  };
  root.querySelectorAll('[data-fate]').forEach(function (b) {
    b.addEventListener('click', function () {
      root.querySelectorAll('[data-fate]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      $('c127dm-fate-a').textContent = FATE[b.dataset.fate];
    });
  });

  play();
})();
