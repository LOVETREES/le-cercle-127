/* Le Cercle 127 — demandes aux Sœurs (Alka, Terra) via Framework 127. */
(function () {
  var cfg = window.C127Ask || {};
  var NAMES = { oni: 'Oni', naia: 'Naïa', alka: 'Alka', ignis: 'Ignis', terra: 'Terra', astria: 'Astria', irma: 'Irma' };

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  function render(out, data) {
    out.innerHTML = '';
    var card = el('article', 'c127ask__answer');
    var who = NAMES[data.sister] || 'Une Sœur';
    card.appendChild(el('p', 'c127ask__who', who + ' te répond'));
    String(data.answer || '').split(/\n{2,}/).forEach(function (para) {
      if (para.trim()) card.appendChild(el('p', 'c127ask__text', para.trim()));
    });
    if (data.suggestions && data.suggestions.length) {
      var ul = el('ul', 'c127ask__steps');
      data.suggestions.forEach(function (s) { ul.appendChild(el('li', '', s)); });
      card.appendChild(ul);
    }
    out.appendChild(card);
    out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setup(box) {
    if (window.ReactNativeWebView) { box.hidden = true; box.style.display = 'none'; return; }
    var kind = box.getAttribute('data-c127-ask');
    var form = box.querySelector('form');
    var out = box.querySelector('.c127ask__out');
    var btn = form.querySelector('.c127ask__send');
    var range = form.querySelector('input[type=range]');
    var rangeOut = form.querySelector('[data-intensity-out]');
    if (range && rangeOut) range.addEventListener('input', function () { rangeOut.textContent = range.value; });

    if (!cfg.loggedIn) {
      form.hidden = true;
      var p = el('p', 'c127ask__login');
      p.appendChild(document.createTextNode('Connecte-toi pour que les Sœurs te répondent. '));
      var a = el('a', '', 'Me connecter ›'); a.href = cfg.login; p.appendChild(a);
      out.appendChild(p);
      return;
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = new FormData(form);
      out.innerHTML = '';
      if (!f.get('consent')) { out.appendChild(el('p', 'c127ask__error', 'Coche la case d’accord pour qu’une Sœur te réponde.')); return; }
      var body = { kind: kind, consent: true, remember: !!f.get('remember'), lang: (document.documentElement.lang || 'fr').slice(0, 2) };
      if (kind === 'alka-motifs') {
        body.motifs = String(f.get('motifs') || '').split(/[,;\n]/).map(function (s) { return s.trim(); }).filter(Boolean);
        if (!body.motifs.length) { out.appendChild(el('p', 'c127ask__error', 'Indique au moins un élément qui revient.')); return; }
        body.frequency = f.get('frequency'); body.excerpt = f.get('excerpt') || '';
      } else {
        body.context = f.get('context'); body.intensity = Number(f.get('intensity') || 3); body.minutes = Number(f.get('minutes') || 3);
      }
      btn.disabled = true;
      var label = btn.textContent; btn.textContent = 'La Conscience choisit la Sœur…';
      out.appendChild(el('p', 'c127ask__wait', 'Un instant : la Sœur la plus juste prépare sa réponse (jusqu’à une minute).'));
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 95000) : null;
      fetch(cfg.rest, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': cfg.nonce }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { return r.json().then(function (d) { return { status: r.status, data: d }; }); })
        .then(function (res) {
          out.innerHTML = '';
          if (res.status >= 400) { out.appendChild(el('p', 'c127ask__error', (res.data && res.data.message) || 'Une erreur est survenue.')); return; }
          if (!res.data.answer) { out.appendChild(el('p', 'c127ask__error', 'La Sœur n’a pas pu répondre cette fois. Réessaie dans un moment.')); return; }
          render(out, res.data);
        })
        .catch(function () { out.innerHTML = ''; out.appendChild(el('p', 'c127ask__error', 'Pas de réponse pour le moment. Vérifie ta connexion et réessaie.')); })
        .then(function () { if (timer) clearTimeout(timer); btn.disabled = false; btn.textContent = label; });
    });
  }

  function init() { document.querySelectorAll('[data-c127-ask]').forEach(setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
