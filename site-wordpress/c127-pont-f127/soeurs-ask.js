/* Le Cercle 127 — demandes aux Sœurs (Alka, Terra) via Framework 127. */
(function () {
  var cfg = window.C127Ask || {};
  var NAMES = { oni: 'Oni', naia: 'Naïa', alka: 'Alka', ignis: 'Ignis', terra: 'Terra', astria: 'Astria', irma: 'Irma' };
  var KIND_SISTER = { 'oni-perle': 'Oni', 'alka-motifs': 'Alka', 'terra-ancrage': 'Terra', 'naia-apaisement': 'Naïa', 'ignis-petit-pas': 'Ignis', 'irma-decision': 'Irma', 'astria-aspiration': 'Astria' };
  // Le chemin : après chaque Sœur, une ou deux suites naturelles.
  var NEXT = {
    'alka-motifs': [['terra-ancrage', 'Revenir au corps avec Terra'], ['ignis-petit-pas', 'Transformer ce motif en un petit pas avec Ignis']],
    'naia-apaisement': [['terra-ancrage', 'S’ancrer avec Terra'], ['ignis-petit-pas', 'Un petit pas avec Ignis']],
    'terra-ancrage': [['naia-apaisement', 'Nommer ce qui reste avec Naïa'], ['ignis-petit-pas', 'Un petit pas avec Ignis']],
    'ignis-petit-pas': [['irma-decision', 'Si un choix bloque : Irma'], ['astria-aspiration', 'Voir plus loin avec Astria']],
    'irma-decision': [['ignis-petit-pas', 'Tester une option avec Ignis'], ['astria-aspiration', 'Relier ce choix à ce qui compte : Astria']],
    'astria-aspiration': [['ignis-petit-pas', 'Le premier pas avec Ignis'], ['irma-decision', 'Choisir entre deux chemins avec Irma']]
  };
  var HANDOFF = 'c127_handoff';
  function store(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function load(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } }

  // Ce que la personne a écrit (jamais la réponse de l'IA) sert de point de départ à la Sœur suivante.
  function carry(kind, body) {
    if (kind === 'alka-motifs') return 'Ces éléments reviennent dans mes rêves : ' + (body.motifs || []).join(', ') + '.';
    if (kind === 'naia-apaisement') return 'J’ai accueilli ' + ({ peur: 'ma peur', colere: 'ma colère', tristesse: 'ma tristesse', culpabilite: 'ma culpabilité', confusion: 'ma confusion', soulagement: 'mon soulagement' }[body.emotion] || 'une émotion forte') + ' (' + body.intensity + '/5) et je voudrais avancer.';
    if (kind === 'terra-ancrage') return 'Je me suis ancré·e, et je voudrais avancer.';
    if (kind === 'ignis-petit-pas') return body.insight || '';
    if (kind === 'irma-decision') return 'J’hésite : ' + (body.question || '') + ' (' + (body.options || []).join(' / ') + ')';
    if (kind === 'astria-aspiration') return 'Je veux faire grandir : ' + (body.grow || '');
    return '';
  }

  function nextSteps(out, kind, body) {
    var list = NEXT[kind] || [];
    var pages = cfg.pages || {};
    if (!list.length) return;
    var wrap = el('nav', 'c127ask__next');
    wrap.setAttribute('aria-label', 'Continuer le chemin');
    wrap.appendChild(el('p', 'c127ask__next-title', 'Et maintenant ?'));
    list.forEach(function (n) {
      if (!pages[n[0]]) return;
      var a = el('a', 'c127ask__next-link', n[1] + ' ›');
      a.href = pages[n[0]] + '#c127-ask-' + n[0];
      a.addEventListener('click', function () { store(HANDOFF, { to: n[0], from: kind, text: carry(kind, body), at: Date.now() }); });
      wrap.appendChild(a);
    });
    out.appendChild(wrap);
  }

  function receive(box, kind, form) {
    var h = load(HANDOFF);
    if (!h || h.to !== kind || Date.now() - h.at > 30 * 60 * 1000) return;
    store(HANDOFF, null);
    var note = el('p', 'c127ask__from', 'Ton chemin continue ici : tu étais avec ' + (KIND_SISTER[h.from] || 'une Sœur') + '.');
    form.parentNode.insertBefore(note, form);
    var target = form.querySelector('textarea[name=insight], textarea[name=grow], input[name=question], textarea[name=note]');
    if (target && h.text && !target.value) target.value = h.text;
    if (kind === 'terra-ancrage' && h.from === 'naia-apaisement') { var r = form.querySelector('input[name=context][value=emotion]'); if (r) r.checked = true; }
    if (kind === 'terra-ancrage' && h.from === 'alka-motifs') { var r2 = form.querySelector('input[name=context][value=dispersion]'); if (r2) r2.checked = true; }
    setTimeout(function () { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (target) target.focus({ preventScroll: true }); }, 300);
  }

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  function render(out, data, kind, body) {
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
    nextSteps(out, kind, body || {});
    // Une réponse reçue ouvre la porte de cette Sœur dans le Grimoire.
    try { if (window.C127Portes) window.C127Portes.mark(String(kind).split('-')[0]); } catch (e) {}
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

    receive(box, kind, form);

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
      } else if (kind === 'naia-apaisement') {
        body.emotion = f.get('emotion'); body.intensity = Number(f.get('intensity') || 3); body.body = f.get('body');
      } else if (kind === 'ignis-petit-pas') {
        body.insight = String(f.get('insight') || '').trim();
        if (body.insight.length < 8) { out.appendChild(el('p', 'c127ask__error', 'Écris en une phrase ce que tu as compris ou ce que tu veux transformer.')); return; }
        body.energy = f.get('energy'); body.horizon = f.get('horizon');
      } else if (kind === 'astria-aspiration') {
        body.grow = String(f.get('grow') || '').trim();
        if (body.grow.length < 8) { out.appendChild(el('p', 'c127ask__error', 'Écris en une phrase ce que tu veux faire grandir.')); return; }
        body.domain = f.get('domain'); body.why = f.get('why') || ''; body.horizon = f.get('horizon');
      } else if (kind === 'irma-decision') {
        body.question = String(f.get('question') || '').trim();
        body.options = f.getAll('option').map(function (s) { return String(s).trim(); }).filter(Boolean);
        if (body.question.length < 6 || body.options.length < 2) { out.appendChild(el('p', 'c127ask__error', 'Écris ta question et au moins deux options.')); return; }
        body.matters = f.get('matters') || ''; body.deadline = f.get('deadline');
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
          render(out, res.data, kind, body);
        })
        .catch(function () { out.innerHTML = ''; out.appendChild(el('p', 'c127ask__error', 'Pas de réponse pour le moment. Vérifie ta connexion et réessaie.')); })
        .then(function () { if (timer) clearTimeout(timer); btn.disabled = false; btn.textContent = label; });
    });
  }

  var SIS = { oni: 'Oni', naia: 'Naïa', alka: 'Alka', ignis: 'Ignis', terra: 'Terra', astria: 'Astria', irma: 'Irma' };
  function frDate(d) { try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d; } }
  function memoryPanel(sec) {
    var zone = sec.querySelector('.c127mem');
    if (window.ReactNativeWebView) { sec.hidden = true; sec.style.display = 'none'; return; }
    if (!cfg.loggedIn) { zone.innerHTML = ''; zone.appendChild(el('p', 'c127ask__login', 'Connecte-toi pour voir ce que le Cercle retient de toi.')); return; }
    function call(url, method, body) {
      return fetch(url, { method: method || 'GET', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': cfg.nonce }, body: body ? JSON.stringify(body) : undefined })
        .then(function (r) { return r.json().then(function (d) { if (r.status >= 400) throw new Error(d && d.message || 'Erreur'); return d; }); });
    }
    function item(m, pending) {
      var li = el('li', 'c127mem__item' + (pending ? ' is-pending' : ''));
      li.appendChild(el('p', 'c127mem__meta', (SIS[m.sister] || 'Le Cercle') + ' · ' + frDate(m.date) + (pending ? ' · en attente de ton accord' : ' · gardé')));
      li.appendChild(el('p', 'c127mem__text', m.text));
      var row = el('div', 'c127mem__actions');
      function btn(label, action, cls) {
        var b = el('button', 'c127mem__btn ' + (cls || ''), label); b.type = 'button';
        b.addEventListener('click', function () { b.disabled = true; call(cfg.memories + '/' + m.id, 'POST', { action: action }).then(refresh).catch(function (e) { b.disabled = false; alert(e.message); }); });
        row.appendChild(b);
      }
      if (pending) { btn('Garder', 'keep', 'is-primary'); btn('Ne pas garder', 'reject'); } else { btn('Oublier', 'forget'); }
      li.appendChild(row);
      return li;
    }
    function refresh() {
      call(cfg.memories).then(function (d) {
        zone.innerHTML = '';
        if (!d.pending.length && !d.kept.length) { zone.appendChild(el('p', 'c127ask__wait', 'Le Cercle ne retient rien de toi pour l’instant.')); return; }
        if (d.pending.length) { zone.appendChild(el('h3', 'c127mem__h', 'À valider (' + d.pending.length + ')')); var ul = el('ul', 'c127mem__list'); d.pending.forEach(function (m) { ul.appendChild(item(m, true)); }); zone.appendChild(ul); }
        if (d.kept.length) { zone.appendChild(el('h3', 'c127mem__h', 'Gardé (' + d.kept.length + ') — les Sœurs peuvent s’en souvenir')); var ul2 = el('ul', 'c127mem__list'); d.kept.forEach(function (m) { ul2.appendChild(item(m, false)); }); zone.appendChild(ul2); }
        var all = el('button', 'c127mem__btn c127mem__all', 'Tout oublier'); all.type = 'button';
        all.addEventListener('click', function () { if (!confirm('Effacer tous tes souvenirs du Cercle ? Cette action est définitive.')) return; call(cfg.memories + '/all', 'DELETE').then(refresh); });
        zone.appendChild(all);
      }).catch(function () { zone.innerHTML = ''; zone.appendChild(el('p', 'c127ask__error', 'Impossible de charger tes souvenirs pour le moment.')); });
    }
    refresh();
  }

  function init() { document.querySelectorAll('[data-c127-ask]').forEach(setup); document.querySelectorAll('[data-c127-memoire]').forEach(memoryPanel); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
