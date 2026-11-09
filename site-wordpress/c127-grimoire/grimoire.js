/* Le Cercle 127 — Grimoire : tableau de bord construit avec les vraies données de la personne connectée. */
(function () {
  'use strict';
  var C = window.C127Grim || {};
  var host = document.getElementById('c127g');
  if (!host) return;

  /* ---------- Outils ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
  function read(k, f) { try { return JSON.parse(localStorage.getItem(k) || 'null') || f; } catch (e) { return f; } }
  function dayKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function parseDate(s) {
    if (!s) return null;
    var m = String(s).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    var d = new Date(s); return isNaN(d) ? null : d;
  }
  var MONTHS = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  function fmt(d) { return d ? d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() : ''; }

  /* ---------- Émotions ---------- */
  var EMO = {
    joie: ['Joie', 1], serenite: ['Sérénité', 0.8], emerveillement: ['Émerveillement', 0.9], soulagement: ['Soulagement', 0.7],
    surprise: ['Surprise', 0.3], desir: ['Désir', 0.4], aucune: ['Neutre', 0], autre: ['Autre', 0],
    confusion: ['Confusion', -0.4], culpabilite: ['Culpabilité', -0.7], tristesse: ['Tristesse', -0.8],
    colere: ['Colère', -0.9], peur: ['Peur', -1], angoisse: ['Angoisse', -1]
  };
  function emo(v) { var k = norm(v).split(/[ /]/)[0]; return EMO[k] ? { key: k, label: EMO[k][0], val: EMO[k][1] } : (k ? { key: k, label: v, val: 0 } : null); }

  /* ---------- Symboles : petites icônes au trait ---------- */
  var ICON = {
    eau: '<path d="M3 8c3-2 5 2 8 0s5-2 8 0M3 13c3-2 5 2 8 0s5-2 8 0M3 18c3-2 5 2 8 0s5-2 8 0"/>',
    porte: '<path d="M6 21V9a6 6 0 0 1 12 0v12M6 21h12M10 21v-7a2 2 0 0 1 4 0v7"/>',
    chute: '<path d="M12 3v12M8 11l4 4 4-4M5 21l3-3M19 21l-3-3M12 21v-2"/>',
    maison: '<path d="M4 11 12 4l8 7v9H4zM10 20v-5h4v5"/>',
    foret: '<path d="M12 3 7 11h3l-4 6h12l-4-6h3zM12 17v4"/>',
    lune: '<path d="M15 4a8 8 0 1 0 5 13A7 7 0 0 1 15 4z"/>',
    feu: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 1 1 2 2 2 3 1-2 1-4 1-7z"/>',
    oiseau: '<path d="M3 12c4-1 6-5 9-5s3 3 3 3l5-1-4 4c-1 4-5 6-9 6l2-3c-3 0-5-2-6-4z"/>',
    serpent: '<path d="M4 18c3 0 3-4 6-4s3 4 6 4 3-4 3-7-2-5-5-5"/>',
    etoile: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>'
  };
  var SYN = [
    [/eau|mer|lac|riviere|ocean|pluie|vague|fleuve|bain|nag/, 'eau'], [/porte|seuil|passage|couloir|cle/, 'porte'],
    [/chute|tomb|vide|falaise|precipice/, 'chute'], [/maison|chambre|enfance|demeure|ecole/, 'maison'],
    [/foret|arbre|bois|jardin|racine/, 'foret'], [/lune|nuit|ciel|etoile/, 'lune'], [/feu|flamme|incendie|soleil/, 'feu'],
    [/vol|oiseau|aile|envol/, 'oiseau'], [/serpent|animal|loup|chat|chien/, 'serpent']
  ];
  function iconKey(s) { var n = norm(s); for (var i = 0; i < SYN.length; i++) if (SYN[i][0].test(n)) return SYN[i][1]; return 'etoile'; }
  function icon(key, cls) { return '<svg class="' + (cls || 'c127g-ic') + '" viewBox="0 0 24 24" aria-hidden="true">' + ICON[key] + '</svg>'; }

  /* ---------- Les portes : une Sœur rencontrée est une porte ouverte ---------- */
  function doors(dreams, memories) {
    var seen = {}, add = function (k, d) { if (!d) return; if (!seen[k] || d > seen[k]) seen[k] = d; };
    dreams.forEach(function (d) { add('oni', d.date); });
    (memories || []).forEach(function (m) { add(norm(m.sister).replace(/[^a-z]/g, ''), parseDate(m.date)); });
    var P = read('c127_portes', {}); Object.keys(P).forEach(function (k) { add(k, new Date(P[k])); });
    var R = read('c127_rituel', {});
    if (R.emotion) add('naia', parseDate(R.emotion.replace(/-(\d)(?!\d)/g, '-0$1')));
    if (R.main) add('terra', parseDate(R.main.replace(/-(\d)(?!\d)/g, '-0$1')));
    var M = read('c127_main', null); if (M && M.at) add('terra', new Date(M.at));
    var now = new Date();
    return (C.sisters || []).map(function (s) {
      var d = seen[s[0]];
      var state = !d ? 'fermee' : (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() ? 'encours' : 'ouverte');
      return { key: s[0], name: s[1], num: s[2], url: s[3], state: state, last: d };
    });
  }

  /* ---------- Rendu ---------- */
  var ARCH = '<svg class="c127g-arch" viewBox="0 0 220 260" aria-hidden="true"><defs>' +
    '<radialGradient id="c127g-glow" cx="50%" cy="55%" r="55%"><stop offset="0" stop-color="#f3dca0" stop-opacity=".9"/><stop offset=".45" stop-color="#d8b66b" stop-opacity=".35"/><stop offset="1" stop-color="#d8b66b" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="c127g-door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e2a8"/><stop offset="1" stop-color="#8a6a32"/></linearGradient></defs>' +
    '<ellipse cx="110" cy="140" rx="105" ry="120" fill="url(#c127g-glow)"/>' +
    '<path d="M30 250V110a80 80 0 0 1 160 0v140" fill="none" stroke="#d8b66b" stroke-opacity=".35"/>' +
    '<path d="M48 250V114a62 62 0 0 1 124 0v136" fill="none" stroke="#d8b66b" stroke-opacity=".55"/>' +
    '<path d="M70 236V120a40 40 0 0 1 80 0v116z" fill="url(#c127g-door)" opacity=".92"/>' +
    '<path d="M110 82v154M70 160h80M84 120h52" stroke="#5c4420" stroke-opacity=".35"/>' +
    '<circle cx="110" cy="128" r="14" fill="none" stroke="#5c4420" stroke-opacity=".5"/>' +
    '<path d="M54 236h112M44 244h132M34 252h152" stroke="#d8b66b" stroke-opacity=".5"/>' +
    [[22, 40], [196, 60], [180, 20], [40, 90], [205, 140], [14, 160]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.4" fill="#f3dca0"/>'; }).join('') + '</svg>';

  function render(dreams, memories) {
    var all = dreams.slice().sort(function (a, b) { return (b.date || 0) - (a.date || 0); });
    // Symboles et émotions qui reviennent
    var sc = {}, ec = {};
    all.forEach(function (d) {
      var u = {}; d.symbols.forEach(function (s) { var k = s.trim(); if (k && !u[norm(k)]) { u[norm(k)] = 1; sc[k] = (sc[k] || 0) + 1; } });
      var e = emo(d.emotion); if (e && e.key !== 'aucune') { ec[e.label] = (ec[e.label] || 0) + 1; }
    });
    var syms = Object.keys(sc).sort(function (a, b) { return sc[b] - sc[a]; });
    var recurring = syms.filter(function (s) { return sc[s] >= 2; });
    var emos = Object.keys(ec).sort(function (a, b) { return ec[b] - ec[a]; });
    var D = doors(all, memories), opened = D.filter(function (d) { return d.state !== 'fermee'; }).length;
    var R = read('c127_rituel', {}), first = (C.name || '').split(' ')[0];

    var h = '';
    h += '<header class="c127g-hero"><div><p class="c127g-hello">' + (first ? 'Bienvenue, ' + esc(first) + ', dans ton' : 'Bienvenue dans ton') + '</p>' +
      '<h1 class="c127g-title">Grimoire</h1><p class="c127g-sub">Ton espace intime de rêves et de sens.</p></div>' + ARCH + '</header>';
    var stat = function (n, l) { return '<div class="c127g-stat"><b>' + n + '</b><span>' + l + '</span></div>'; };
    h += '<section class="c127g-stats" aria-label="Ton Grimoire en chiffres">' +
      stat(all.length, all.length > 1 ? 'Rêves enregistrés' : 'Rêve enregistré') + stat(recurring.length, 'Symboles récurrents') +
      stat(opened, opened > 1 ? 'Portes ouvertes' : 'Porte ouverte') + stat((memories || []).length, 'Notes &amp; réflexions') + '</section>';

    // Récurrences (onglets)
    var bars = function (list, counts, kind) {
      if (!list.length) return '<p class="c127g-empty">' + (kind === 'sym' ? 'Note les symboles de tes rêves : ceux qui reviennent apparaîtront ici.' : 'Les émotions de tes réveils apparaîtront ici.') + '</p>';
      var max = counts[list[0]];
      return '<ul class="c127g-bars">' + list.slice(0, 5).map(function (s) {
        var ic = kind === 'sym' ? icon(iconKey(s)) : '<span class="c127g-dot" style="--v:' + (emo(s) ? emo(s).val : 0) + '"></span>';
        return '<li>' + ic + '<div class="c127g-bar"><p><b>' + esc(s) + '</b><small>' + counts[s] + ' apparition' + (counts[s] > 1 ? 's' : '') + '</small></p><span class="c127g-track"><i style="width:' + Math.max(8, Math.round(counts[s] / max * 100)) + '%"></i></span></div></li>';
      }).join('') + '</ul>';
    };
    h += '<div class="c127g-row c127g-row--a"><section class="c127g-card c127g-rec" aria-labelledby="c127g-rec-h"><h2 id="c127g-rec-h" class="c127g-h">Tes récurrences</h2>' +
      '<div class="c127g-tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-tab="sym">Symboles</button><button type="button" role="tab" aria-selected="false" data-tab="emo">Émotions</button></div>' +
      '<div data-panel="sym">' + bars(syms, sc, 'sym') + '</div><div data-panel="emo" hidden>' + bars(emos, ec, 'emo') + '</div></section>';

    // Carte des portes
    var cx = 160, cy = 150, r = 112, map = '<svg class="c127g-map" viewBox="0 0 320 300" role="img" aria-label="Carte des portes : ' + opened + ' sur 7 ouvertes">';
    map += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" class="c127g-ring"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 34) + '" class="c127g-ring c127g-ring--in"/>';
    var pts = D.map(function (d, i) { var a = -Math.PI / 2 + i * 2 * Math.PI / 7; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
    for (var i = 0; i < 7; i++) for (var j = i + 2; j < 7; j += 3) map += '<line x1="' + pts[i][0].toFixed(1) + '" y1="' + pts[i][1].toFixed(1) + '" x2="' + pts[j % 7][0].toFixed(1) + '" y2="' + pts[j % 7][1].toFixed(1) + '" class="c127g-star"/>';
    map += '<path d="M' + (cx - 22) + ' ' + (cy + 34) + 'V' + (cy - 6) + 'a22 22 0 0 1 44 0V' + (cy + 34) + 'z" class="c127g-door"/><path d="M' + (cx - 30) + ' ' + (cy + 34) + 'h60" class="c127g-door"/>';
    D.forEach(function (d, i) {
      map += '<a href="' + esc(d.url) + '" class="c127g-node is-' + d.state + '" aria-label="Porte ' + d.num + ', ' + esc(d.name) + ' : ' + { ouverte: 'ouverte', encours: 'en cours', fermee: 'fermée' }[d.state] + '">' +
        '<title>' + esc(d.name) + (d.last ? ' · dernière fois le ' + fmt(d.last) : ' · pas encore rencontrée') + '</title>' +
        '<circle cx="' + pts[i][0].toFixed(1) + '" cy="' + pts[i][1].toFixed(1) + '" r="22"/><text x="' + pts[i][0].toFixed(1) + '" y="' + (pts[i][1] + 5).toFixed(1) + '" text-anchor="middle">' + d.num + '</text></a>';
    });
    map += '</svg>';
    h += '<section class="c127g-card c127g-doors" aria-labelledby="c127g-doors-h"><h2 id="c127g-doors-h" class="c127g-h c127g-h--c">Carte des portes</h2>' + map +
      '<p class="c127g-legend"><span class="is-ouverte">Ouverte</span><span class="is-encours">En cours</span><span class="is-fermee">Fermée</span></p>' +
      '<p class="c127g-hint">Chaque porte est une Sœur. Elle s’ouvre quand tu pratiques avec elle.</p></section></div>';

    // Rêves récents
    var recent = all.slice(0, 3);
    h += '<div class="c127g-row c127g-row--b"><section class="c127g-card c127g-recent" aria-labelledby="c127g-recent-h"><h2 id="c127g-recent-h" class="c127g-h">Tes rêves récents</h2>';
    if (!recent.length) h += '<p class="c127g-empty">Aucun rêve pour l’instant. Le prochain réveil est une porte.</p>';
    h += recent.map(function (d) {
      var k = d.symbols.length ? iconKey(d.symbols[0]) : 'lune', e = emo(d.emotion);
      return '<article class="c127g-dream"><div class="c127g-thumb is-' + k + '">' + icon(k, 'c127g-thumb__ic') + '</div><div class="c127g-dream__b">' +
        '<p class="c127g-date">' + esc(fmt(d.date)) + '</p><h3>' + esc(d.title || 'Rêve sans titre') + '</h3>' +
        ((d.symbols.length || e) ? '<p class="c127g-motifs">' + d.symbols.slice(0, 3).map(esc).concat(e && e.key !== 'aucune' ? [esc(e.label)] : []).join(' · ') + '</p>' : '') +
        (d.text ? '<p class="c127g-excerpt">« ' + esc(d.text.slice(0, 120)) + (d.text.length > 120 ? '…' : '') + ' »</p>' : '') + '</div></article>';
    }).join('');
    h += '</section><div class="c127g-side">';
    h += '<section class="c127g-card c127g-journal"><h2 class="c127g-h">Journal intime</h2><p>Note ici tes réflexions, tes ressentis et tes prises de conscience, à voix haute ou par écrit.</p>' +
      '<a class="c127g-btn" href="' + esc((C.links || {}).carnet || '/carnet-vocal/') + '">Écrire</a></section>';

    // Suivi émotionnel (30 jours)
    var now = new Date(), from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29), byDay = {};
    all.forEach(function (d) { var e = emo(d.emotion); if (!e || !d.date || d.date < from) return; var k = dayKey(d.date); (byDay[k] = byDay[k] || []).push(e.val); });
    var P2 = [];
    for (var t = 0; t < 30; t++) { var day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + t), v = byDay[dayKey(day)]; if (v) P2.push([t, v.reduce(function (a, b) { return a + b; }, 0) / v.length]); }
    var W = 260, H2 = 90, X = function (t) { return 8 + t / 29 * (W - 16); }, Y = function (v) { return 10 + (1 - (v + 1) / 2) * (H2 - 20); };
    var chart = '<svg class="c127g-chart" viewBox="0 0 ' + W + ' ' + H2 + '" role="img" aria-label="Tonalité de tes réveils sur 30 jours">' +
      [0, 1, 2].map(function (g) { return '<line x1="8" x2="' + (W - 8) + '" y1="' + (10 + g * (H2 - 20) / 2) + '" y2="' + (10 + g * (H2 - 20) / 2) + '" class="c127g-grid"/>'; }).join('');
    if (P2.length > 1) chart += '<polyline points="' + P2.map(function (p) { return X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join(' ') + '" class="c127g-line"/>';
    chart += P2.map(function (p) { return '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="3" class="c127g-pt"/>'; }).join('') + '</svg>';
    var dom = (function () { var c = {}; all.forEach(function (d) { var e = emo(d.emotion); if (e && d.date >= from && e.key !== 'aucune') c[e.label] = (c[e.label] || 0) + 1; }); return Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).slice(0, 2); })();
    h += '<section class="c127g-card c127g-mood"><h2 class="c127g-h">Suivi émotionnel</h2>' + chart +
      '<p>' + (P2.length ? 'Tes émotions dominantes ces 30 derniers jours : <b>' + (dom.join(', ') || '—') + '</b>.' : 'Note l’émotion de tes réveils : la courbe des 30 derniers jours se dessinera ici.') + '</p>' +
      '<button type="button" class="c127g-more" data-c127g="map">Voir le détail →</button></section></div></div>';

    h += '<a class="c127g-cta" href="' + esc((C.links || {}).oni || '/lecture-de-reve/') + '"><span>Confier un nouveau rêve à Oni</span><small>La Perle d’Oni · lecture approfondie</small></a>';
    h += '<p class="c127g-foot">Sauvegarde automatique · Tes rêves restent privés · Tu gardes le contrôle' + (R.streak > 1 ? ' · ✦ ' + R.streak + ' jours de rituel' : '') + '</p>';
    host.innerHTML = h;

    host.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-tab]');
      if (tab) {
        Array.prototype.forEach.call(host.querySelectorAll('[data-tab]'), function (b) { b.setAttribute('aria-selected', b === tab ? 'true' : 'false'); });
        Array.prototype.forEach.call(host.querySelectorAll('[data-panel]'), function (p) { p.hidden = p.getAttribute('data-panel') !== tab.getAttribute('data-tab'); });
      }
      if (e.target.closest('[data-c127g="map"]')) {
        var m = document.getElementById('c127-map'); if (m) { m.classList.add('is-shown'); m.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }
    });
  }

  /* ---------- Données ---------- */
  function get(url) {
    return fetch(url, { credentials: 'same-origin', headers: { 'X-WP-Nonce': C.nonce || '' } }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function parseDream(d) {
    var t = String(d.title || ''), i = t.indexOf(':'); if (/^priv/i.test(t) && i >= 0) t = t.slice(i + 1).trim();
    var sy = Array.isArray(d.symbols) ? d.symbols : String(d.symbols || '').split(',');
    var text = d.content || d.dream_content || d.story || d.excerpt || d.text || '';
    text = String(text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return { title: t, date: parseDate(d.dream_date || d.date), emotion: d.emotion || '', symbols: sy.map(function (s) { return String(s).trim(); }).filter(Boolean), text: text };
  }
  document.body.classList.add('c127g-ready');
  // Le tableau de bord remplace la présentation « Mon Grimoire » (pour les visiteurs) et l'ancienne carte (gardée derrière « Voir le détail »).
  Array.prototype.forEach.call(document.querySelectorAll('.page-body section'), function (s) {
    var h1 = s.querySelector('h1'); if (h1 && /Mon Grimoire/.test(h1.textContent) && !s.closest('#c127g')) s.classList.add('c127g-old');
  });
  Promise.all([
    get(C.dreams).then(function (l) { return (Array.isArray(l) ? l : (l && l.dreams) || []).map(parseDream); }),
    get(C.memories).then(function (m) { return (m && m.kept) || []; }, function () { return []; })
  ]).then(function (r) { render(r[0], r[1]); }, function () {
    host.innerHTML = '<p class="c127g-empty">Je n’arrive pas à ouvrir ton Grimoire. Recharge la page ; si ça continue, reconnecte-toi.</p>';
  });
})();
