/* Le Cercle 127 — Lecture du jour d'Oni sur le Grimoire du site. */
(function () {
  'use strict';
  var C = window.C127OD || {};
  var host = document.getElementById('c127od');
  if (!host || host.getAttribute('data-ready')) return;
  host.setAttribute('data-ready', '1');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function post(url, body) {
    return fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': C.nonce || '' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j && j.message || String(r.status)); e.status = r.status; throw e; } return j; }); });
  }
  var EMOS = [['', 'Émotion au réveil (facultatif)'], ['joie', 'Joie'], ['serenite', 'Sérénité'], ['emerveillement', 'Émerveillement'], ['surprise', 'Surprise'], ['confusion', 'Confusion'], ['tristesse', 'Tristesse'], ['peur', 'Peur'], ['angoisse', 'Angoisse'], ['colere', 'Colère'], ['autre', 'Autre']];

  function form() {
    host.innerHTML =
      '<p class="c127od-k">Lecture du jour</p>' +
      '<h2 id="c127od-t">Qu’en dit Oni ?</h2>' +
      '<p class="c127od-lead">Une fois par jour, Oni vous répond tout de suite, en une trentaine de secondes : des hypothèses et des questions, sans vous dire quoi penser. Une personne du Cercle relit ensuite sa lecture.</p>' +
      '<form class="c127od-form" novalidate>' +
      '<label>Si votre rêve avait un nom…<input name="title" maxlength="140" placeholder="Un titre, même provisoire"></label>' +
      '<label>Que s’est-il passé ?<textarea name="story" rows="6" maxlength="20000" required placeholder="Je me souviens que…"></textarea></label>' +
      '<div class="c127od-row"><label>La nuit du rêve<input name="date" type="date" value="' + today() + '"></label>' +
      '<label>Au réveil<select name="emotion">' + EMOS.map(function (e) { return '<option value="' + e[0] + '">' + esc(e[1]) + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="c127od-ok"><input type="checkbox" name="consent"> <span>J’accepte que ce rêve soit transmis à Oni : il passe par Make, puis par OpenAI pour préparer la lecture (sans servir à entraîner les modèles par défaut). Ma lecture du jour s’affiche tout de suite et une personne du Cercle la relit ensuite. <a href="' + esc(C.privacy) + '#maj-2026-11-11">En savoir plus</a></span></label>' +
      '<button type="submit" class="c127od-go">Confier mon rêve à Oni</button>' +
      '<p class="c127od-msg" role="alert"></p>' +
      '</form>';
    var f = host.querySelector('form'), msg = host.querySelector('.c127od-msg'), go = host.querySelector('.c127od-go');
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var story = f.story.value.trim();
      if (story.length < 3) { msg.textContent = 'Racontez au moins quelques mots de votre rêve.'; f.story.focus(); return; }
      if (!f.consent.checked) { msg.textContent = 'Votre accord est nécessaire avant l’envoi à Oni.'; return; }
      msg.textContent = ''; go.disabled = true; go.textContent = 'Votre rêve rejoint le Grimoire…';
      var title = f.title.value.trim() || 'Rêve sans titre';
      post(C.dreams, { title: title, story: story, content: story, dream_date: f.date.value || today(), emotion: f.emotion.value, intensity: null })
        .then(function (d) {
          var id = d && (d.id || (d.dream && d.dream.id) || (d.data && d.data.id));
          if (!id) throw new Error('Le Grimoire n’a pas confirmé l’enregistrement.');
          waiting(title);
          return post(C.ticket, { dream_id: Number(id), consent: true })
            .then(function (t) {
              // Formulaire simple (pas de pré-vol CORS) ; Make répond en JSON avec l'origine du site autorisée.
              var body = new URLSearchParams({ dream_id: String(id), ticket: t.ticket, consent: 'true', source: 'site' });
              return fetch(t.hook, { method: 'POST', body: body }).then(function (r) { return r.json(); });
            })
            .then(function (r) { show(r, title); }, function () { show({ status: 'indisponible' }, title); });
        })
        .catch(function (e) {
          go.disabled = false; go.textContent = 'Confier mon rêve à Oni';
          msg.textContent = e && e.status === 401 || e && e.status === 403 ? 'Votre session a expiré : rechargez la page.' : 'Oni n’a pas pu recevoir votre rêve pour le moment. Réessayez dans un instant.';
        });
    });
  }

  function waiting(title) {
    host.innerHTML = '<p class="c127od-k">Lecture du jour</p><h2 id="c127od-t">' + esc(title) + '</h2>' +
      '<div class="c127od-wait" aria-live="polite"><span class="c127od-moon" aria-hidden="true"></span><p>Oni lit votre rêve… Cela prend une trentaine de secondes.</p></div>';
  }

  function again(label) { return '<button type="button" class="c127od-link" data-act="again">' + esc(label || 'Confier un autre rêve') + '</button>'; }

  function show(r, title) {
    var h = '<p class="c127od-k">Lecture du jour</p><h2 id="c127od-t">' + esc(title) + '</h2>';
    var st = r && r.status;
    if (st === 'lue' && r.reading) {
      h += String(r.reading).split(/\n+/).map(function (p) { return '<p class="c127od-read">' + esc(p) + '</p>'; }).join('');
      var qs = String(r.questions || '').split('\n').map(function (q) { return q.trim(); }).filter(Boolean);
      if (qs.length) h += '<h3>Ce que le rêve laisse ouvert</h3><ul class="c127od-qs">' + qs.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ul>';
      if (r.closing) h += '<p class="c127od-close">' + esc(r.closing) + '</p>';
      h += '<p class="c127od-small">Lecture immédiate, préparée avec l’aide d’une intelligence artificielle : une personne du Cercle la relit ensuite. Des pistes, pas des vérités : vous gardez la main sur le sens. Elle est rangée dans votre Grimoire.</p>' +
        '<p class="c127od-small"><a href="mailto:contact@lecercle127.com?subject=' + encodeURIComponent('Signaler une lecture d’Oni') + '&body=' + encodeURIComponent('Rêve : « ' + title + ' »\n\nCe qui ne va pas dans cette lecture :\n') + '">Signaler cette lecture ou demander une relecture</a></p>' +
        '<p class="c127od-small">Pour aller plus loin : <a href="' + esc(C.perle) + '">La Perle d’Oni, lecture approfondie</a>.</p>' + again();
    } else if (st === 'accompagnement' && r.reading) {
      h += String(r.reading).split(/\n+/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
        '<a class="c127od-go" href="tel:3114">Appeler le 3114</a>' +
        '<p class="c127od-small">Le 3114 est le numéro national de prévention du suicide : gratuit, 24 h/24. En cas de danger immédiat, appelez le 112. Une personne du Cercle lira aussi votre rêve.</p>';
    } else if (st === 'quota') {
      h += '<p>Votre rêve est gardé dans votre Grimoire. Votre lecture immédiate du jour est déjà utilisée : une nouvelle vous attend demain.</p>' +
        '<p class="c127od-small">D’ici là, vous pouvez demander une lecture relue (sous 48 heures) depuis <a href="' + esc(C.app) + '">l’application</a>, ou une <a href="' + esc(C.perle) + '">lecture approfondie, La Perle d’Oni</a>.</p>' + again();
    } else if (st === 'deja_demandee') {
      h += '<p>Une lecture est déjà en préparation pour ce rêve.</p>' + again();
    } else {
      h += '<p>Votre rêve est gardé dans votre Grimoire, mais Oni n’a pas pu le lire pour le moment. Réessayez plus tard depuis l’application, ou demain ici.</p>' + again();
    }
    host.innerHTML = h;
    var b = host.querySelector('[data-act="again"]');
    if (b) b.addEventListener('click', form);
    host.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form();
})();
