/* Le Cercle 127 — Labyrinthe vivant (site). Même calcul que l'application :
   ACQUIS = ciel de naissance (lecture symbolique, Astronomy Engine, dans le navigateur) ;
   VÉCU = bilan de la semaine + rêves du Grimoire (personnes connectées). Rien n'est envoyé. */
(function () {
  'use strict';
  var A = window.Astronomy, D = window.C127LV_DATA, C = window.C127LV || {};
  var host = document.getElementById('pl-detail') || document.getElementById('pl');
  if (!A || !D || !host || document.getElementById('c127lv')) return;

  var ORDER = ['Oni', 'Alka', 'Naïa', 'Terra', 'Ignis', 'Astria', 'Irma'];
  var BODY = { Oni: 'Moon', Alka: 'Mercury', 'Naïa': 'Venus', Terra: 'Saturn', Ignis: 'Mars', Astria: 'Sun', Irma: 'Jupiter' };
  var ASTRE = { Oni: 'Lune', Alka: 'Mercure', 'Naïa': 'Vénus', Terra: 'Saturne', Ignis: 'Mars', Astria: 'Soleil', Irma: 'Jupiter' };
  var SIGNS = ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'];
  var DIG = {
    Astria: [[4], [0], [10], [6]], Oni: [[3], [1], [9], [7]], Alka: [[2, 5], [5], [8, 11], [11]], 'Naïa': [[1, 6], [11], [7, 0], [5]],
    Ignis: [[0, 7], [9], [6, 1], [3]], Irma: [[8, 11], [3], [2, 5], [9]], Terra: [[9, 10], [6], [3, 4], [0]]
  };
  var QUESTIONS = {
    Oni: 'Cette semaine, ai-je prêté attention à mes rêves et à mes images intérieures ?',
    Alka: 'Ai-je relié des choses qui se répètent dans ma vie ?',
    'Naïa': 'Ai-je accueilli mes émotions sans les juger ?',
    Terra: 'Me suis-je appuyé·e sur mon corps, mes limites, mon sol ?',
    Ignis: 'Ai-je posé un acte au lieu d’attendre le moment parfait ?',
    Astria: 'Ai-je gardé le cap vers ce qui compte pour moi ?',
    Irma: 'Ai-je fait un choix clair, même petit ?'
  };
  var VILLES = D.villes.map(function (v) { return { name: v[0], lat: v[1], lon: v[2], tz: v[3] }; });
  var BY_MASK = {}; D.lames.forEach(function (l) { BY_MASK[l[2]] = { n: l[0], name: l[1], mask: l[2], def: l[3] }; });

  /* ---------- Mémoire du navigateur ---------- */
  var KEY = 'c127lv';
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var S = load(); S.bilans = S.bilans || [];

  /* ---------- Ciel ---------- */
  var norm = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  function ville(name) { for (var i = 0; i < VILLES.length; i++) if (VILLES[i].name === name) return VILLES[i]; return null; }
  function tzOffset(ms, tz) {
    var p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ms));
    var g = function (t) { for (var i = 0; i < p.length; i++) if (p[i].type === t) return +p[i].value; return 0; };
    return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'), g('second')) - Math.floor(ms / 1000) * 1000;
  }
  function instant(b) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(b.date || ''); if (!m) return null;
    var t = /^(\d{1,2}):(\d{2})$/.exec(b.time || ''), h = t ? +t[1] : 12, mi = t ? +t[2] : 0, v = ville(b.place), d;
    try {
      if (v) { var wall = Date.UTC(+m[1], +m[2] - 1, +m[3], h, mi), u = wall - tzOffset(wall, v.tz); d = new Date(wall - tzOffset(u, v.tz)); }
      else d = new Date(+m[1], +m[2] - 1, +m[3], h, mi);
    } catch (e) { d = new Date(+m[1], +m[2] - 1, +m[3], h, mi); }
    return isNaN(d) || +m[1] < 1900 || d > new Date() ? null : d;
  }
  var n360 = function (x) { return ((x % 360) + 360) % 360; }, RAD = Math.PI / 180;
  var sep = function (a, b) { var d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  function angles(when, lat, lon) {
    var ramc = n360((A.SiderealTime(when) + lon / 15) * 15) * RAD, T = (when.getTime() / 864e5 + 2440587.5 - 2451545) / 36525, eps = (23.4392911 - 0.0130042 * T) * RAD;
    return {
      mc: n360(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / RAD),
      asc: n360(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat * RAD) * Math.sin(eps))) / RAD)
    };
  }
  function sky(b) {
    var when = instant(b); if (!when) return null;
    var L = {}; ORDER.forEach(function (s) { L[s] = A.Ecliptic(A.GeoVector(BODY[s], when, true)).elon; });
    var v = ville(b.place), ang = v && b.time ? angles(when, v.lat, v.lon) : null;
    var pl = ORDER.map(function (s) {
      var si = Math.floor(L[s] / 30) % 12, d = DIG[s], w = 1, why = [];
      if (d[0].indexOf(si) >= 0) { w += 1.5; why.push('en domicile'); }
      if (d[1].indexOf(si) >= 0) { w += 1; why.push('en exaltation'); }
      if (d[2].indexOf(si) >= 0) { w -= 0.5; why.push('en exil'); }
      if (d[3].indexOf(si) >= 0) { w -= 0.5; why.push('en chute'); }
      if (s !== 'Astria' && s !== 'Oni') {
        if (sep(L[s], L.Astria) <= 8) { w += 0.5; why.push('près du Soleil'); }
        if (sep(L[s], L.Oni) <= 8) { w += 0.5; why.push('près de la Lune'); }
      }
      if (ang) {
        var near = [[ang.asc, 'sur l’ascendant'], [n360(ang.asc + 180), 'au descendant'], [ang.mc, 'au milieu du ciel'], [n360(ang.mc + 180), 'au fond du ciel']];
        for (var i = 0; i < near.length; i++) if (sep(L[s], near[i][0]) <= 8) { w += 1; why.push(near[i][1]); break; }
      }
      if (s === 'Oni' && sep(L.Oni, L.Astria) <= 12) { w += 0.5; why.push('nouvelle lune'); }
      if (s === 'Oni' && sep(L.Oni, L.Astria) >= 168) { w += 0.5; why.push('pleine lune'); }
      return { s: s, sign: SIGNS[si], deg: Math.floor(L[s] % 30), w: Math.max(0.5, w), why: why };
    });
    var max = Math.max.apply(null, pl.map(function (p) { return p.w; })), lv = {};
    pl.forEach(function (p) { lv[p.s] = p.w / max; });
    return { pl: pl, lv: lv, ang: ang };
  }

  /* ---------- Vécu ---------- */
  function isoWeek(d) {
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    var y = t.getUTCFullYear(), w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
    return y + '-W' + (w < 10 ? '0' : '') + w;
  }
  var WEEK = isoWeek(new Date());
  var sat = function (n, k) { return 1 - Math.exp(-Math.max(0, n) / k); };
  var counts = { Oni: null, Alka: null }; // seules données de pratique visibles depuis le site
  function vecu() {
    var b = S.bilans.filter(function (x) { return x.week === WEEK; })[0], lv = {};
    ORDER.forEach(function (s, i) {
      var ans = b ? b.answers[i] / 4 : null;
      var act = s === 'Oni' && counts.Oni != null ? sat(counts.Oni, 6) : s === 'Alka' && counts.Alka != null ? sat(counts.Alka, 3) : null;
      lv[s] = act != null && ans != null ? 0.5 * act + 0.5 * ans : act != null ? act : ans != null ? ans : 0;
    });
    return lv;
  }
  function maskOf(lv) {
    var m = 0, best = ORDER[0];
    ORDER.forEach(function (s, i) { if (lv[s] >= 0.6) m |= 1 << i; if (lv[s] > lv[best]) best = s; });
    return m || 1 << ORDER.indexOf(best);
  }
  function reading(a, v) {
    var top = function (l) { return ORDER.reduce(function (x, s) { return l[s] > l[x] ? s : x; }, ORDER[0]); };
    var sk = top(a), li = top(v), out = [];
    var next = ORDER.filter(function (s) { return a[s] >= 0.6; }).sort(function (x, y) { return (a[y] - v[y]) - (a[x] - v[x]); })[0];
    var beyond = ORDER.filter(function (s) { return v[s] >= 0.6 && a[s] < 0.6; }).sort(function (x, y) { return v[y] - v[x]; })[0];
    if (Math.max.apply(null, ORDER.map(function (s) { return v[s]; })) < 0.15) out.push('Ton ciel met ' + sk + ' en avant. Ton chemin vécu ne fait que commencer : le bilan de la semaine et chaque rêve noté y laisseront une trace.');
    else if (sk === li) out.push('Ton ciel met ' + sk + ' en avant, et c’est aussi par elle que passe ton chemin en ce moment : tu vis ce que tu portes.');
    else out.push('Ton ciel met ' + sk + ' en avant, mais en ce moment ton chemin passe surtout par ' + li + '.');
    if (next && a[next] - v[next] > 0.25) out.push('Le pas suivant : un petit geste avec ' + next + ', qui t’est donnée dès la naissance mais que tu pratiques peu en ce moment.');
    if (beyond) out.push(beyond + ' ne domine pas ton ciel, et pourtant tu la fais vivre : ce qui s’acquiert compte autant que ce qui est donné.');
    return out;
  }

  /* ---------- Dessin ---------- */
  var SZ = 320, CC = 160, R = 112, NS = 'http://www.w3.org/2000/svg';
  var ax = function (i, r) { var a = -Math.PI / 2 + i * 2 * Math.PI / 7; return [CC + r * Math.cos(a), CC + r * Math.sin(a)]; };
  function blob(l, min) {
    var p = ORDER.map(function (s, i) { return ax(i, R * Math.max(min || 0.08, Math.min(1, l[s] || 0))); }), n = p.length, f = function (x) { return x.toFixed(1); };
    var d = 'M' + f(p[0][0]) + ' ' + f(p[0][1]);
    for (var i = 0; i < n; i++) {
      var p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
      d += ' C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
    }
    return d + ' Z';
  }
  var ring = function (r) { return ORDER.map(function (_, i) { var p = ax(i, r); return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ') + ' Z'; };
  function svg(a, v, trail) {
    var s = '<svg viewBox="0 0 ' + SZ + ' ' + SZ + '" role="img" aria-label="Ce que tu portes et ce que tu vis, Sœur par Sœur"><defs><radialGradient id="c127lv-g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f3dca0" stop-opacity=".55"/><stop offset="1" stop-color="#a99cf0" stop-opacity=".22"/></radialGradient></defs>';
    [0.33, 0.66, 1].forEach(function (k) { s += '<path d="' + ring(R * k) + '" fill="none" stroke="#d8b66b" stroke-opacity="' + (k === 1 ? 0.35 : 0.12) + '"/>'; });
    ORDER.forEach(function (n, i) { var p = ax(i, R), q = ax(i, R + 22); s += '<line x1="160" y1="160" x2="' + p[0] + '" y2="' + p[1] + '" stroke="#d8b66b" stroke-opacity=".1"/><text x="' + q[0] + '" y="' + (q[1] + 4) + '" text-anchor="middle" class="c127lv-ax">' + n + '</text>'; });
    trail.forEach(function (l, i) { s += '<path d="' + blob(l) + '" fill="none" stroke="#a99cf0" stroke-opacity="' + (0.12 + 0.05 * (trail.length - i)) + '"/>'; });
    s += '<path class="c127lv-v" d="' + blob(v) + '" fill="url(#c127lv-g)" stroke="#f3dca0" stroke-opacity=".8" stroke-width="1.5"/>';
    if (a) s += '<path class="c127lv-a" d="' + blob(a, 0.15) + '" fill="none" stroke="#d8b66b" stroke-width="2" stroke-dasharray="5 5"/>';
    return s + '<circle cx="160" cy="160" r="3" fill="#f3dca0"/></svg>';
  }
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function door(label, mask) {
    var l = BY_MASK[mask]; if (!l) return '';
    var img = C.cards ? C.cards + 'card-' + ('00' + l.n).slice(-3) + '.jpg' : '';
    return '<figure class="c127lv-door"><figcaption>' + label + '</figcaption>' + (img ? '<span class="c127lv-art"><img src="' + esc(img) + '" alt="Lame ' + l.n + ' · ' + esc(l.name) + '" loading="lazy"></span>' : '') +
      '<b>' + esc(l.name) + '</b><small>' + ORDER.filter(function (_, i) { return (mask >> i) & 1; }).join(' · ') + '</small></figure>';
  }

  /* ---------- Interface ---------- */
  var root = document.createElement('section');
  root.id = 'c127lv'; root.className = 'c127lv';
  host.parentNode.insertBefore(root, host.nextSibling);
  // L'ancienne carte « Ma carte du ciel de naissance » est remplacée par celle-ci.
  var old = document.getElementById('pl-bd'); if (old && old.closest('.card')) old.closest('.card').classList.add('c127lv-old');

  var editSky = !S.birth, editBilan = false, draft = [-1, -1, -1, -1, -1, -1, -1];
  function render() {
    var sk = S.birth ? sky(S.birth) : null, v = vecu(), a = sk ? sk.lv : null;
    var trail = S.bilans.filter(function (b) { return b.week !== WEEK && b.levels; }).slice(0, 7).map(function (b) { return b.levels; });
    var thisWeek = S.bilans.filter(function (b) { return b.week === WEEK; })[0];
    var h = '<p class="c127lv-k">Le Labyrinthe vivant</p><h2>Ce que tu portes, ce que tu vis</h2>' +
      '<div class="c127lv-fig">' + svg(a, v, trail) + '</div>' +
      '<p class="c127lv-legend"><span class="a">┄ Ton ciel' + (a ? '' : ' : à renseigner') + '</span><span class="v">◉ Ton vécu</span>' + (trail.length ? '<span class="t">◌ Semaines passées</span>' : '') + '</p>';
    if (a) {
      h += reading(a, v).map(function (p, i) { return '<p class="' + (i ? 'c127lv-p' : 'c127lv-lead') + '">' + esc(p) + '</p>'; }).join('');
      var am = maskOf(a), vm = maskOf(v);
      h += '<div class="c127lv-doors">' + door('Porte de naissance', am) + '<span class="c127lv-arrow">→</span>' + door('Porte du moment', vm) + '</div>';
      if (am !== vm) {
        var add = ORDER.filter(function (_, i) { return (am >> i) & 1 && !((vm >> i) & 1); }), won = ORDER.filter(function (_, i) { return (vm >> i) & 1 && !((am >> i) & 1); });
        h += '<p class="c127lv-path">Le chemin entre les deux portes : ' + (add.length ? add.map(function (s) { return '+ ' + s; }).join(', ') : 'rien à ajouter') + (won.length ? ' · déjà conquis : ' + won.join(', ') : '') + '</p>';
      }
    }
    // Bilan de la semaine
    h += '<div class="c127lv-box"><h3>Bilan de la semaine</h3>';
    if (thisWeek && !editBilan) h += '<p class="c127lv-p">Fait cette semaine' + (C.loggedIn ? ' : il compte avec les rêves de ton Grimoire.' : '.') + '</p><button type="button" class="c127lv-link" data-act="rebilan">Revoir mes réponses ›</button>';
    else {
      h += '<p class="c127lv-small">Sept questions, une par Sœur. 0 = pas du tout, 4 = pleinement.</p>';
      ORDER.forEach(function (s, i) {
        h += '<fieldset class="c127lv-q"><legend><b>' + s + '</b> · ' + esc(QUESTIONS[s]) + '</legend><div>' + [0, 1, 2, 3, 4].map(function (n) {
          return '<button type="button" data-q="' + i + '" data-n="' + n + '" aria-pressed="' + (draft[i] === n) + '">' + n + '</button>';
        }).join('') + '</div></fieldset>';
      });
      h += '<button type="button" class="c127lv-cta" data-act="bilan"' + (draft.every(function (x) { return x >= 0; }) ? '' : ' disabled') + '>Garder mon bilan</button>';
    }
    h += '</div>';
    // Ciel de naissance
    h += '<div class="c127lv-box"><h3>Ton ciel de naissance</h3>';
    if (sk && !editSky) {
      h += '<ul class="c127lv-pl">' + sk.pl.map(function (p) { return '<li><b>' + p.s + '</b> · ' + ASTRE[p.s] + ' en ' + p.sign + ' ' + p.deg + '°' + (p.why.length ? ' · ' + p.why.join(', ') : '') + '</li>'; }).join('') + '</ul>';
      h += sk.ang ? '<p class="c127lv-p"><b>Ascendant</b> en ' + SIGNS[Math.floor(sk.ang.asc / 30)] + ' ' + Math.floor(sk.ang.asc % 30) + '° · <b>Milieu du ciel</b> en ' + SIGNS[Math.floor(sk.ang.mc / 30)] + ' ' + Math.floor(sk.ang.mc % 30) + '°</p>' : '<p class="c127lv-small">Ajoute l’heure et le lieu de naissance pour l’ascendant et le milieu du ciel.</p>';
      h += '<button type="button" class="c127lv-link" data-act="resky">Modifier ma naissance ›</button>';
    } else {
      var b = S.birth || {};
      h += '<p class="c127lv-small">Ta date de naissance, et si tu les connais l’heure et le lieu. Le calcul se fait dans ton navigateur : rien n’est envoyé ni enregistré sur le site.</p>' +
        '<div class="c127lv-form"><label>Date<input type="date" id="c127lv-d" value="' + esc(b.date || '') + '"></label><label>Heure (facultatif)<input type="time" id="c127lv-t" value="' + esc(b.time || '') + '"></label>' +
        '<label>Lieu (facultatif)<input type="text" id="c127lv-p" list="c127lv-villes" autocomplete="off" placeholder="Commence à taper une ville" value="' + esc(b.place || '') + '"></label></div>' +
        '<datalist id="c127lv-villes">' + VILLES.map(function (v) { return '<option value="' + esc(v.name) + '">'; }).join('') + '</datalist>' +
        '<button type="button" class="c127lv-cta" data-act="sky">Lire mon ciel</button><p class="c127lv-msg" id="c127lv-msg" aria-live="polite"></p>';
    }
    h += '<p class="c127lv-small">Lecture symbolique : les correspondances astrales inspirent la réflexion, elles ne décrivent ni ne prédisent qui tu es. Ce qui compte ici, c’est ce que tu en fais.</p></div>';
    h += '<p class="c127lv-small c127lv-app">' + (C.loggedIn ? 'Ton vécu compte ici tes rêves du Grimoire et ton bilan. ' : 'Connecte-toi pour que tes rêves du Grimoire nourrissent ton vécu. ') + 'Dans l’application, il se nourrit aussi de tes émotions, gestes, lectures de la main et pages de journal.</p>';
    root.innerHTML = h;
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-q')) { draft[+b.getAttribute('data-q')] = +b.getAttribute('data-n'); return render(); }
    var act = b.getAttribute('data-act');
    if (act === 'rebilan') { var tw = S.bilans.filter(function (x) { return x.week === WEEK; })[0]; draft = tw ? tw.answers.slice() : draft; editBilan = true; return render(); }
    if (act === 'bilan') {
      var tmp = { week: WEEK, at: new Date().toISOString(), answers: draft.slice() };
      S.bilans = [tmp].concat(S.bilans.filter(function (x) { return x.week !== WEEK; })).slice(0, 52);
      tmp.levels = vecu(); save(S); editBilan = false; return render();
    }
    if (act === 'resky') { editSky = true; return render(); }
    if (act === 'sky') {
      var d = document.getElementById('c127lv-d').value, t = document.getElementById('c127lv-t').value, p = document.getElementById('c127lv-p').value.trim();
      var nb = { date: d, time: t || undefined, place: ville(p) ? p : undefined };
      var msg = document.getElementById('c127lv-msg');
      if (!instant(nb)) { msg.textContent = 'Date invalide.'; return; }
      if (p && !ville(p)) { msg.textContent = 'Ville absente de la liste : choisis la grande ville la plus proche.'; return; }
      S.birth = nb; save(S); editSky = false; return render();
    }
  });

  render();
  // Les rêves du Grimoire (personnes connectées) nourrissent Oni et Alka.
  if (C.loggedIn && C.dreams) {
    fetch(C.dreams, { credentials: 'same-origin', headers: { 'X-WP-Nonce': C.nonce || '' } }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (l) {
      var list = Array.isArray(l) ? l : (l && l.dreams) || [], since = Date.now() - 30 * 864e5, sym = {}, n = 0;
      list.forEach(function (d) {
        var t = Date.parse(d.dream_date || d.date || ''); if (!(t >= since)) return; n++;
        var sy = Array.isArray(d.symbols) ? d.symbols : String(d.symbols || '').split(','), seen = {};
        sy.forEach(function (s) { var k = norm(String(s).trim()); if (k && !seen[k]) { seen[k] = 1; sym[k] = (sym[k] || 0) + 1; } });
      });
      counts.Oni = n; counts.Alka = Object.keys(sym).filter(function (k) { return sym[k] >= 2; }).length;
      render();
    }).catch(function () {});
  }
})();
