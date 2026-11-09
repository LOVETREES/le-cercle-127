/* Cercle 127 — Terra : la scène animée d'une main lue.
   Points de la main (MediaPipe), squelette, axes de la paume, lignes réelles tracées une à une, monts.
   Utilisée pendant le scan (posée sur la photo de l'atelier) et dans la lecture finale.
   window.C127Scene.create({ W, H, fit, over: img, wrap }) ou ({ W, H, src }) pour sa propre photo. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', uid = 0;
  var REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var BONES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
  var NAMES = { heart: 'Cœur', head: 'Tête', life: 'Vie' };

  function mk(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, REDUCED ? 0 : ms); }); }
  // Courbe lissée passant par les points (Catmull-Rom → Bézier)
  function pathOf(pts) {
    var Q = pts.map(function (p, i) {
      if (i === 0 || i === pts.length - 1) return p;
      return [(pts[i - 1][0] + 2 * p[0] + pts[i + 1][0]) / 4, (pts[i - 1][1] + 2 * p[1] + pts[i + 1][1]) / 4];
    });
    var d = 'M' + Q[0][0].toFixed(1) + ' ' + Q[0][1].toFixed(1);
    for (var i = 0; i < Q.length - 1; i++) {
      var p0 = Q[i - 1] || Q[i], p1 = Q[i], p2 = Q[i + 1], p3 = Q[i + 2] || Q[i + 1];
      d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  function Scene(o) {
    var id = ++uid, W = o.W, H = o.H, k = Math.max(W, H) / 1200;
    this.W = W; this.H = H; this.k = k; this.o = o; this.lines = {}; this.run = 0;
    var svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: o.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet', class: 'c127sc-svg', 'aria-hidden': 'true' });
    svg.style.setProperty('--k', k);
    var defs = mk('defs', {}, svg);
    var f = mk('filter', { id: 'c127sc-soft' + id, x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs); mk('feGaussianBlur', { stdDeviation: 6 * k }, f);
    var pat = mk('pattern', { id: 'c127sc-grid' + id, width: 45 * k, height: 45 * k, patternUnits: 'userSpaceOnUse' }, defs);
    mk('path', { d: 'M' + 45 * k + ' 0H0V' + 45 * k, fill: 'none', stroke: 'rgba(216,182,107,.18)', 'stroke-width': k }, pat);
    var lg = mk('linearGradient', { id: 'c127sc-sw' + id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    mk('stop', { offset: 0, 'stop-color': '#d8b66b', 'stop-opacity': 0 }, lg); mk('stop', { offset: 0.85, 'stop-color': '#d8b66b', 'stop-opacity': 0.22 }, lg); mk('stop', { offset: 1, 'stop-color': '#fff3c9', 'stop-opacity': 0.9 }, lg);
    this.soft = 'url(#c127sc-soft' + id + ')';
    this.gridR = mk('rect', { class: 'c127sc-grid', width: W, height: H, fill: 'url(#c127sc-grid' + id + ')' }, svg);
    this.sweepG = mk('g', { class: 'c127sc-sweep' }, svg); mk('rect', { x: 0, y: -0.2 * H, width: W, height: 0.2 * H, fill: 'url(#c127sc-sw' + id + ')' }, this.sweepG);
    this.frameG = mk('g', {}, svg); this.bonesG = mk('g', {}, svg); this.linesG = mk('g', { class: 'c127sc-lines' }, svg);
    this.jointsG = mk('g', {}, svg); this.mountsG = mk('g', {}, svg);
    this.svg = svg;
    if (o.src) {
      var fig = document.createElement('figure'); fig.className = 'c127sc-fig';
      fig.style.aspectRatio = W + ' / ' + H;
      var im = document.createElement('img'); im.src = o.src; im.alt = 'Ta paume, avec les lignes lues par Terra';
      fig.appendChild(im); fig.appendChild(svg); this.el = fig;
    } else {
      this.el = svg; svg.classList.add('is-over');
      if (o.wrap) o.wrap.appendChild(svg);
      var self = this; this.place(); this._onR = function () { self.place(); }; window.addEventListener('resize', this._onR);
    }
  }
  // Posée exactement sur la photo de l'atelier (même cadrage que l'image)
  Scene.prototype.place = function () {
    var o = this.o; if (!o.over || !o.wrap) return;
    var r = o.over.getBoundingClientRect(), wr = o.wrap.getBoundingClientRect();
    var s = this.svg.style; s.left = (r.left - wr.left) + 'px'; s.top = (r.top - wr.top) + 'px'; s.width = r.width + 'px'; s.height = r.height + 'px';
  };
  Scene.prototype.destroy = function () { if (this._onR) window.removeEventListener('resize', this._onR); if (this.el.parentNode) this.el.parentNode.removeChild(this.el); this.run++; };

  Scene.prototype.setHand = function (P) {
    var k = this.k; this.P = P;
    this.bones = BONES.map(function (b) {
      var len = Math.hypot(P[b[1]][0] - P[b[0]][0], P[b[1]][1] - P[b[0]][1]);
      var l = mk('line', { class: 'c127sc-bone', x1: P[b[0]][0], y1: P[b[0]][1], x2: P[b[1]][0], y2: P[b[1]][1], 'stroke-width': 3 * k }, this.bonesG);
      l.style.strokeDasharray = len; l.style.strokeDashoffset = len; l._len = len; return l;
    }, this);
    this.joints = P.map(function (p, i) { return mk('circle', { class: 'c127sc-joint', cx: p[0], cy: p[1], r: (i === 0 ? 9 : 7) * k, 'stroke-width': 3 * k }, this.jointsG); }, this);
    this.axes = [mk('line', { class: 'c127sc-axis', x1: P[0][0], y1: P[0][1], x2: P[9][0], y2: P[9][1], 'stroke-width': 2 * k, 'stroke-dasharray': 8 * k + ' ' + 10 * k }, this.frameG),
      mk('line', { class: 'c127sc-axis', x1: P[17][0], y1: P[17][1], x2: P[5][0], y2: P[5][1], 'stroke-width': 2 * k, 'stroke-dasharray': 8 * k + ' ' + 10 * k }, this.frameG)];
    if (this.o.ratio) {
      var mid = lerp(P[0], P[9], 0.5), t = mk('text', { class: 'c127sc-axis-l', x: mid[0] + 16 * k, y: mid[1], 'font-size': 22 * k }, this.frameG);
      t.textContent = this.o.ratio; this.axes.push(t);
    }
    // Monts : sous la base de chaque doigt, Vénus au pied du pouce, Lune en face
    var M = [['Jupiter', lerp(P[5], P[0], 0.07)], ['Saturne', lerp(P[9], P[0], 0.06)], ['Apollon', lerp(P[13], P[0], 0.06)], ['Mercure', lerp(P[17], P[0], 0.07)],
      ['Vénus', lerp(lerp(P[1], P[2], 0.3), P[9], 0.12)], ['Lune', lerp(lerp(P[0], P[17], 0.42), P[9], 0.08)]];
    M.forEach(function (m) { var t = mk('text', { class: 'c127sc-mount', x: m[1][0], y: m[1][1], 'text-anchor': 'middle', 'font-size': 25 * k, 'stroke-width': 5 * k }, this.mountsG); t.textContent = m[0]; }, this);
  };

  Scene.prototype.setLines = function (polys) {
    var k = this.k, self = this;
    ['heart', 'head', 'life'].forEach(function (n) {
      var pts = polys && polys[n]; if (!pts || pts.length < 3) return;
      var d = pathOf(pts), g = mk('g', { class: 'c127sc-lg', 'data-k': n }, self.linesG);
      var glow = mk('path', { class: 'c127sc-pl c127sc-glow', d: d, 'stroke-width': 22 * k, filter: self.soft }, g);
      var core = mk('path', { class: 'c127sc-pl', d: d, 'stroke-width': 7 * k }, g);
      var len = core.getTotalLength();
      [glow, core].forEach(function (p) { p.style.strokeDasharray = len; p.style.strokeDashoffset = len; });
      var tip = mk('circle', { class: 'c127sc-tip', r: 10 * k, filter: self.soft }, g); tip.style.opacity = 0;
      var spot = core.getPointAtLength(len * (n === 'heart' ? 0.12 : n === 'head' ? 0.2 : 0.55));
      var lbl = mk('text', { class: 'c127sc-name', x: spot.x + (n === 'life' ? 18 : -14) * k, y: spot.y + (n === 'life' ? 0 : 34) * k, 'text-anchor': n === 'life' ? 'start' : 'end', 'font-size': 24 * k, 'stroke-width': 6 * k }, g);
      lbl.textContent = NAMES[n];
      self.lines[n] = { glow: glow, core: core, len: len, tip: tip, lbl: lbl };
    });
  };

  Scene.prototype.sweep = function (on) {
    var self = this, s = this.sweepG;
    this.svg.classList.toggle('is-sweeping', !!on);
    if (!on || REDUCED) { this._sw = false; return; }
    if (this._sw) return; this._sw = true;
    var t0 = performance.now();
    (function step(now) {
      if (!self._sw) return;
      var t = ((now - t0) % 1700) / 1700; s.setAttribute('transform', 'translate(0 ' + (t * 1.2 * self.H) + ')');
      requestAnimationFrame(step);
    })(t0);
  };
  Scene.prototype.showHand = function () {
    var self = this, me = this.run;
    if (!this.joints) return Promise.resolve();
    this.joints.forEach(function (c, i) { setTimeout(function () { if (me === self.run) c.classList.add('on'); }, REDUCED ? 0 : i * 45); });
    this.bones.forEach(function (l, i) { setTimeout(function () { if (me === self.run) l.style.strokeDashoffset = 0; }, REDUCED ? 0 : 200 + i * 40); });
    return wait(1300).then(function () { if (me === self.run) self.axes.forEach(function (a) { a.classList.add('on'); }); return wait(900); });
  };
  Scene.prototype.draw = function (n, ms, onStart) {
    var G = this.lines[n], self = this, me = this.run;
    if (!G) return Promise.resolve();
    if (onStart) onStart(n);
    if (REDUCED) { G.glow.style.strokeDashoffset = 0; G.core.style.strokeDashoffset = 0; G.lbl.classList.add('on'); return Promise.resolve(); }
    return new Promise(function (res) {
      var t0 = performance.now(); G.tip.style.opacity = 1;
      (function step(now) {
        if (me !== self.run) return res();
        var t = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - t, 3), off = G.len * (1 - e);
        G.glow.style.strokeDashoffset = off; G.core.style.strokeDashoffset = off;
        var p = G.core.getPointAtLength(G.len * e); G.tip.setAttribute('cx', p.x); G.tip.setAttribute('cy', p.y);
        if (t < 1) requestAnimationFrame(step); else { G.tip.style.opacity = 0; G.lbl.classList.add('on'); res(); }
      })(t0);
    });
  };
  Scene.prototype.drawAll = function (onStart) {
    var self = this;
    return this.draw('heart', 1300, onStart).then(function () { return self.draw('head', 1200, onStart); }).then(function () { return self.draw('life', 1400, onStart); });
  };
  Scene.prototype.settle = function () { this.svg.classList.add('is-settled'); };
  Scene.prototype.reset = function () {
    this.run++; this.svg.classList.remove('is-settled'); this.sweep(false);
    (this.joints || []).forEach(function (c) { c.classList.remove('on'); });
    (this.bones || []).forEach(function (l) { l.style.transition = 'none'; l.style.strokeDashoffset = l._len; void l.getBoundingClientRect(); l.style.transition = ''; });
    (this.axes || []).forEach(function (a) { a.classList.remove('on'); });
    for (var n in this.lines) { var G = this.lines[n]; G.glow.style.strokeDashoffset = G.len; G.core.style.strokeDashoffset = G.len; G.lbl.classList.remove('on'); G.tip.style.opacity = 0; }
  };
  // Lecture complète : balayage, points, axes, lignes, puis apaisement
  Scene.prototype.play = function (onStart) {
    var self = this; this.reset(); var me = this.run;
    this.sweep(true);
    return wait(1500).then(function () { if (me !== self.run) return; self.sweep(false); return self.showHand(); })
      .then(function () { if (me !== self.run) return; return self.drawAll(onStart); })
      .then(function () { if (me === self.run) self.settle(); });
  };
  Scene.prototype.focus = function (n) { if (n && this.lines[n]) this.svg.setAttribute('data-focus', n); else this.svg.removeAttribute('data-focus'); };

  window.C127Scene = { create: function (o) { return new Scene(o); }, reduced: REDUCED };
})();
