/* Cercle 127 — Terra : vrai scan des lignes de la main dans l'atelier.
   1. MediaPipe repère la main (21 repères) et sa latéralité.
   2. La paume est redressée (doigts vers le haut), recadrée et, si besoin, mise en miroir,
      exactement comme à l'entraînement du modèle « Palm Line Reader » (Sam Barber, MIT).
   3. Le modèle trace les plis réels : cœur, tête, vie. Le destin, qu'il ne connaît pas,
      est placé par la géométrie de la main puis rapproché du pli le plus marqué.
   4. Les points de l'atelier sont déplacés comme au doigt : la lecture en tient compte.
   Tout se passe sur l'appareil : la photo n'est envoyée nulle part. */
(function () {
  'use strict';
  var CFG = window.C127TerraDetailed || {};
  var LOCAL = (CFG.mp || '').replace(/\/$/, '');
  var MP = LOCAL || 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  var BUNDLE = LOCAL ? MP + '/vision_bundle.js' : MP + '/vision_bundle.mjs';
  var MODEL = LOCAL ? MP + '/hand_landmarker.task' : 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
  var ORT_BASE = (CFG.ort || '').replace(/\/$/, '');
  var LINES_MODEL = CFG.palmLines || '';
  var SIZE = 512, MEAN = [0.485, 0.456, 0.406], STD = [0.229, 0.224, 0.225];
  var CLASS = { heart: 1, head: 2, life: 3 };
  var COLORS = { 1: [232, 163, 174], 2: [214, 182, 108], 3: [105, 189, 125] };

  /* ---------- Chargements (une fois, puis en cache) ---------- */
  function landmarker() {
    if (!window.__c127HandLandmarker) {
      window.__c127HandLandmarker = import(BUNDLE).then(function (m) {
        return m.FilesetResolver.forVisionTasks(MP + '/wasm').then(function (files) {
          return m.HandLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL }, runningMode: 'IMAGE', numHands: 1, minHandDetectionConfidence: 0.3 });
        });
      });
      window.__c127HandLandmarker.catch(function () { window.__c127HandLandmarker = null; });
    }
    return window.__c127HandLandmarker;
  }
  var segP = null;
  function segmenter() {
    if (!ORT_BASE || !LINES_MODEL) return Promise.reject(new Error('no-model'));
    if (!segP) {
      segP = new Promise(function (res, rej) {
        if (window.ort) return res(window.ort);
        var s = document.createElement('script');
        s.src = ORT_BASE + '/ort.wasm.min.js'; s.async = true;
        s.onload = function () { window.ort ? res(window.ort) : rej(new Error('ort')); };
        s.onerror = rej;
        document.head.appendChild(s);
      }).then(function (ort) {
        ort.env.wasm.numThreads = 1; // pas d'isolation multi-processus sur le site
        ort.env.wasm.wasmPaths = { mjs: ORT_BASE + '/ort-wasm-simd-threaded.js', wasm: ORT_BASE + '/ort-wasm-simd-threaded.wasm' };
        return ort.InferenceSession.create(LINES_MODEL, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' }).then(function (session) {
          return { ort: ort, session: session };
        });
      });
      segP.catch(function () { segP = null; });
    }
    return segP;
  }

  /* ---------- Recadrage comme à l'entraînement ---------- */
  // Renvoie le canevas 512×512 et la fonction qui ramène un pixel du masque sur la photo.
  function cropPalm(img, P, mirror) {
    var W = img.naturalWidth, H = img.naturalHeight;
    var vx = P[9].x - P[0].x, vy = P[9].y - P[0].y;
    var ang = Math.atan2(vx, -vy); // angle du poignet→majeur par rapport à la verticale
    var cx = 0, cy = 0; P.forEach(function (p) { cx += p.x; cy += p.y; }); cx /= P.length; cy /= P.length;
    var cos = Math.cos(-ang), sin = Math.sin(-ang);
    var rot = function (p) { var x = p.x - cx, y = p.y - cy; return { x: x * cos - y * sin + cx, y: x * sin + y * cos + cy }; };
    var R = P.map(rot);
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    R.forEach(function (p) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
    var margin = 0.12 * Math.max(maxX - minX, maxY - minY);
    var x0 = minX - margin, y0 = minY - margin, cw = maxX - minX + 2 * margin, ch = maxY - minY + 2 * margin;
    var c = document.createElement('canvas'); c.width = SIZE; c.height = SIZE;
    var g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#000'; g.fillRect(0, 0, SIZE, SIZE);
    g.save();
    g.scale(SIZE / cw, SIZE / ch);
    if (mirror) { g.translate(cw, 0); g.scale(-1, 1); }
    g.translate(-x0, -y0);
    g.translate(cx, cy); g.rotate(-ang); g.translate(-cx, -cy);
    g.drawImage(img, 0, 0, W, H);
    g.restore();
    var cos2 = Math.cos(ang), sin2 = Math.sin(ang);
    function back(u, v) {
      var x = u * cw / SIZE, y = v * ch / SIZE;
      if (mirror) x = cw - x;
      x += x0; y += y0;
      var dx = x - cx, dy = y - cy;
      return { x: dx * cos2 - dy * sin2 + cx, y: dx * sin2 + dy * cos2 + cy };
    }
    return { canvas: c, ctx: g, back: back, sx: SIZE / cw, sy: SIZE / ch };
  }
  function runLines(seg, crop) {
    var d = crop.ctx.getImageData(0, 0, SIZE, SIZE).data, plane = SIZE * SIZE, chw = new Float32Array(3 * plane);
    for (var i = 0, p = 0; i < plane; i++, p += 4) {
      chw[i] = (d[p] / 255 - MEAN[0]) / STD[0];
      chw[plane + i] = (d[p + 1] / 255 - MEAN[1]) / STD[1];
      chw[2 * plane + i] = (d[p + 2] / 255 - MEAN[2]) / STD[2];
    }
    var feeds = {}; feeds[seg.session.inputNames[0]] = new seg.ort.Tensor('float32', chw, [1, 3, SIZE, SIZE]);
    return seg.session.run(feeds).then(function (out) {
      var L = out[seg.session.outputNames[0]].data, mask = new Uint8Array(plane);
      for (var i = 0; i < plane; i++) {
        var best = 0, bv = L[i];
        for (var k = 1; k < 4; k++) { var v = L[k * plane + i]; if (v > bv) { bv = v; best = k; } }
        mask[i] = best;
      }
      return mask;
    });
  }
  // Trois points le long d'un pli : ses deux extrémités et son milieu (axe principal).
  function threePoints(pts) {
    if (pts.length < 40) return null;
    var mx = 0, my = 0; pts.forEach(function (p) { mx += p.x; my += p.y; }); mx /= pts.length; my /= pts.length;
    var sxx = 0, sxy = 0, syy = 0;
    pts.forEach(function (p) { var dx = p.x - mx, dy = p.y - my; sxx += dx * dx; sxy += dx * dy; syy += dy * dy; });
    var th = 0.5 * Math.atan2(2 * sxy, sxx - syy), ax = Math.cos(th), ay = Math.sin(th);
    var proj = pts.map(function (p) { return { t: (p.x - mx) * ax + (p.y - my) * ay, p: p }; }).sort(function (a, b) { return a.t - b.t; });
    var pick = function (q) {
      var i = Math.min(proj.length - 1, Math.max(0, Math.round(q * (proj.length - 1))));
      // moyenne locale pour rester au centre du trait
      var lo = Math.max(0, i - 6), hi = Math.min(proj.length - 1, i + 6), x = 0, y = 0;
      for (var j = lo; j <= hi; j++) { x += proj[j].p.x; y += proj[j].p.y; }
      return { x: x / (hi - lo + 1), y: y / (hi - lo + 1) };
    };
    return [pick(0.03), pick(0.5), pick(0.97)];
  }

  /* ---------- Géométrie de secours (destin, ou si le modèle n'est pas disponible) ---------- */
  function palmFrame(P) {
    var O = P[0], M = P[9], I = P[5], K = P[17];
    var U = { x: M.x - O.x, y: M.y - O.y }, X = { x: (I.x - K.x) / 2, y: (I.y - K.y) / 2 };
    return function (k, s) { return { x: O.x + U.x * s + X.x * k, y: O.y + U.y * s + X.y * k }; };
  }
  var GEO = {
    heart: [[-1.0, 0.80], [-0.05, 0.74], [0.80, 0.87]],
    head: [[1.02, 0.66], [0.10, 0.57], [-0.85, 0.50]],
    life: [[1.00, 0.63], [0.62, 0.36], [0.62, 0.06]],
    fate: [[0.02, 0.06], [0.04, 0.42], [0.00, 0.80]]
  };
  function grayCanvas(img) {
    var W = img.naturalWidth, H = img.naturalHeight, sc = Math.min(1, 640 / Math.max(W, H));
    var w = Math.max(1, Math.round(W * sc)), h = Math.max(1, Math.round(H * sc));
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
    var d = g.getImageData(0, 0, w, h).data, gray = new Float32Array(w * h), out = new Float32Array(w * h);
    for (var i = 0; i < w * h; i++) gray[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
    for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++) {
      var s = 0; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) s += gray[(y + dy) * w + x + dx];
      out[y * w + x] = s / 9;
    }
    return { w: w, h: h, scale: sc, v: out };
  }
  function snap(G, pt, n, radius) {
    var px = pt.x * G.scale, py = pt.y * G.scale, r = radius * G.scale, best = null, bestV = Infinity, sum = 0, cnt = 0;
    for (var t = -r; t <= r; t += 1) {
      var x = Math.round(px + n.x * t), y = Math.round(py + n.y * t);
      if (x < 1 || y < 1 || x >= G.w - 1 || y >= G.h - 1) continue;
      var v = G.v[y * G.w + x]; sum += v; cnt++;
      var cost = v + Math.abs(t) / r * 6;
      if (cost < bestV) { bestV = cost; best = { x: x / G.scale, y: y / G.scale, v: v }; }
    }
    return best && cnt && (sum / cnt - best.v) > 4 ? best : pt;
  }
  function normalOf(a, b) { var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1; return { x: -dy / L, y: dx / L }; }

  /* ---------- Photo → écran → moteur de l'atelier ---------- */
  function imageToScreen(img) {
    var r = img.getBoundingClientRect(), W = img.naturalWidth, H = img.naturalHeight;
    var s = getComputedStyle(img).objectFit === 'contain' ? Math.min(r.width / W, r.height / H) : Math.max(r.width / W, r.height / H);
    var ox = r.left + (r.width - W * s) / 2, oy = r.top + (r.height - H * s) / 2;
    var f = function (p) { return { x: ox + p.x * s, y: oy + p.y * s }; };
    f.local = function (p) { return { x: ox - r.left + p.x * s, y: oy - r.top + p.y * s }; };
    return f;
  }
  function moveAnchor(anchor, mapper, target) {
    var ctm = mapper.getScreenCTM(); if (!ctm) return;
    var pt = mapper.createSVGPoint(); pt.x = target.x; pt.y = target.y;
    var v = pt.matrixTransform(ctm.inverse());
    v.x = Math.max(42, Math.min(958, v.x)); v.y = Math.max(52, Math.min(1348, v.y));
    var back = v.matrixTransform(ctm), from = anchor.getBoundingClientRect();
    anchor.setPointerCapture = function () {}; anchor.releasePointerCapture = function () {};
    var o = function (x, y) { return { bubbles: true, cancelable: true, pointerId: 77, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y }; };
    try {
      anchor.dispatchEvent(new PointerEvent('pointerdown', o(from.left + from.width / 2, from.top + from.height / 2)));
      anchor.dispatchEvent(new PointerEvent('pointermove', o(back.x, back.y)));
      anchor.dispatchEvent(new PointerEvent('pointerup', o(back.x, back.y)));
    } finally { delete anchor.setPointerCapture; delete anchor.releasePointerCapture; }
  }


  /* ---------- Mesures de chiromancie (repère de la paume, sans dépendre de l'orientation) ---------- */
  function measure(P, groups, counts, crop) {
    var len = function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); };
    var chain = function (ids) { var t = 0; for (var i = 1; i < ids.length; i++) t += len(P[ids[i - 1]], P[ids[i]]); return t; };
    var O = P[0], palmLen = len(P[0], P[9]), palmW = len(P[5], P[17]);
    var U = { x: (P[9].x - O.x) / palmLen, y: (P[9].y - O.y) / palmLen };
    var X = { x: P[5].x - P[17].x, y: P[5].y - P[17].y }, d = X.x * U.x + X.y * U.y;
    X.x -= d * U.x; X.y -= d * U.y; var xl = Math.hypot(X.x, X.y) || 1; X.x /= xl; X.y /= xl;
    // k : vers l'index et le pouce (+) ou vers l'auriculaire (−) ; s : du poignet (0) vers la base du majeur (1)
    var fr = function (p) { var dx = p.x - O.x, dy = p.y - O.y; return { k: (dx * X.x + dy * X.y) / palmW, s: (dx * U.x + dy * U.y) / palmLen }; };
    var area = 1 / (crop.sx * crop.sy); // un pixel du masque, en pixels de la photo
    var deg = function (r) { return r * 180 / Math.PI; };
    var f = {
      ratio: palmLen / palmW,
      fingers: chain([9, 10, 11, 12]) / palmLen,
      index: chain([5, 6, 7, 8]), ring: chain([13, 14, 15, 16]),
      thumbLen: chain([1, 2, 3, 4]) / palmLen,
      thumbOpen: deg(Math.acos(Math.max(-1, Math.min(1, ((P[4].x - P[2].x) * (P[8].x - P[5].x) + (P[4].y - P[2].y) * (P[8].y - P[5].y)) / (len(P[2], P[4]) * len(P[5], P[8]) || 1))))),
      pinky: fr(P[20]).s - fr(P[15]).s, // > 0 : l'auriculaire dépasse la dernière phalange de l'annulaire
      kIndex: fr(P[5]).k, kMid: fr(P[9]).k, kRing: fr(P[13]).k, kPinky: fr(P[17]).k,
      lines: {}
    };
    f.indexRing = (f.index - f.ring) / f.ring;
    ['heart', 'head', 'life'].forEach(function (name) {
      var pts = groups[CLASS[name]];
      if (!pts || pts.length < 40) return;
      var mx = 0, my = 0; pts.forEach(function (p) { mx += p.x; my += p.y; }); mx /= pts.length; my /= pts.length;
      var sxx = 0, sxy = 0, syy = 0;
      pts.forEach(function (p) { var dx = p.x - mx, dy = p.y - my; sxx += dx * dx; sxy += dx * dy; syy += dy * dy; });
      var th = 0.5 * Math.atan2(2 * sxy, sxx - syy), ax = Math.cos(th), ay = Math.sin(th);
      var pr = pts.map(function (p) { return { t: (p.x - mx) * ax + (p.y - my) * ay, n: -(p.x - mx) * ay + (p.y - my) * ax, p: p }; }).sort(function (a, b) { return a.t - b.t; });
      var q = function (v) { return pr[Math.min(pr.length - 1, Math.max(0, Math.round(v * (pr.length - 1))))].t; };
      var t0 = q(0.02), t1 = q(0.98), L = t1 - t0, gap = 0;
      for (var i = 1; i < pr.length; i++) if (pr[i].t > t0 && pr[i].t < t1) gap = Math.max(gap, pr[i].t - pr[i - 1].t);
      // dix tranches le long du pli : centre de chacune, pour la courbure et les extrémités
      var B = 10, bins = [];
      for (var b = 0; b < B; b++) bins.push({ x: 0, y: 0, n: 0, o: 0 });
      pr.forEach(function (e) { if (e.t < t0 || e.t > t1) return; var b = Math.min(B - 1, Math.floor((e.t - t0) / (L || 1) * B)); bins[b].x += e.p.x; bins[b].y += e.p.y; bins[b].o += e.n; bins[b].n++; });
      bins = bins.filter(function (b) { return b.n; }).map(function (b) { return { x: b.x / b.n, y: b.y / b.n, o: b.o / b.n }; });
      var A = bins[0], Z = bins[bins.length - 1], ch = len(A, Z) || 1, sag = 0;
      bins.forEach(function (b) { sag = Math.max(sag, Math.abs((Z.x - A.x) * (A.y - b.y) - (A.x - b.x) * (Z.y - A.y)) / ch); });
      var fa = fr(A), fz = fr(Z), all = pts.map(fr);
      f.lines[name] = {
        length: L / palmW, gap: gap / palmW, curve: sag / ch,
        thick: counts[CLASS[name]] * area / (L || 1) / palmW,
        a: fa, z: fz, pts: all
      };
    });
    var H = f.lines.heart, T = f.lines.head, V = f.lines.life;
    if (H) {
      var hi = H.a.k > H.z.k ? H.a : H.z, lo = H.a.k > H.z.k ? H.z : H.a; // côté index, côté auriculaire
      H.endK = hi.k; H.rise = hi.s - lo.s;
    }
    if (T) {
      var st = T.a.k > T.z.k ? T.a : T.z, en = T.a.k > T.z.k ? T.z : T.a; // naît côté index, file vers l'auriculaire
      T.slope = deg(Math.atan2((st.s - en.s) * palmLen, (st.k - en.k) * palmW));
      T.reach = en.k; T.startK = st.k; T.startS = st.s;
    }
    if (V) {
      var ks = V.pts.map(function (p) { return p.k; }).sort(function (a, b) { return a - b; });
      var ss = V.pts.map(function (p) { return p.s; }).sort(function (a, b) { return a - b; });
      V.inner = ks[Math.round(ks.length * 0.03)]; V.low = ss[Math.round(ss.length * 0.02)]; V.top = ss[Math.round(ss.length * 0.98)];
    }
    if (T && V) { // tête et vie : nées ensemble, ou séparées par un espace ?
      var start = T.pts.filter(function (p) { return p.k > T.startK - 0.18; }), top = V.pts.filter(function (p) { return p.s > V.top - 0.18; }), best = Infinity;
      for (var i2 = 0; i2 < start.length; i2 += 3) for (var j = 0; j < top.length; j += 3) {
        var dd = Math.hypot((start[i2].k - top[j].k) * palmW, (start[i2].s - top[j].s) * palmLen) / palmW;
        if (dd < best) best = dd;
      }
      f.joint = best;
    }
    // Tracés pour l'animation : le cœur part de l'auriculaire, la tête de l'index, la vie du haut de la paume.
    f.polys = {};
    ['heart', 'head', 'life'].forEach(function (name) {
      var pts = groups[CLASS[name]]; if (!pts || pts.length < 40) return;
      var mx = 0, my = 0; pts.forEach(function (p) { mx += p.x; my += p.y; }); mx /= pts.length; my /= pts.length;
      var a1 = 0, b1 = 0, c1 = 0; pts.forEach(function (p) { var dx = p.x - mx, dy = p.y - my; a1 += dx * dx; b1 += dx * dy; c1 += dy * dy; });
      var th = 0.5 * Math.atan2(2 * b1, a1 - c1), ax = Math.cos(th), ay = Math.sin(th);
      var pr = pts.map(function (p) { return { t: (p.x - mx) * ax + (p.y - my) * ay, p: p }; }).sort(function (u, v) { return u.t - v.t; });
      var t0 = pr[Math.floor(pr.length * 0.01)].t, t1 = pr[Math.floor(pr.length * 0.99)].t, B = 28, bins = [];
      for (var i = 0; i < B; i++) bins.push({ x: 0, y: 0, n: 0 });
      pr.forEach(function (e) { if (e.t < t0 || e.t > t1) return; var k = Math.min(B - 1, Math.floor((e.t - t0) / ((t1 - t0) || 1) * B)); bins[k].x += e.p.x; bins[k].y += e.p.y; bins[k].n++; });
      var line = bins.filter(function (q) { return q.n > 3; }).map(function (q) { return [Math.round(q.x / q.n), Math.round(q.y / q.n)]; });
      if (line.length < 3) return;
      var A = fr({ x: line[0][0], y: line[0][1] }), Z = fr({ x: line[line.length - 1][0], y: line[line.length - 1][1] });
      var flip = name === 'heart' ? A.k > Z.k : name === 'head' ? A.k < Z.k : A.s < Z.s;
      f.polys[name] = flip ? line.reverse() : line;
    });
    ['heart', 'head', 'life'].forEach(function (n) { if (f.lines[n]) delete f.lines[n].pts; });
    return f;
  }

  function setup(root) {
    if (root.getAttribute('data-c127-scan')) return;
    var file = root.querySelector('[data-file]'), img = root.querySelector('[data-preview]'), mapper = root.querySelector('[data-mapper]');
    if (!file || !img || !mapper) return;
    root.setAttribute('data-c127-scan', '1');
    var wrap = root.querySelector('[data-map-wrap]');
    var status = document.createElement('div');
    status.className = 'c127-scan'; status.setAttribute('role', 'status'); status.hidden = true;
    (wrap && wrap.parentNode ? wrap.parentNode : root).insertBefore(status, wrap ? wrap.nextSibling : null);
    var overlay = null;

    function say(kind, html) { status.hidden = false; status.className = 'c127-scan is-' + kind; status.innerHTML = html; }
    // La séance (terra-seance.js) écoute ces étapes pour guider la personne.
    function emit(stage, extra) {
      var detail = extra || {}; detail.stage = stage;
      if (stage === 'done') root.__c127Palm = detail;
      try { root.dispatchEvent(new CustomEvent('c127:palm', { detail: detail })); } catch (e) {}
    }

    function showMask(mask, crop, toScreen) {
      if (!wrap) return;
      var r = img.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
      if (!overlay) { overlay = document.createElement('canvas'); overlay.className = 'c127-scan__overlay'; overlay.setAttribute('aria-hidden', 'true'); wrap.appendChild(overlay); }
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      overlay.width = Math.round(r.width * dpr); overlay.height = Math.round(r.height * dpr);
      overlay.style.left = (r.left - wr.left) + 'px'; overlay.style.top = (r.top - wr.top) + 'px';
      overlay.style.width = r.width + 'px'; overlay.style.height = r.height + 'px';
      var g = overlay.getContext('2d'); g.clearRect(0, 0, overlay.width, overlay.height);
      for (var v = 0; v < SIZE; v += 2) for (var u = 0; u < SIZE; u += 2) {
        var k = mask[v * SIZE + u]; if (!k) continue;
        var q = toScreen.local(crop.back(u, v)), col = COLORS[k];
        g.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',.85)';
        g.fillRect(q.x * dpr - 1.5 * dpr, q.y * dpr - 1.5 * dpr, 3 * dpr, 3 * dpr);
      }
      overlay.classList.remove('is-fading'); void overlay.offsetWidth; overlay.classList.add('is-fading');
    }

    function place(name, three) {
      var toScreen = imageToScreen(img); // position relue au dernier moment : la page a pu défiler
      var a = three[0], m = three[1], c = three[2];
      var ctrl = { x: 2 * m.x - (a.x + c.x) / 2, y: 2 * m.y - (a.y + c.y) / 2 }; // courbe quadratique du moteur
      [a, ctrl, c].forEach(function (p, i) {
        var anchor = root.querySelector('[data-anchor="' + name + ':' + i + '"]');
        if (anchor) moveAnchor(anchor, mapper, toScreen(p));
      });
    }

    function run() {
      say('busy', '<span class="c127-scan__dot" aria-hidden="true"></span> Terra repère ta main… <small>(la première fois, ses outils se chargent : quelques secondes)</small>');
      emit('hand');
      var ready = img.complete && img.naturalWidth ? Promise.resolve() : new Promise(function (res, rej) { img.onload = res; img.onerror = rej; });
      ready.then(landmarker).then(function (lm) {
        var res = lm.detect(img), L = res && res.landmarks && res.landmarks[0];
        if (!L) {
          say('warn', '<b>Main non repérée.</b> Pose ta paume bien à plat, doigts légèrement écartés, face à l’objectif, avec une lumière douce, puis reprends la photo.');
          emit('nohand');
          return null;
        }
        var W = img.naturalWidth, H = img.naturalHeight;
        var P = L.map(function (p) { return { x: p.x * W, y: p.y * H }; });
        var hand = res.handednesses && res.handednesses[0] && res.handednesses[0][0] ? res.handednesses[0][0].categoryName : 'Left';
        var frame = palmFrame(P), palmW = Math.hypot(P[5].x - P[17].x, P[5].y - P[17].y), G = grayCanvas(img);
        var geo = function (name) {
          var pts = GEO[name].map(function (ks) { return frame(ks[0], ks[1]); }), a = pts[0], m = pts[1], c = pts[2];
          a = snap(G, a, normalOf(a, m), palmW * 0.05); m = snap(G, m, normalOf(a, c), palmW * 0.09); c = snap(G, c, normalOf(m, c), palmW * 0.05);
          return [a, m, c];
        };
        say('busy', '<span class="c127-scan__dot" aria-hidden="true"></span> Main repérée. Terra lit tes lignes…');
        emit('lines', { P: P.map(function (p) { return [p.x, p.y]; }), W: W, H: H });
        return segmenter().then(function (seg) {
          var crop = cropPalm(img, P, hand !== 'Left');
          return runLines(seg, crop).then(function (mask) {
            if (window.__c127ScanDebug) window.__c127ScanDebug = { crop: crop.canvas.toDataURL('image/png'), mask: mask, hand: hand };
            var found = [], groups = { 1: [], 2: [], 3: [] }, counts = { 1: 0, 2: 0, 3: 0 };
            for (var v = 0; v < SIZE; v++) for (var u = 0; u < SIZE; u++) { var k = mask[v * SIZE + u]; if (k) { groups[k].push(crop.back(u, v)); counts[k]++; } }
            var feats = null;
            try { feats = measure(P, groups, counts, crop); } catch (e) { feats = null; }
            ['heart', 'head', 'life'].forEach(function (name) {
              var three = threePoints(groups[CLASS[name]]);
              if (three) { place(name, three); found.push(name); } else place(name, geo(name));
            });
            place('fate', geo('fate'));
            showMask(mask, crop, imageToScreen(img));
            return { found: found, L: L, feats: feats };
          });
        }, function () {
          // Modèle indisponible : placement géométrique affiné, honnêtement annoncé.
          ['heart', 'head', 'life', 'fate'].forEach(function (n) { place(n, geo(n)); });
          var F0 = null; try { F0 = measure(P, {}, {}, { sx: 1, sy: 1 }); } catch (e) {}
          return { found: [], L: L, geometric: true, feats: F0 };
        });
      }).then(function (r) {
        if (!r) return;
        var NAMES = { heart: 'cœur', head: 'tête', life: 'vie' };
        var allIn = r.L.every(function (p) { return p.x > 0.01 && p.x < 0.99 && p.y > 0.01 && p.y < 0.99; });
        Array.prototype.forEach.call(root.querySelectorAll('.terra127__check input[type=checkbox]'), function (cb) {
          var label = (cb.closest('label') || cb.parentNode).textContent || '';
          if (allIn && /doigts/i.test(label) && !cb.checked) cb.click();
        });
        var msg;
        if (r.found.length === 3) msg = '<b>✓ Lignes lues sur ta photo.</b> Cœur, tête et vie suivent tes plis réels ; le destin est placé d’après la forme de ta main.';
        else if (r.found.length) msg = '<b>✓ Main lue en partie.</b> Lignes trouvées sur la photo : ' + r.found.map(function (n) { return NAMES[n]; }).join(', ') + '. Les autres sont placées d’après la forme de ta main.';
        else msg = '<b>Main repérée.</b> Tes lignes sont placées d’après la forme de ta main' + (r.geometric ? '' : ' (plis peu visibles sur la photo : essaie une lumière rasante)') + '.';
        say('ok', msg + ' Ajuste un point en le faisant glisser si besoin. <button type="button" class="c127-scan__redo">Relire</button>');
        var redo = status.querySelector('.c127-scan__redo'); if (redo) redo.addEventListener('click', run);
        emit('done', { found: r.found, feats: r.feats, geometric: !!r.geometric, P: r.L.map(function (p) { return [p.x * img.naturalWidth, p.y * img.naturalHeight]; }), W: img.naturalWidth, H: img.naturalHeight });
      }).catch(function () {
        say('warn', 'La lecture automatique n’a pas pu se lancer sur cet appareil. Fais glisser les points pour suivre tes lignes.');
        emit('fail');
      });
    }
    file.addEventListener('change', function () {
      if (!file.files || !file.files[0]) return;
      emit('photo');
      setTimeout(function () { if (img.decode) img.decode().then(run, run); else run(); }, 60);
    });
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll('.terra127'), setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
