/* Le Cercle 127 — Oracle vivant : animations et collection, posées sur le moteur de l'Oracle sans le modifier. */
(function () {
  'use strict';
  var root = document.getElementById('c127t');
  if (!root) return;

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TOTAL = 127;
  var MILESTONES = { 7: 'Les sept Sœurs te saluent', 21: 'Trois cercles parcourus', 49: 'Sept fois sept', 77: 'Le Labyrinthe s’ouvre', 127: 'Toutes les lames du Cercle' };

  /* ---------- Mémoire locale (propre à cet appareil) ---------- */
  function load() { try { return JSON.parse(localStorage.getItem('c127ov') || '{}'); } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem('c127ov', JSON.stringify(s)); } catch (e) {} }
  var S = load();
  S.seen = S.seen || {};
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function yesterday() { var d = new Date(Date.now() - 864e5); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function seenCount() { return Object.keys(S.seen).length; }
  function soundOn() { return S.sound !== false; }

  /* ---------- Son (Web Audio, très doux, coupable) ---------- */
  var AC = null;
  function ctx() {
    if (!soundOn()) return null;
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; }
    return AC;
  }
  function chime(rank) {
    var a = ctx(); if (!a) return;
    var base = [523.25, 587.33, 659.25, 783.99, 880][rank % 5];
    [1, 2.01, 3.02].forEach(function (m, i) {
      var o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = base * m;
      g.gain.setValueAtTime(0.0001, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.12 / (i + 1), a.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 1.6 - i * 0.3);
      o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 1.7);
    });
  }
  function swish(delay) {
    var a = ctx(); if (!a) return;
    var t = a.currentTime + (delay || 0) / 1000;
    var buf = a.createBuffer(1, a.sampleRate * 0.25, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    var src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.2);
    g.gain.setValueAtTime(0.05, t);
    src.connect(f); f.connect(g); g.connect(a.destination); src.start(t);
  }
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  /* ---------- Particules dorées ---------- */
  var canvas = null, parts = [], running = false;
  function burst(x, y, n) {
    if (REDUCED) return;
    if (!canvas) {
      canvas = document.createElement('canvas'); canvas.className = 'c127ov-canvas'; canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas);
    }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    var c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var colors = ['#fff3c9', '#f0d68c', '#e2b55a', '#ffffff', '#c9a7f0'];
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 6;
      parts.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 2.5, life: 1, r: 1.2 + Math.random() * 2.6, col: colors[i % colors.length], star: Math.random() < 0.25 });
    }
    if (!running) { running = true; requestAnimationFrame(step); }
    function step() {
      c.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter(function (p) { return p.life > 0; });
      parts.forEach(function (p) {
        p.vy += 0.12; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.life -= 0.016;
        c.globalAlpha = Math.max(0, p.life);
        c.fillStyle = p.col;
        if (p.star) {
          c.save(); c.translate(p.x, p.y); c.rotate(p.life * 6);
          c.fillRect(-p.r * 2, -0.6, p.r * 4, 1.2); c.fillRect(-0.6, -p.r * 2, 1.2, p.r * 4); c.restore();
        } else { c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); }
      });
      c.globalAlpha = 1;
      if (parts.length) requestAnimationFrame(step); else { running = false; c.clearRect(0, 0, innerWidth, innerHeight); }
    }
  }

  /* ---------- Bandeau de collection ---------- */
  var hud = document.createElement('div');
  hud.className = 'c127ov-hud wp-exclude-emoji';
  hud.innerHTML =
    '<div class="c127ov-coll"><span>Lames découvertes : <b data-ov-count>0</b> / ' + TOTAL + '</span><div class="c127ov-bar"><i data-ov-bar></i></div></div>' +
    '<span class="c127ov-stat" data-ov-streak hidden></span>' +
    '<button type="button" class="c127ov-stat c127ov-sound" data-ov-sound></button>';
  var anchor = root.querySelector('.c127t-arch') || root.querySelector('.c127t-stage') || root.firstElementChild;
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(hud, anchor.nextSibling); else root.insertBefore(hud, root.firstChild);
  function paintHud() {
    var n = seenCount();
    hud.querySelector('[data-ov-count]').textContent = n;
    hud.querySelector('[data-ov-bar]').style.width = Math.max(2, n / TOTAL * 100) + '%';
    var st = hud.querySelector('[data-ov-streak]');
    if (S.streak > 1 && (S.last === today() || S.last === yesterday())) { st.hidden = false; st.textContent = '🔥 ' + S.streak + ' jours de suite'; } else st.hidden = true;
    var snd = hud.querySelector('[data-ov-sound]');
    snd.textContent = soundOn() ? '🔊 Son' : '🔇 Son coupé';
    snd.setAttribute('aria-pressed', soundOn() ? 'true' : 'false');
  }
  hud.querySelector('[data-ov-sound]').addEventListener('click', function () { S.sound = !soundOn(); save(S); paintHud(); if (soundOn()) chime(2); });
  paintHud();

  var toastEl = null, toastTimer = null;
  function toast(title, sub) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'c127ov-toast wp-exclude-emoji'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = title + (sub ? '<small>' + sub + '</small>' : '');
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3600);
  }

  /* ---------- Paquet : respiration et appui ---------- */
  var fan = document.getElementById('c127t-fan');
  if (fan) {
    if (!REDUCED) fan.classList.add('c127ov-ready');
    fan.addEventListener('pointerdown', function () { fan.classList.add('c127ov-press'); buzz(8); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { fan.addEventListener(ev, function () { fan.classList.remove('c127ov-press'); }); });
  }
  var shuffleBtn = document.getElementById('c127t-shuffle');
  if (shuffleBtn) shuffleBtn.addEventListener('click', function () { for (var i = 0; i < 6; i++) swish(i * 260); buzz([10, 60, 10, 60, 10]); });

  /* ---------- Distribution depuis le paquet ---------- */
  function origin() {
    var r = fan && fan.querySelector('span') ? fan.querySelector('span').getBoundingClientRect() : null;
    return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: innerWidth / 2, y: -120 };
  }
  function deal(cards) {
    var o = origin();
    cards.forEach(function (card, i) {
      card.setAttribute('data-ov', '1');
      if (REDUCED || !card.animate) { card.classList.add('c127ov-dealt'); return; }
      var r = card.getBoundingClientRect();
      var dx = o.x - (r.left + r.width / 2), dy = o.y - (r.top + r.height / 2);
      card.classList.add('c127ov-dealing');
      swish(i * 170);
      var anim = card.animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (-18 + i * 9) + 'deg) scale(.32)', opacity: 0 },
        { opacity: 1, offset: 0.12 },
        { transform: 'translate(' + (dx * 0.25) + 'px,' + (Math.min(dy, 0) * 0.25 - 40) + 'px) rotate(' + (8 - i * 4) + 'deg) scale(1.06)', offset: 0.7 },
        { transform: 'none', opacity: 1 }
      ], { duration: 950, delay: i * 170, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
      anim.onfinish = function () { card.classList.remove('c127ov-dealing'); card.classList.add('c127ov-dealt'); };
    });
  }

  /* ---------- Révélation ---------- */
  var revealRank = 0;
  function onReveal(card) {
    if (card.getAttribute('data-ov-open')) return;
    card.setAttribute('data-ov-open', '1');
    card.classList.remove('c127ov-dealt');
    if (!REDUCED) {
      card.classList.add('c127ov-flipping');
      setTimeout(function () { card.classList.remove('c127ov-flipping'); }, 950);
      var halo = document.createElement('span'); halo.className = 'c127ov-halo'; halo.setAttribute('aria-hidden', 'true');
      card.appendChild(halo); setTimeout(function () { halo.remove(); }, 1700);
    }
    var n = card.getAttribute('data-n');
    var isNew = n && !S.seen[n];
    setTimeout(function () {
      var r = card.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, isNew ? 90 : 46);
      chime(revealRank++);
      buzz(isNew ? [18, 40, 28] : 14);
    }, 380);
    if (!n) return;
    var day = today(), firstToday = S.last !== day;
    if (firstToday) { S.streak = S.last === yesterday() ? (S.streak || 1) + 1 : 1; S.last = day; }
    S.seen[n] = (S.seen[n] || 0) + 1;
    save(S);
    var badge = document.createElement('span');
    badge.className = 'c127ov-seal ' + (isNew ? 'is-new' : 'is-known');
    badge.textContent = isNew ? '✦ Nouvelle lame' : 'Déjà rencontrée · ×' + S.seen[n];
    // Hors de la carte (le plan 3D retourné le masquerait) : posé sur son emplacement.
    var host = card.parentNode || card;
    if (host !== card) { host.classList.add('c127ov-host'); badge.style.top = (card.offsetTop - 12) + 'px'; }
    host.appendChild(badge);
    setTimeout(function () { badge.classList.add('is-on'); }, 650);
    paintHud();
    var count = seenCount();
    if (isNew && MILESTONES[count]) setTimeout(function () { toast('✦ ' + count + ' lames découvertes', MILESTONES[count]); burst(innerWidth / 2, innerHeight * 0.4, 140); chime(4); }, 1200);
    else if (firstToday && S.streak > 1) setTimeout(function () { toast('🔥 ' + S.streak + ' jours de tirage de suite', 'Le Cercle te reconnaît.'); }, 1200);
  }

  /* ---------- Observation du moteur ---------- */
  var result = document.getElementById('c127t-result');
  function scan() {
    if (!result) return;
    var fresh = Array.prototype.filter.call(result.querySelectorAll('.c127t-tcard'), function (c) { return !c.getAttribute('data-ov'); });
    if (fresh.length) requestAnimationFrame(function () { deal(fresh); });
    var lec = document.getElementById('c127t-lecture');
    if (lec && !lec.classList.contains('c127ov-in')) lec.classList.add('c127ov-in');
  }
  new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      if (m.type === 'attributes' && m.target.classList && m.target.classList.contains('is-open')) {
        if (m.target.matches('.c127t-tcard, .c127t-rcard')) onReveal(m.target);
      }
    });
    scan();
  }).observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  scan();
})();
