/* Le Cercle 127 — Quiz d'Astria. Tout se calcule dans le navigateur (même moteur que le Labyrinthe vivant) :
   aucune réponse n'est envoyée au site. Un miroir symbolique, jamais une prédiction. */
(function () {
  'use strict';
  var root = document.getElementById('c127qa');
  if (!root) return;
  var A = window.Astronomy, D = window.C127LV_DATA, C = window.C127QA || {};

  var ORDER = ['Oni', 'Alka', 'Naïa', 'Terra', 'Ignis', 'Astria', 'Irma'];
  var SLUG = { Oni: 'oni', Alka: 'alka', 'Naïa': 'naia', Terra: 'terra', Ignis: 'ignis', Astria: 'astria', Irma: 'irma' };
  var BODY = { Oni: 'Moon', Alka: 'Mercury', 'Naïa': 'Venus', Terra: 'Saturn', Ignis: 'Mars', Astria: 'Sun', Irma: 'Jupiter' };
  var ROLE = {
    Oni: 'elle lit tes rêves et leurs images', Alka: 'elle relie ce qui se répète', 'Naïa': 'elle accueille tes émotions',
    Terra: 'elle te ramène au corps et au sol', Ignis: 'elle transforme une idée en premier pas', Astria: 'elle éclaire ce qui t’appelle', Irma: 'elle t’aide à choisir'
  };
  var SIGNS = ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'];
  var GLYPH = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  var ELEM = ['Feu', 'Terre', 'Air', 'Eau'];
  var ELEM_TXT = {
    Feu: 'un élan qui a besoin de se mettre en mouvement',
    Terre: 'un besoin d’ancrage, de concret et de temps',
    Air: 'un esprit qui relie les idées et les personnes',
    Eau: 'une sensibilité profonde, proche des émotions et des rêves'
  };
  var DIG = {
    Astria: [[4], [0], [10], [6]], Oni: [[3], [1], [9], [7]], Alka: [[2, 5], [5], [8, 11], [11]], 'Naïa': [[1, 6], [11], [7, 0], [5]],
    Ignis: [[0, 7], [9], [6, 1], [3]], Irma: [[8, 11], [3], [2, 5], [9]], Terra: [[9, 10], [6], [3, 4], [0]]
  };
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var RECALL = [
    ['souvent', 'Presque chaque matin'], ['parfois', 'De temps en temps'], ['rarement', 'Rarement'], ['jamais', 'Presque jamais']
  ];
  var THEMES = ['Tomber', 'Être poursuivi·e', 'L’eau', 'Une maison', 'Une personne disparue', 'Un examen, un retard', 'Voler', 'Perdre ses dents', 'Être perdu·e', 'Un animal'];
  var SEEK = [
    ['Oni', 'Comprendre un rêve qui m’habite'], ['Alka', 'Voir ce qui revient dans ma vie'], ['Naïa', 'Apaiser une émotion'],
    ['Terra', 'Retrouver de l’ancrage'], ['Ignis', 'Passer à l’action'], ['Astria', 'Clarifier une envie'], ['Irma', 'Faire un choix']
  ];

  var Q = { name: '', d: '', m: '', y: '', time: '', place: '', recall: '', themes: [], seek: '' };
  var step = 0;
  var TOTAL = 7; // questions comptées dans la barre (l'accueil et la carte n'en font pas partie)

  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var img = function (s) { return (C.img || '') + SLUG[s] + '.webp'; };
  var n360 = function (x) { return ((x % 360) + 360) % 360; }, RAD = Math.PI / 180;
  var sep = function (a, b) { var d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  var villes = D && D.villes ? D.villes.map(function (v) { return { name: v[0], lat: v[1], lon: v[2], tz: v[3] }; }) : [];
  function ville(name) { for (var i = 0; i < villes.length; i++) if (villes[i].name === name) return villes[i]; return null; }

  /* ---------- Ciel (même calcul que le Labyrinthe vivant) ---------- */
  function tzOffset(ms, tz) {
    var p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ms));
    var g = function (t) { for (var i = 0; i < p.length; i++) if (p[i].type === t) return +p[i].value; return 0; };
    return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'), g('second')) - Math.floor(ms / 1000) * 1000;
  }
  function instant() {
    var y = +Q.y, mo = +Q.m, da = +Q.d; if (!y || !mo || !da) return null;
    if (new Date(y, mo - 1, da).getMonth() !== mo - 1) return null; // 31 février, etc.
    var t = /^(\d{1,2}):(\d{2})$/.exec(Q.time || ''), h = t ? +t[1] : 12, mi = t ? +t[2] : 0, v = ville(Q.place), d;
    try {
      if (v) { var wall = Date.UTC(y, mo - 1, da, h, mi), u = wall - tzOffset(wall, v.tz); d = new Date(wall - tzOffset(u, v.tz)); }
      else d = new Date(y, mo - 1, da, h, mi);
    } catch (e) { d = new Date(y, mo - 1, da, h, mi); }
    if (isNaN(d)) return null;
    return d > new Date() ? null : d;
  }
  function sunSignByDate(mo, da) { // repli sans moteur : dates usuelles des signes
    var cut = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];
    return da >= cut[mo - 1] ? (mo + 9) % 12 : (mo + 8) % 12;
  }
  function angles(when, lat, lon) {
    var ramc = n360((A.SiderealTime(when) + lon / 15) * 15) * RAD, T = (when.getTime() / 864e5 + 2440587.5 - 2451545) / 36525, eps = (23.4392911 - 0.0130042 * T) * RAD;
    return {
      mc: n360(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / RAD),
      asc: n360(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat * RAD) * Math.sin(eps))) / RAD)
    };
  }
  function sky() {
    var when = instant(); if (!when) return null;
    if (!A) return { sun: sunSignByDate(+Q.m, +Q.d), moon: null, asc: null, lv: null };
    var L = {}; ORDER.forEach(function (s) { L[s] = A.Ecliptic(A.GeoVector(BODY[s], when, true)).elon; });
    var v = ville(Q.place), ang = v && Q.time ? angles(when, v.lat, v.lon) : null, lv = {}, max = 0;
    ORDER.forEach(function (s) {
      var si = Math.floor(L[s] / 30) % 12, d = DIG[s], w = 1;
      if (d[0].indexOf(si) >= 0) w += 1.5;
      if (d[1].indexOf(si) >= 0) w += 1;
      if (d[2].indexOf(si) >= 0) w -= 0.5;
      if (d[3].indexOf(si) >= 0) w -= 0.5;
      if (s !== 'Astria' && s !== 'Oni') { if (sep(L[s], L.Astria) <= 8) w += 0.5; if (sep(L[s], L.Oni) <= 8) w += 0.5; }
      if (ang) {
        var near = [ang.asc, n360(ang.asc + 180), ang.mc, n360(ang.mc + 180)];
        for (var i = 0; i < near.length; i++) if (sep(L[s], near[i]) <= 8) { w += 1; break; }
      }
      if (s === 'Oni' && (sep(L.Oni, L.Astria) <= 12 || sep(L.Oni, L.Astria) >= 168)) w += 0.5;
      lv[s] = Math.max(0.5, w); if (lv[s] > max) max = lv[s];
    });
    ORDER.forEach(function (s) { lv[s] = lv[s] / max; });
    return { sun: Math.floor(L.Astria / 30) % 12, moon: Math.floor(L.Oni / 30) % 12, asc: ang ? Math.floor(ang.asc / 30) % 12 : null, lv: lv };
  }
  function maskOf(lv) {
    var m = 0, best = ORDER[0];
    ORDER.forEach(function (s, i) { if (lv[s] >= 0.6) m |= 1 << i; if (lv[s] > lv[best]) best = s; });
    return m || 1 << ORDER.indexOf(best);
  }
  function lame(mask) {
    if (!D || !D.lames) return null;
    for (var i = 0; i < D.lames.length; i++) if (D.lames[i][2] === mask) return { n: D.lames[i][0], name: D.lames[i][1], def: D.lames[i][3] };
    return null;
  }

  /* ---------- Dessin des écrans ---------- */
  function bubble(text, who, noAvatar) {
    who = who || 'Astria';
    return '<div class="c127qa__guide"><p class="c127qa__bubble' + (noAvatar ? ' c127qa__bubble--flat' : '') + '">' + text + '</p>' +
      (noAvatar ? '' : '<img class="c127qa__avatar" src="' + esc(img(who)) + '" alt="' + esc(who) + '" width="56" height="56">') + '</div>';
  }
  function head() {
    if (step === 0 || step > TOTAL) return '';
    return '<div class="c127qa__head"><button type="button" class="c127qa__back" data-act="back" aria-label="Question précédente">←</button>' +
      '<span class="c127qa__brand">Astria</span><span class="c127qa__count">' + step + ' / ' + TOTAL + '</span></div>' +
      '<div class="c127qa__bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + TOTAL + '" aria-valuenow="' + step + '"><span style="width:' + Math.round(step / TOTAL * 100) + '%"></span></div>';
  }
  function next(label, disabled) {
    return '<button type="button" class="c127qa__next" data-act="next"' + (disabled ? ' disabled' : '') + '>' + esc(label || 'Continuer') + '</button>';
  }
  function opts(list, key, multi) {
    return '<div class="c127qa__opts' + (multi ? ' c127qa__opts--chips' : '') + '" role="group">' + list.map(function (o) {
      var val = Array.isArray(o) ? o[0] : o, lab = Array.isArray(o) ? o[1] : o;
      var on = multi ? Q[key].indexOf(val) >= 0 : Q[key] === val;
      return '<button type="button" class="c127qa__opt' + (on ? ' is-on' : '') + '" data-key="' + key + '" data-val="' + esc(val) + '" aria-pressed="' + on + '">' + esc(lab) + '</button>';
    }).join('') + '</div>';
  }
  function liveSign() {
    var mo = +Q.m, da = +Q.d; if (!mo || !da) return -1;
    return sunSignByDate(mo, da);
  }
  function signStrip() {
    var s = liveSign(); if (s < 0) return '<div class="c127qa__signs" aria-hidden="true"></div>';
    var cell = function (i, cls) { return '<span class="c127qa__sign ' + cls + '"><b>' + GLYPH[(i + 12) % 12] + '︎</b>' + SIGNS[(i + 12) % 12] + '</span>'; };
    return '<div class="c127qa__signs" aria-live="polite">' + cell(s - 1, 'is-side') + cell(s, 'is-main') + cell(s + 1, 'is-side') + '</div>';
  }

  function screen() {
    var n = Q.name ? esc(Q.name) : '';
    switch (step) {
      case 0:
        return '<div class="c127qa__intro"><img class="c127qa__hero" src="' + esc(img('Astria')) + '" alt="Astria" width="160" height="160">' +
          '<p class="c127qa__kicker">Le Cercle 127 · Quiz d’Astria</p><h2>Ta carte du Cercle</h2>' +
          bubble('Je suis Astria, l’étoile des aspirations. En sept questions, je trace ta carte : ton ciel de naissance, la Sœur qui t’accompagne et ta porte parmi les 127.', 'Astria', true) +
          '<p class="c127qa__small">Environ 2 minutes. Le calcul se fait sur ton appareil : rien n’est envoyé.</p>' + next('Commencer') + '</div>';
      case 1:
        return bubble('Avant tout : comment veux-tu que je t’appelle ?') +
          '<label class="c127qa__label" for="c127qa-name">Ton prénom ou un surnom</label><input id="c127qa-name" class="c127qa__input" maxlength="30" autocomplete="given-name" value="' + esc(Q.name) + '" placeholder="Facultatif">' +
          next('Continuer');
      case 2:
        var days = '', months = '', years = '', y0 = new Date().getFullYear();
        for (var d = 1; d <= 31; d++) days += '<option value="' + d + '"' + (+Q.d === d ? ' selected' : '') + '>' + d + '</option>';
        MOIS.forEach(function (mm, i) { months += '<option value="' + (i + 1) + '"' + (+Q.m === i + 1 ? ' selected' : '') + '>' + mm + '</option>'; });
        for (var y = y0; y >= 1920; y--) years += '<option value="' + y + '"' + (+Q.y === y ? ' selected' : '') + '>' + y + '</option>';
        return bubble((n ? n + ', q' : 'Q') + 'uel jour es-tu né·e ? Ton Soleil commence à se dessiner.') + signStrip() +
          '<div class="c127qa__date"><label><span>Jour</span><select data-f="d"><option value="">—</option>' + days + '</select></label>' +
          '<label><span>Mois</span><select data-f="m"><option value="">—</option>' + months + '</select></label>' +
          '<label><span>Année</span><select data-f="y"><option value="">—</option>' + years + '</select></label></div>' +
          '<p class="c127qa__err" id="c127qa-err" role="alert"></p>' + next('Continuer', !(Q.d && Q.m && Q.y));
      case 3:
        var list = villes.map(function (v) { return '<option value="' + esc(v.name) + '">'; }).join('');
        return bubble('Si tu les connais, ton heure et ton lieu de naissance me donnent ton ascendant. Sinon, passe : ta carte sera quand même juste.') +
          '<label class="c127qa__label" for="c127qa-time">Heure de naissance</label><input id="c127qa-time" class="c127qa__input" type="time" value="' + esc(Q.time) + '">' +
          '<label class="c127qa__label" for="c127qa-place">Ville (ou la grande ville la plus proche)</label><input id="c127qa-place" class="c127qa__input" list="c127qa-villes" value="' + esc(Q.place) + '" autocomplete="off" placeholder="Ex. : Montpellier"><datalist id="c127qa-villes">' + list + '</datalist>' +
          '<p class="c127qa__err" id="c127qa-err" role="alert"></p>' + next('Continuer') + '<button type="button" class="c127qa__skip" data-act="skip">Je ne sais pas, passer</button>';
      case 4:
        return bubble('Les rêves sont la porte d’Oni. Te souviens-tu de tes rêves au réveil ?', 'Oni') + opts(RECALL, 'recall') + next('Continuer', !Q.recall);
      case 5:
        return bubble('Qu’est-ce qui revient dans tes nuits ? Choisis autant d’images que tu veux.', 'Alka') + opts(THEMES, 'themes', true) + next(Q.themes.length ? 'Continuer' : 'Rien de tout cela');
      case 6:
        return bubble('Et en ce moment, de quoi as-tu le plus besoin ?') + opts(SEEK, 'seek') + next('Continuer', !Q.seek);
      case 7:
        return bubble('Je relie ton ciel, tes nuits et ce que tu cherches…') + '<div class="c127qa__orbit" aria-hidden="true">' + ORDER.map(function (s, i) {
          return '<img src="' + esc(img(s)) + '" alt="" style="--i:' + i + '">';
        }).join('') + '</div><p class="c127qa__small c127qa__center">Ta carte du Cercle apparaît dans un instant.</p>';
      default:
        return card();
    }
  }

  function card() {
    var sk = sky(), sun = sk ? sk.sun : liveSign();
    var guide = sk && sk.lv ? ORDER.reduce(function (x, s) { return sk.lv[s] > sk.lv[x] ? s : x; }, ORDER[0]) : 'Astria';
    var moment = Q.seek || 'Oni';
    var mask = sk && sk.lv ? maskOf(sk.lv) : (1 << ORDER.indexOf(guide));
    var door = lame(mask);
    var elem = sun >= 0 ? ELEM[sun % 4] : null;
    var who = Q.name ? esc(Q.name) : 'Toi';
    var cell = function (i, label) { return '<div class="c127qa__astre"><b class="c127qa__glyph">' + (i == null ? '·' : GLYPH[i] + '︎') + '</b><strong>' + (i == null ? '—' : SIGNS[i]) + '</strong><small>' + label + '</small></div>'; };
    var lines = [];
    if (elem) lines.push('Ton Soleil en ' + SIGNS[sun] + ' (élément ' + elem + ') parle d’' + ELEM_TXT[elem] + '.');
    lines.push('Ton ciel met <a href="' + esc((C.soeurs || {})[guide] || '#') + '">' + guide + '</a> en avant : ' + ROLE[guide] + '.');
    if (moment !== guide) lines.push('En ce moment, c’est <a href="' + esc((C.soeurs || {})[moment] || '#') + '">' + moment + '</a> qui t’accompagne : ' + ROLE[moment] + '.');
    else lines.push('Et c’est aussi elle qui t’accompagne en ce moment : tu vis ce que tu portes.');
    var recallTip = { souvent: 'Tu te souviens souvent de tes rêves : un récit confié à Oni chaque semaine fera vite apparaître ce qui revient.', parfois: 'Tes rêves viennent par vagues : note même un fragment au réveil, il suffit à ouvrir une porte.', rarement: 'Tes rêves se font discrets : avant de dormir, pose-toi une question ; au réveil, reste immobile une minute avant de bouger.', jamais: 'Tu ne te souviens presque pas de tes rêves : commence par noter ton humeur au réveil, les images reviendront.' }[Q.recall];
    if (recallTip) lines.push(recallTip);
    if (Q.themes.length) lines.push('Ce qui revient la nuit (' + Q.themes.map(esc).join(', ').toLowerCase() + ') : Alka t’aidera à relier ces images d’une nuit à l’autre.');
    var save = C.loggedIn
      ? '<a class="c127qa__next c127qa__link" href="' + esc(C.grimoire) + '">Ouvrir mon Grimoire</a>'
      : '<a class="c127qa__next c127qa__link" href="' + esc(C.signup) + '">Garder ma carte dans mon Grimoire</a>';
    return '<article class="c127qa__card" aria-labelledby="c127qa-who">' +
      '<p class="c127qa__kicker">Ta carte du Cercle</p><h2 id="c127qa-who">' + who + '</h2>' +
      '<p class="c127qa__sub">' + [elem ? 'élément ' + elem : '', sun >= 0 ? SIGNS[sun] : '', 'Sœur guide : ' + guide].filter(Boolean).join(' · ') + '</p>' +
      '<div class="c127qa__portrait"><span class="c127qa__halo"></span><img src="' + esc(img(guide)) + '" alt="' + esc(guide) + '" width="180" height="180"></div>' +
      '<div class="c127qa__astres">' + cell(sk ? sk.moon : null, 'Lune') + cell(sun >= 0 ? sun : null, 'Soleil') + cell(sk ? sk.asc : null, 'Ascendant') + '</div>' +
      (sk && sk.asc == null ? '<p class="c127qa__small c127qa__center">Ajoute ton heure et ta ville pour révéler ton ascendant.</p>' : '') +
      (door ? '<div class="c127qa__door"><span class="c127qa__num" aria-hidden="true">' + door.n + '</span>' +
        '<div><small>Ta porte de naissance · ' + door.n + ' / 127</small><strong>' + esc(door.name) + '</strong><p>' + esc(door.def || '') + '</p></div></div>' : '') +
      '<div class="c127qa__read">' + lines.map(function (l) { return '<p>' + l + '</p>'; }).join('') + '</div>' +
      '<p class="c127qa__note">Un miroir symbolique, jamais une prédiction : tu gardes la main sur le sens.</p>' +
      '<div class="c127qa__cta">' + save +
      '<a class="c127qa__ghost" href="' + esc(C.reve) + '">Raconter un rêve à Oni</a>' +
      '<a class="c127qa__ghost" href="' + esc(C.labyrinthe) + '">Explorer ma porte dans le Labyrinthe</a>' +
      '<button type="button" class="c127qa__skip" data-act="again">Refaire le quiz</button></div></article>';
  }

  function render(focus) {
    root.setAttribute('data-ready', '1');
    root.innerHTML = '<div class="c127qa__screen" data-step="' + step + '">' + head() + screen() + '</div>';
    if (step === 7) { setTimeout(function () { step = 8; persist(); render(true); }, 2200); }
    if (focus) {
      var h = root.querySelector('h2, .c127qa__bubble');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      var top = root.getBoundingClientRect().top + window.scrollY - 90;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  /** Garde la naissance pour le Labyrinthe vivant, sur ce navigateur seulement (même format). */
  function persist() {
    try {
      var KEY = 'c127lv', S = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (Q.y && Q.m && Q.d) {
        var pad = function (x) { return ('0' + x).slice(-2); };
        S.birth = { date: Q.y + '-' + pad(Q.m) + '-' + pad(Q.d), time: Q.time || undefined, place: ville(Q.place) ? Q.place : undefined };
        localStorage.setItem(KEY, JSON.stringify(S));
      }
    } catch (e) { /* navigation privée : rien à garder */ }
  }

  function validate() {
    var err = root.querySelector('#c127qa-err');
    if (step === 1) { var i = root.querySelector('#c127qa-name'); Q.name = i ? i.value.trim().slice(0, 30) : ''; }
    if (step === 2) {
      if (!instant()) { if (err) err.textContent = 'Cette date n’existe pas ou est dans le futur.'; return false; }
    }
    if (step === 3) {
      var t = root.querySelector('#c127qa-time'), p = root.querySelector('#c127qa-place');
      Q.time = t ? t.value : ''; Q.place = p ? p.value.trim() : '';
      if (Q.place && !ville(Q.place)) { if (err) err.textContent = 'Ville absente de la liste : choisis la grande ville la plus proche, ou passe.'; return false; }
    }
    return true;
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || !root.contains(b)) return;
    var act = b.getAttribute('data-act');
    if (b.hasAttribute('data-key')) {
      var k = b.getAttribute('data-key'), v = b.getAttribute('data-val');
      if (Array.isArray(Q[k])) { var at = Q[k].indexOf(v); if (at >= 0) Q[k].splice(at, 1); else Q[k].push(v); }
      else Q[k] = v;
      return render();
    }
    if (act === 'next') { if (!validate()) return; step += 1; return render(true); }
    if (act === 'skip') { Q.time = ''; Q.place = ''; step += 1; return render(true); }
    if (act === 'back') { step = Math.max(0, step - 1); return render(true); }
    if (act === 'again') { Q = { name: '', d: '', m: '', y: '', time: '', place: '', recall: '', themes: [], seek: '' }; step = 0; return render(true); }
  });
  root.addEventListener('change', function (e) {
    var f = e.target.getAttribute && e.target.getAttribute('data-f');
    if (f) {
      Q[f] = e.target.value;
      var strip = root.querySelector('.c127qa__signs'); if (strip) strip.outerHTML = signStrip();
      var nx = root.querySelector('.c127qa__next'); if (nx) nx.disabled = !(Q.d && Q.m && Q.y);
      var err = root.querySelector('#c127qa-err'); if (err) err.textContent = '';
    }
  });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('c127qa__input')) { e.preventDefault(); var nx = root.querySelector('.c127qa__next'); if (nx && !nx.disabled) nx.click(); }
  });

  render(false);
})();
