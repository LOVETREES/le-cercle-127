/* Le Cercle 127 — accueil recentré sur le rêve, rituel du jour, et prolongement après la Perle d'Oni. */
(function () {
  'use strict';
  var cfg = window.C127Accueil || {};
  var L = cfg.links || {};
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

  function home() {
    var wrap = document.querySelector('.m1 > .wrap');
    if (!wrap) return;

    // 1. Le bouton principal : raconter son rêve, avec le prix lu sur la page.
    var cta = wrap.querySelector('.m1-cta');
    var priceEl = document.querySelector('.m1-detail');
    var price = priceEl && /(\d+[,.]\d{2})\s*€/.exec(priceEl.textContent || '');
    if (cta) {
      cta.classList.add('c127a-main');
      cta.innerHTML = '<span>Raconter mon rêve' + (price ? ' — ' + price[1] + ' €' : '') + '</span>' +
        '<small>La Perle d’Oni : une lecture détaillée, reçue par e-mail</small>';
      cta.setAttribute('href', L.reve || cta.getAttribute('href'));
    }
    // 2. Le second : le Grimoire.
    if (!wrap.querySelector('.c127a-cta2')) {
      var g = el('a', 'c127a-cta2 wp-exclude-emoji', '<span aria-hidden="true">📖</span> Ouvrir mon Grimoire');
      g.href = L.grimoire || '/grimoire/';
      wrap.appendChild(g);
    }

    // 3. Le rituel du jour.
    var st = ritualState();
    var R = st.R;
    var streakTxt = (R.streak > 1 && (R.lastDay === day(0) || R.lastDay === day(1))) ? '🔥 ' + R.streak + ' jours' : '';
    var band = el('section', 'c127a-rituel wp-exclude-emoji');
    band.setAttribute('aria-labelledby', 'c127a-rituel-h');
    band.innerHTML =
      '<div class="c127a-rituel__head"><h2 id="c127a-rituel-h">Ton rituel du jour</h2><span class="c127a-rituel__meta">' + st.count + ' / 3' + (streakTxt ? ' · ' + streakTxt : '') + '</span></div>' +
      '<div class="c127a-gestes">' +
      geste('carte', '🃏', 'Ta carte', 'Un éclairage pour aujourd’hui', L.oracle) +
      geste('emotion', '💧', 'Ton émotion', 'L’accueillir avec Naïa', L.naia) +
      geste('main', '✋', 'Ta main', 'Revenir au corps avec Terra', L.terra) +
      '</div><div class="c127a-bar" aria-hidden="true"><i></i></div>' +
      '<p class="c127a-rituel__foot">' + footer(st.count) + '</p>';
    function geste(key, ic, t, s, href) {
      return '<a class="c127a-geste' + (st.done[key] ? ' is-done' : '') + '" data-geste="' + key + '" href="' + (href || '#') + '">' +
        '<span class="c127a-geste__ic" aria-hidden="true">' + ic + '</span><b>' + t + '</b><span class="c127a-geste__s">' + s + '</span>' +
        (st.done[key] ? '<span class="screen-reader-text"> (fait aujourd’hui)</span>' : '') + '</a>';
    }
    function footer(n) {
      if (n === 3) return 'Ton rituel est accompli. Reviens demain : le Cercle garde le fil.';
      if (n === 0) return 'Trois gestes de quelques minutes. Commence par celui qui t’appelle.';
      return 'Encore ' + (3 - n) + ' geste' + (3 - n > 1 ? 's' : '') + ' pour accomplir ton rituel.';
    }
    wrap.appendChild(band);
    requestAnimationFrame(function () { band.querySelector('.c127a-bar i').style.width = (st.count / 3 * 100) + '%'; });
    band.addEventListener('click', function (e) {
      var a = e.target.closest('[data-geste]');
      if (a) markVisited(a.getAttribute('data-geste'));
    });

    // 4. La grande grille passe plus bas, repliée.
    var circle = wrap.querySelector('.m1-circle');
    if (circle && !wrap.querySelector('.c127a-unfold')) {
      var n = circle.querySelectorAll('a').length;
      circle.classList.add('c127a-folded');
      circle.id = circle.id || 'c127a-explorer';
      var btn = el('button', 'c127a-unfold', 'Explorer tout le Cercle' + (n ? ' (' + n + ')' : '') + ' <span aria-hidden="true">▾</span>');
      btn.type = 'button';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', circle.id);
      btn.addEventListener('click', function () {
        var open = circle.classList.toggle('c127a-folded') === false;
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.innerHTML = open ? 'Replier <span aria-hidden="true">▴</span>' : 'Explorer tout le Cercle' + (n ? ' (' + n + ')' : '') + ' <span aria-hidden="true">▾</span>';
      });
      circle.parentNode.insertBefore(btn, circle.nextSibling);
    }
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
      '<a class="c127a-suite__item" data-geste="main" href="' + (L.terraAncrage || L.terra) + '"><span class="c127a-geste__ic" aria-hidden="true">🌿</span><span><b>Revenir au corps avec Terra</b><small>Un ancrage guidé d’une à cinq minutes, juste après le rêve.</small></span></a>' +
      '<a class="c127a-suite__item" data-geste="main" href="' + L.terra + '"><span class="c127a-geste__ic" aria-hidden="true">✋</span><span><b>Lire ta main avec Terra</b><small>Le rêve parle la nuit, la main parle le jour : complète ta carte.</small></span></a>' +
      '<a class="c127a-suite__item" data-geste="emotion" href="' + L.naia + '"><span class="c127a-geste__ic" aria-hidden="true">💧</span><span><b>Nommer ce que le rêve a laissé</b><small>Naïa t’aide à accueillir l’émotion du réveil.</small></span></a>' +
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
