/* Le Cercle 127 — accueil recentré sur le rêve, rituel du jour, et prolongement après la Perle d'Oni. */
(function () {
  'use strict';
  var cfg = window.C127Accueil || {};
  var L = cfg.links || {};
  var IMG = cfg.img || {};
  function pic(src, round, fallback) { return src ? '<img class="c127a-pic' + (round ? ' is-round' : '') + '" src="' + src + '" alt="" width="44" height="44" loading="lazy" decoding="async">' : '<span class="c127a-geste__ic" aria-hidden="true">' + fallback + '</span>'; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function read(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function day(off) { var d = new Date(Date.now() - (off || 0) * 864e5); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /* ---------- Rituel du jour : état partagé avec l'Oracle vivant et Terra ---------- */
  function ritualState() {
    var R = read('c127_rituel'), today = day(0);
    var ov = read('c127ov'), tj = read('c127_terra_jeu');
    var done = {
      carte: ov.last === today || R.carte === today,
      emotion: R.emotion === today,
      main: tj.last === today || R.main === today
    };
    return { R: R, done: done, count: (done.carte ? 1 : 0) + (done.emotion ? 1 : 0) + (done.main ? 1 : 0) };
  }
  function markVisited(key) {
    var R = read('c127_rituel'), today = day(0);
    R[key] = today;
    if (R.lastDay !== today) { R.streak = R.lastDay === day(1) ? (R.streak || 1) + 1 : 1; R.lastDay = today; }
    write('c127_rituel', R);
  }

  /* ---------- Accueil : le même que l'application (salutation, rêve, Mon chemin, rituel) ---------- */
  var THOUGHTS = ["Tu n’as pas à mériter la douceur : offre-t’en un peu aujourd’hui.", "Ce que tu ressens a le droit d’exister. Accueille-le, puis respire.", "Aimer, c’est aussi s’écouter quand personne ne le fait.", "Chaque matin est une page blanche. Écris-y une intention tendre.", "Ta valeur ne se mesure pas à ce que tu accomplis aujourd’hui.", "Un pas lent reste un pas. Avance à ton rythme.", "Sois pour toi l’ami·e que tu es pour les autres.", "Le calme ne vient pas d’ailleurs : il naît d’un souffle, ici, maintenant.", "Tes rêves te parlent avec douceur. Écoute-les sans te juger.", "Il y a de la beauté dans ce que tu traverses, même si tu ne la vois pas encore.", "Laisse aujourd’hui un peu de place à ce qui te fait du bien.", "Tu as déjà survécu à tous tes jours difficiles. Tu es plus fort·e que tu ne le crois.", "L’amour commence par un regard bienveillant posé sur soi.", "Ralentis : ce qui est important ne s’envolera pas.", "Une gratitude par jour suffit à éclairer une vie entière.", "Tu peux être en chemin et déjà entier·ère.", "Pardonne-toi d’avoir appris lentement : tu as appris.", "Ce que tu arroses grandit. Choisis ce que tu nourris aujourd’hui.", "Ton corps te porte depuis toujours. Remercie-le d’un geste doux.", "L’amour que tu donnes revient souvent par des chemins inattendus.", "Respire profondément : tu es exactement là où tu dois être.", "Tes émotions sont des messagères, pas des ennemies.", "Ose dire non à ce qui t’éteint, et oui à ce qui t’éclaire.", "La nuit prépare toujours le jour. Aie confiance en ton rythme.", "Un sourire offert à soi-même est déjà un soin.", "Ce qui se répète dans tes rêves t’invite à grandir, pas à t’inquiéter.", "Tu mérites un amour qui te laisse respirer, à commencer par le tien.", "Prends soin de toi comme on prend soin d’un jardin : patiemment.", "La lumière que tu cherches est déjà en toi.", "Aujourd’hui, choisis la douceur, envers toi et envers les autres.", "Chaque rêve noté est un pas de plus vers toi-même."];
  function thought(d) {
    var start = Date.UTC(d.getFullYear(), 0, 0);
    var n = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 864e5);
    return THOUGHTS[(n + d.getFullYear()) % THOUGHTS.length];
  }
  function greeting(d) { var h = d.getHours(); return h >= 22 || h < 5 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 17 ? 'Bon après-midi' : 'Bonsoir'; }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // Les Sept Sœurs, dans l'ordre du chemin d'individuation (mêmes textes et seuils que l'application).
  var LEVELS = ['À éveiller', 'Graine', 'Pousse', 'Arbre'];
  var SISTERS = [
    { k: 'oni', n: 'Oni', v: 'Lire', c: '#d9cdfb', th: [1, 5, 15], next: 'Note ton prochain rêve dès le réveil, avant qu’il ne s’efface.' },
    { k: 'alka', n: 'Alka', v: 'Relier', c: '#a9c2f7', th: [1, 3, 6], next: 'Ouvre ton Grimoire et regarde le symbole qui revient le plus.' },
    { k: 'naia', n: 'Naïa', v: 'Apaiser', c: '#8fdad3', th: [1, 7, 21], next: 'Nomme l’émotion avec laquelle tu t’es réveillé·e ce matin.' },
    { k: 'terra', n: 'Terra', v: 'Enraciner', c: '#a9c98a', th: [1, 4, 10], next: 'Pose ta main et écoute ce que Terra en lit aujourd’hui.' },
    { k: 'ignis', n: 'Ignis', v: 'Agir', c: '#eb9a68', th: [1, 4, 10], next: 'Choisis un geste de cinq minutes inspiré de ton dernier rêve.' },
    { k: 'astria', n: 'Astria', v: 'Orienter', c: '#f2dea8', th: [1, 3, 8], next: 'Fais ton bilan de la semaine dans le Grand Labyrinthe : deux minutes.' },
    { k: 'irma', n: 'Irma', v: 'Choisir', c: '#f3f1fb', th: [1, 5, 15], next: 'Tire une carte sur la décision qui t’occupe en ce moment.' }
  ];
  function level(n, th) { return n >= th[2] ? 3 : n >= th[1] ? 2 : n >= th[0] ? 1 : 0; }
  function ring(s, lvl, size) {
    var r = (size - 4) / 2, c = 2 * Math.PI * r, share = lvl / 3;
    return '<span class="c127h-ring" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg width="' + size + '" height="' + size + '" aria-hidden="true"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="rgba(169,164,184,.25)" stroke-width="4" fill="none"/>' +
      (share ? '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="' + s.c + '" stroke-width="4" fill="none" stroke-linecap="round" stroke-dasharray="' + (c * share).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' : '') +
      '</svg><img src="' + esc((IMG.sisters || {})[s.k]) + '" alt="" width="' + (size - 12) + '" height="' + (size - 12) + '" loading="lazy" decoding="async"' + (lvl || !cfg.loggedIn ? '' : ' class="is-asleep"') + '></span>';
  }
  function cheminHtml(counts) {
    var logged = !!cfg.loggedIn;
    var lv = SISTERS.map(function (s) { return logged ? level(counts[s.k] || 0, s.th) : 0; });
    var awake = lv.filter(Boolean).length;
    var min = Math.min.apply(null, lv), next = SISTERS[lv.indexOf(min)];
    var cells = SISTERS.map(function (s, i) {
      return '<a class="c127h-sis" href="' + esc((L.sisters || {})[s.k] || '#') + '" aria-label="' + esc(s.n + ', ' + s.v + (logged ? ' : ' + LEVELS[lv[i]] : '')) + '">' +
        ring(s, lv[i], 62) + '<b style="color:' + s.c + '">' + s.n + '</b><small>' + s.v + '</small>' +
        (logged ? '<em class="' + (lv[i] ? 'is-on' : '') + '">' + LEVELS[lv[i]] + '</em>' : '') + '</a>';
    }).join('');
    return '<section class="c127h-card" aria-labelledby="c127h-chemin">' +
      '<div class="c127h-head"><h2 id="c127h-chemin">Mon chemin</h2>' + (logged ? '<span>' + awake + ' / 7 éveillées</span>' : '') + '</div>' +
      '<p class="c127h-intro">Devenir pleinement toi-même : c’est ce que Jung appelait l’individuation. Chaque Sœur veille sur une part de ce chemin et grandit avec tes gestes.</p>' +
      '<div class="c127h-grid">' + cells + '</div>' +
      (logged
        ? '<a class="c127h-next" href="' + esc((L.sisters || {})[next.k] || '#') + '">' + ring(next, min, 46) + '<span><small style="color:' + next.c + '">TON PROCHAIN PAS</small>' + esc(next.n + ' : ' + next.next) + '</span><i aria-hidden="true">›</i></a>' +
          '<p class="c127h-note">Indices complets (émotions, main, gestes, tirages) dans l’application : ils restent sur ton téléphone.</p>'
        : '<a class="c127h-start" href="' + esc(L.grimoire) + '">Commencer mon chemin</a>') +
      '</section>';
  }

  function home() {
    var host = document.getElementById('contenu-principal') || document.querySelector('.site-content');
    if (!host || document.querySelector('.c127h')) return;
    var now = new Date();
    var first = String(cfg.name || '').split(/\s+/)[0];
    var box = el('div', 'c127h wp-exclude-emoji');
    box.innerHTML =
      '<div class="c127h-wrap">' +
      '<div class="c127h-hello"><span class="c127h-date">' + esc(now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()) + '</span>' +
      '<h1>' + greeting(now) + (first ? ', ' + esc(first) : '') + '</h1>' +
      '<p class="c127h-sub">' + (cfg.loggedIn ? 'Ton chemin t’attend : chaque rêve noté le fait avancer.' : 'Comprendre tes rêves, voir ce qui revient, avancer.') + '</p></div>' +
      '<div class="c127h-ctas"><a class="c127h-main" href="' + esc(L.raconter || L.grimoire) + '">Raconter un rêve <span aria-hidden="true">›</span></a>' +
      '<a class="c127h-sec" href="' + esc(L.grimoire) + '">' + (IMG.grimoire ? '<img src="' + esc(IMG.grimoire) + '" alt="" width="28" height="28">' : '') + 'Ouvrir mon Grimoire</a></div>' +
      '<div class="c127h-chemin">' + cheminHtml({}) + '</div>' +
      '<div class="c127h-rituel"></div>' +
      '<section class="c127h-thought" aria-label="Pensée du jour"><small>✦ PENSÉE DU JOUR</small><p>«\u00a0' + esc(thought(now)) + '\u00a0»</p></section>' +
      '<div class="c127h-tiles">' +
      '<a href="' + esc(L.grimoire) + '"><b>Mon Grimoire</b><small>Mes rêves gardés et reliés</small></a>' +
      '<a href="' + esc(L.oracle) + '"><b>Oracle 127</b><small>Une carte, un éclairage</small></a>' +
      '<a href="' + esc(L.symboles) + '"><b>Symboles</b><small>Le dictionnaire des rêves</small></a></div>' +
      '<button type="button" class="c127h-more" aria-expanded="false" aria-controls="c127h-decouvrir">Découvrir le Cercle <span aria-hidden="true">▾</span></button>' +
      '</div>';
    host.insertBefore(box, host.firstChild);

    // Le rituel du jour (carte, émotion, main), comme dans l'application.
    box.querySelector('.c127h-rituel').appendChild(ritualBand());

    // La présentation du site, rangée sous « Découvrir le Cercle ».
    var more = el('div', 'c127h-hidden');
    more.id = 'c127h-decouvrir';
    while (box.nextSibling) more.appendChild(box.nextSibling);
    host.appendChild(more);
    var btn = box.querySelector('.c127h-more');
    btn.addEventListener('click', function () {
      var open = more.classList.toggle('c127h-hidden') === false;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.innerHTML = open ? 'Replier <span aria-hidden="true">▴</span>' : 'Découvrir le Cercle <span aria-hidden="true">▾</span>';
      if (open) more.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Connecté·e : indices tirés du Grimoire (rêves, motifs) et des bilans du Labyrinthe ; le reste vit dans l'appli.
    if (cfg.loggedIn && cfg.api) {
      var get = function (u) { return fetch(u, { credentials: 'same-origin', headers: { 'X-WP-Nonce': cfg.nonce || '' } }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); };
      Promise.all([get(cfg.api.dreams), cfg.api.bilans ? get(cfg.api.bilans) : null]).then(function (res) {
        var dreams = Array.isArray(res[0]) ? res[0] : (res[0] && res[0].dreams) || [];
        var freq = {};
        dreams.forEach(function (d) {
          var sy = Array.isArray(d.symbols) ? d.symbols : String(d.symbols || '').split(',');
          sy.map(function (x) { return String(x).trim().toLowerCase(); }).filter(Boolean).forEach(function (x) { freq[x] = (freq[x] || 0) + 1; });
        });
        var motifs = Object.keys(freq).filter(function (k) { return freq[k] >= 2; }).length;
        var R = read('c127_rituel'), ov = read('c127ov');
        var counts = {
          oni: dreams.length,
          alka: motifs,
          naia: R.emotion ? 1 : 0,
          terra: R.main ? 1 : 0,
          ignis: 0,
          astria: res[1] && Array.isArray(res[1].bilans) ? res[1].bilans.length : 0,
          irma: ov.last || R.carte ? 1 : 0
        };
        box.querySelector('.c127h-chemin').innerHTML = cheminHtml(counts);
      });
    }
  }

  function ritualBand() {
    var st = ritualState();
    var R = st.R;
    var streakTxt = (R.streak > 1 && (R.lastDay === day(0) || R.lastDay === day(1))) ? '🔥 ' + R.streak + ' jours' : '';
    var band = el('section', 'c127a-rituel wp-exclude-emoji');
    band.setAttribute('aria-labelledby', 'c127a-rituel-h');
    band.innerHTML =
      '<div class="c127a-rituel__head"><h2 id="c127a-rituel-h">Ton rituel du jour</h2><span class="c127a-rituel__meta">' + st.count + ' / 3' + (streakTxt ? ' · ' + streakTxt : '') + '</span></div>' +
      '<div class="c127a-gestes">' +
      geste('carte', pic(IMG.carte, false, '🌙'), 'Ta carte', 'Un éclairage pour aujourd’hui', L.oracle) +
      geste('emotion', pic(IMG.naia, true, '💧'), 'Ton émotion', 'L’accueillir avec Naïa', L.naia) +
      geste('main', pic(IMG.terra, true, '✋'), 'Ta main', 'Revenir au corps avec Terra', L.terra) +
      '</div><div class="c127a-bar" aria-hidden="true"><i></i></div>' +
      '<p class="c127a-rituel__foot">' + footer(st.count) + '</p>';
    function geste(key, ic, t, s, href) {
      return '<a class="c127a-geste' + (st.done[key] ? ' is-done' : '') + '" data-geste="' + key + '" href="' + (href || '#') + '">' +
        ic + '<b>' + t + '</b><span class="c127a-geste__s">' + s + '</span>' +
        (st.done[key] ? '<span class="screen-reader-text"> (fait aujourd’hui)</span>' : '') + '</a>';
    }
    function footer(n) {
      if (n === 3) return 'Ton rituel est accompli. Reviens demain : le Cercle garde le fil.';
      if (n === 0) return 'Trois gestes de quelques minutes. Chacun fait grandir la Sœur qui l’accompagne.';
      return 'Encore ' + (3 - n) + ' geste' + (3 - n > 1 ? 's' : '') + ' pour accomplir ton rituel.';
    }
    requestAnimationFrame(function () { var i = band.querySelector('.c127a-bar i'); if (i) i.style.width = (st.count / 3 * 100) + '%'; });
    band.addEventListener('click', function (e) {
      var a = e.target.closest('[data-geste]');
      if (a) markVisited(a.getAttribute('data-geste'));
    });
    return band;
  }

  /* ---------- Après le paiement d'une Perle d'Oni ---------- */
  function confirm() {
    var main = document.querySelector('main') || document.querySelector('.site-content') || document.body;
    var txt = (main.textContent || '');
    if (/Impossible de localiser/i.test(txt)) return; // page ouverte sans paiement : rien à prolonger
    if (document.querySelector('.c127a-suite')) return;
    var box = el('section', 'c127a-suite wp-exclude-emoji');
    box.setAttribute('aria-labelledby', 'c127a-suite-h');
    box.innerHTML =
      '<h2 id="c127a-suite-h">Pendant qu’Oni lit ton rêve…</h2>' +
      '<p>Ta Perle d’Oni arrive par e-mail. En attendant, prolonge ce que le rêve a laissé en toi.</p>' +
      '<div class="c127a-suite__list">' +
      '<a class="c127a-suite__item" data-geste="main" href="' + (L.terraAncrage || L.terra) + '">' + pic(IMG.terra, true, '🌿') + '<span><b>Revenir au corps avec Terra</b><small>Un ancrage guidé d’une à cinq minutes, juste après le rêve.</small></span></a>' +
      '<a class="c127a-suite__item" data-geste="main" href="' + L.terra + '">' + pic(IMG.terra, true, '✋') + '<span><b>Lire ta main avec Terra</b><small>Le rêve parle la nuit, la main parle le jour : complète ta carte.</small></span></a>' +
      '<a class="c127a-suite__item" data-geste="emotion" href="' + L.naia + '">' + pic(IMG.naia, true, '💧') + '<span><b>Nommer ce que le rêve a laissé</b><small>Naïa t’aide à accueillir l’émotion du réveil.</small></span></a>' +
      '</div>';
    box.addEventListener('click', function (e) {
      var a = e.target.closest('[data-geste]');
      if (!a) return;
      markVisited(a.getAttribute('data-geste'));
      try { sessionStorage.setItem('c127_handoff', JSON.stringify({ to: /ancrage/.test(a.href) ? 'terra-ancrage' : (/naia/.test(a.href) ? 'naia-apaisement' : ''), from: 'oni-perle', text: 'Je viens de confier un rêve à Oni.', at: Date.now() })); } catch (err) {}
    });
    var anchor = main.querySelector('.entry-content, article, .page-body') || main;
    anchor.appendChild(box);
  }

  function boot() { if (cfg.mode === 'home') home(); else if (cfg.mode === 'confirm') confirm(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
