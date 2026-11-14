/* La lecture du jour de Terra, composée à partir du corpus (terra-corpus.js) et des traits de la main.
   Remplace les quatre cartes fixes de l'atelier : chaque trait observé ou mesuré apporte son passage,
   le thème du jour se choisit parmi les plus marqués de la main, et la date fait varier le texte. */
(function () {
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var x = seed || 1;
    return function () { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  }
  function pick(list, r) { return list && list.length ? list[Math.floor(r() * list.length)] : ''; }

  function elementOf(f) {
    var shape = f.palm_shape || '', fingers = f.finger_length || '';
    if (!shape) return '';
    var longFingers = /^longs/.test(fingers), shortFingers = /^courts/.test(fingers);
    if (/carrée|large/.test(shape)) return longFingers ? 'air' : 'terre';
    if (/étroite/.test(shape)) return shortFingers ? 'feu' : 'eau';
    return longFingers ? 'eau' : 'feu'; // rectangulaire
  }
  var ELEMENT_THEME = { terre: 'ancrage', air: 'clarte', feu: 'elan', eau: 'ecoute' };
  var LINES = ['heart', 'head', 'life', 'fate'];

  /** Compose la lecture du jour. f : champs de l'atelier ; day : AAAA-MM-JJ ; C : corpus. */
  function compose(f, day, C) {
    f = f || {};
    var sig = Object.keys(f).sort().map(function (k) { return k + '=' + f[k]; }).join('&');
    var r = rng(hash(day + '|' + sig));
    var score = {};
    var add = function (t, n) { if (t) score[t] = (score[t] || 0) + n; };

    LINES.forEach(function (k) {
      var len = f[k + '_length'], asp = f[k + '_aspect'], th = C.lines[k].theme;
      if (len) add(th, len === 'longue' ? 2 : 1);
      if (asp) add(th, asp === 'fine' ? 0.5 : 1.5);
    });
    var el = elementOf(f);
    if (el) add(ELEMENT_THEME[el], 1.5);
    var mount = f.mount && C.mounts[f.mount] ? f.mount : '';
    if (mount) add(C.mounts[mount].theme, f.mount_relief === 'très marqué' ? 3 : 2);
    if (f.thumb === 'long' || /ouvert/.test(f.thumb || '')) add('direction', 1);
    if (f.flexibility === 'plutôt souple') add('ecoute', 0.5);
    if (f.flexibility === 'plutôt ferme') add('ancrage', 0.5);

    // Le thème du jour : tiré parmi les trois plus marqués, au prorata de leur poids.
    var ranked = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; }).slice(0, 3);
    var theme = 'ecoute';
    if (ranked.length) {
      var total = ranked.reduce(function (n, t) { return n + score[t]; }, 0), x = r() * total;
      theme = ranked[ranked.length - 1];
      for (var i = 0; i < ranked.length; i++) { x -= score[ranked[i]]; if (x <= 0) { theme = ranked[i]; break; } }
    }
    var T = C.themes[theme];

    // Les passages : la forme de la main, le trait qui porte le thème, puis un second trait.
    var parts = [];
    if (el) parts.push(pick(C.element[el], r));
    var used = {};
    var lineFor = LINES.filter(function (k) { return C.lines[k].theme === theme && (f[k + '_length'] || f[k + '_aspect']); })[0];
    var lineText = function (k) {
      var L = C.lines[k], a = [];
      if (f[k + '_length'] && L.length[f[k + '_length']]) a.push(L.length[f[k + '_length']]);
      if (f[k + '_aspect'] && L.aspect[f[k + '_aspect']]) a.push(L.aspect[f[k + '_aspect']]);
      return a.join(' ');
    };
    var mountText = function () { return C.mounts[mount].t + (f.mount_relief && C.relief[f.mount_relief] ? ' ' + C.relief[f.mount_relief] : ''); };
    if (lineFor) { parts.push(lineText(lineFor)); used[lineFor] = 1; }
    else if (mount && C.mounts[mount].theme === theme) { parts.push(mountText()); used.mount = 1; }

    var extras = [];
    LINES.forEach(function (k) { if (!used[k] && f[k + '_length'] && C.lines[k].length[f[k + '_length']]) extras.push(C.lines[k].length[f[k + '_length']]); });
    if (mount && !used.mount) extras.push(mountText());
    if (f.thumb && C.thumb[f.thumb]) extras.push(C.thumb[f.thumb]);
    if (f.finger_length && C.fingers[f.finger_length]) extras.push(C.fingers[f.finger_length]);
    if (f.flexibility && C.flexibility[f.flexibility]) extras.push(C.flexibility[f.flexibility]);
    if (extras.length) parts.push(pick(extras, r));
    parts.push(pick(C.invitations[theme], r));

    var m = C.mudras[pick(T.mudras, r)] || C.mudras.dhyana;
    return {
      theme: theme,
      title: 'Ta main du jour · ' + T.label,
      word: parts.filter(Boolean).join(' '),
      mudra: m.name,
      mudraCopy: m.how + ' Ce geste est facultatif : arrête-le s’il crée le moindre inconfort.',
      mantra: pick(T.mantras, r),
      question: pick(T.questions, r)
    };
  }

  if (typeof module !== 'undefined' && module.exports) { module.exports = { compose: compose, elementOf: elementOf }; return; }

  /* ---------- Dans la page de Terra ---------- */
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function fields(root) {
    var f = {};
    Array.prototype.forEach.call(root.querySelectorAll('select[data-field]'), function (s) { if (s.value) f[s.getAttribute('data-field')] = s.value; });
    var mt = root.querySelector('[data-mount-title]');
    var m = mt && /Mont (?:de |d’|d')\s*(.+)$/.exec((mt.textContent || '').trim());
    if (m && window.C127TerraCorpus.mounts[m[1]]) f.mount = m[1];
    return f;
  }
  function setup(root) {
    var C = window.C127TerraCorpus;
    var word = root.querySelector('[data-terra-word]');
    if (!C || !word || root.__c127lecture) return;
    root.__c127lecture = true;
    var last = '';
    var write = function () {
      var current = (word.textContent || '').trim();
      if (!current || current === last) return;
      var L = compose(fields(root), today(), C);
      last = L.word;
      var set = function (sel, v) { var e = root.querySelector(sel); if (e) e.textContent = v; };
      set('[data-ritual-title]', L.title);
      set('[data-mudra-name]', L.mudra);
      set('[data-mudra-copy]', L.mudraCopy);
      set('[data-mantra]', '« ' + L.mantra + ' »');
      set('[data-question]', L.question);
      word.textContent = L.word;
      root.setAttribute('data-terra-theme', L.theme);
    };
    new MutationObserver(write).observe(word, { childList: true, characterData: true, subtree: true });
    write();
  }
  function boot() { Array.prototype.forEach.call(document.querySelectorAll('.terra127'), setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
