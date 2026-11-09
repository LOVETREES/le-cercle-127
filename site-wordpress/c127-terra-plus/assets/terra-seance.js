/* Cercle 127 — Terra : la séance de lecture de la main.
   Une photo, Terra lit, puis une vraie lecture de chiromancie.
   S'appuie sur les mesures de terra-scan.js (événement « c127:palm ») et pilote le moteur de l'atelier
   (champs [data-field], navigation [data-step-nav]) sans le modifier. */
(function () {
  'use strict';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function pick(v, a, b) { return v < a ? 0 : v > b ? 2 : 1; }

  /* ---------- 1. Des mesures aux traits (seuils étalonnés sur des photos de mains réelles) ---------- */
  function traits(F) {
    var t = {}, H = F.lines.heart, T = F.lines.head, V = F.lines.life;
    t.shape = F.ratio < 1.42 ? 'carree' : F.ratio > 1.6 ? 'longue' : 'rect';
    t.fingers = ['courts', 'prop', 'longs'][pick(F.fingers, 0.82, 0.95)];
    t.element = (F.ratio < 1.42 ? 'C' : 'L') + (F.fingers >= 0.9 ? 'l' : 'c');
    t.element = { Cc: 'terre', Cl: 'air', Lc: 'feu', Ll: 'eau' }[t.element];
    t.thumb = ['court', 'moyen', 'long'][pick(F.thumbLen, 0.88, 0.98)];
    t.thumbOpen = ['serre', 'ouvert', 'tres'][pick(F.thumbOpen, 20, 36)];
    t.indexRing = F.indexRing > 0.012 ? 'index' : F.indexRing < -0.03 ? 'annulaire' : 'egal';
    t.pinky = ['court', 'moyen', 'long'][pick(F.pinky, -0.18, -0.07)];
    var depth = function (L) { return ['fine', 'moyenne', 'profonde'][pick(L.thick, 0.052, 0.064)]; };
    if (H) t.heart = {
      len: ['courte', 'moyenne', 'longue'][pick(H.length, 0.8, 1.0)],
      end: H.endK >= 0.22 ? 'jupiter' : H.endK >= 0.08 ? 'entre' : 'saturne',
      form: ['droite', 'souple', 'courbe'][pick(H.curve, 0.055, 0.075)],
      depth: depth(H), broken: H.gap > 0.08
    };
    if (T) t.head = {
      len: ['courte', 'moyenne', 'longue'][pick(T.length, 0.9, 1.1)],
      slope: ['droite', 'inclinee', 'descendante'][pick(T.slope, 30, 40)],
      depth: depth(T), broken: T.gap > 0.08
    };
    if (V) t.life = {
      arc: V.inner < 0.02 ? 'large' : V.inner > 0.1 ? 'serre' : 'moyen',
      len: V.low < 0.15 ? 'longue' : V.low > 0.28 ? 'courte' : 'moyenne',
      depth: depth(V), broken: V.gap > 0.08
    };
    if (T && V && F.joint != null) t.joint = F.joint < 0.03 ? 'liees' : F.joint > 0.065 ? 'separees' : 'proches';
    return t;
  }

  /* ---------- 2. Le texte : la voix d'une chiromancienne ---------- */
  var ELEMENT = {
    terre: { name: 'main de Terre', icon: '△', key: 'concrète et fiable',
      text: 'Paume carrée, doigts plutôt courts : c’est une <b>main de Terre</b>. On y lit une personne concrète, fiable, qui a besoin de toucher, de faire, de construire. Tu crois ce que tu vois pousser, et les grandes théories te laissent souvent froide ou froid. Ta force, c’est la constance. Ton piège : continuer à porter ce qui ne te nourrit plus, par simple fidélité.',
      force: 'ta constance', defi: 'lâcher ce qui pèse sans le trahir' },
    air: { name: 'main d’Air', icon: '◇', key: 'curieuse et vive',
      text: 'Paume carrée, doigts longs : c’est une <b>main d’Air</b>. L’esprit est vif, curieux, communicant. Tu as besoin de comprendre, d’échanger, de mettre des mots sur ce que tu vis. Les idées te portent. Ton piège : vivre dans ta tête et oublier ton corps, ou analyser une émotion au lieu de la ressentir.',
      force: 'ta clarté', defi: 'redescendre de la tête vers le corps' },
    feu: { name: 'main de Feu', icon: '▲', key: 'élan et intuition',
      text: 'Paume allongée, doigts plus courts qu’elle : c’est une <b>main de Feu</b>. Il y a de l’élan, de l’enthousiasme, une intuition rapide et l’envie d’agir. Tu démarres vite, tu entraînes les autres, tu as besoin que ça bouge. Ton piège : l’impatience, et cette façon de brûler ton énergie avant d’avoir rechargé.',
      force: 'ton élan', defi: 'ralentir assez pour durer' },
    eau: { name: 'main d’Eau', icon: '▽', key: 'sensible et intuitive',
      text: 'Paume allongée, doigts longs et fins : c’est une <b>main d’Eau</b>. Sensibilité, imagination, intuition : tu perçois les ambiances avant qu’on te les dise, et tu ressens beaucoup. C’est une main d’artiste et d’écoute. Ton piège : absorber les émotions des autres comme si elles étaient les tiennes.',
      force: 'ta sensibilité', defi: 'distinguer ce qui est à toi de ce qui vient des autres' }
  };
  var HEART = {
    end: {
      jupiter: 'Ta ligne de cœur file jusque sous l’index, vers le mont de Jupiter. C’est le <b>cœur idéaliste</b> : tu aimes avec des valeurs, tu cherches une relation qui te fait grandir, et tu peux être exigeant·e, envers l’autre comme envers toi.',
      entre: 'Ta ligne de cœur s’achève <b>entre l’index et le majeur</b>. C’est la fin que les chiromanciens aiment le plus, celle de l’équilibre entre l’élan et la raison : tu sais donner sans t’oublier, et tu choisis avec ton cœur, mais les yeux ouverts.',
      saturne: 'Ta ligne de cœur s’arrête <b>sous le majeur</b>, vers le mont de Saturne. C’est un cœur qui se protège : tu aimes concrètement, par des actes plus que par des mots, et tu as besoin de temps avant d’ouvrir ta porte. Une fois qu’elle est ouverte, ta loyauté est profonde.'
    },
    form: {
      courbe: 'Sa courbe remonte vers les doigts : tes émotions se voient. Tu exprimes ce que tu ressens, avec chaleur et spontanéité.',
      souple: 'Son tracé reste souple, ni tout droit ni très arqué : tu passes de la retenue à l’élan selon la confiance que tu accordes.',
      droite: 'Son tracé est plutôt droit : une affectivité pudique et réfléchie. Tu ressens fort mais tu le dis peu ; ceux qui te connaissent savent lire tes gestes.'
    },
    len: {
      longue: 'Longue, elle traverse presque toute la paume : un cœur vaste, capable d’aimer large, que ce soit la famille, les amis ou les causes.',
      moyenne: 'Sa longueur est mesurée : un juste milieu entre ouverture et intimité.',
      courte: 'Plutôt courte, elle dit un cœur sélectif : peu d’élus, mais des liens choisis et intenses.'
    },
    depth: { profonde: 'Bien marquée, elle signale des émotions vécues pleinement.', fine: 'Fine et délicate, elle trahit une grande sensibilité, parfois gardée pour toi.', moyenne: '' },
    broken: 'On y voit une coupure, souvent lue comme un tournant : une manière d’aimer qui s’est transformée.'
  };
  var HEAD = {
    slope: {
      droite: 'Ta ligne de tête est <b>droite</b> : une pensée logique et pragmatique. Tu analyses avant de décider et tu aimes les faits.',
      inclinee: 'Ta ligne de tête s’incline <b>doucement vers le poignet</b> : tu allies raisonnement et imagination. Tu sais rêver un projet, puis le mettre en plan.',
      descendante: 'Ta ligne de tête <b>plonge vers le mont de la Lune</b> : imagination fertile, pensée créative et symbolique. Les idées te viennent en images ; prends garde seulement à ne pas t’y perdre.'
    },
    len: { longue: 'Longue, elle montre que tu aimes approfondir et peser chaque option. Penses-tu parfois trop ?', moyenne: '', courte: 'Plutôt courte, elle montre que tu décides vite, à l’instinct, et que tu vas à l’essentiel.' },
    joint: {
      liees: 'Elle naît collée à ta ligne de vie : c’est un signe de prudence et d’un attachement fort aux tiens. Tu as pris ton temps avant de voler de tes propres ailes.',
      proches: 'Elle démarre tout près de ta ligne de vie, sans s’y coller : un équilibre entre prudence et indépendance.',
      separees: 'Un espace la sépare de ta ligne de vie au départ : indépendance d’esprit, audace, goût de décider par toi-même, parfois un peu vite.'
    }
  };
  var LIFE = {
    arc: {
      large: 'Ta ligne de vie dessine un <b>large arc</b> qui s’avance vers le centre de la paume : une vitalité généreuse, de l’enthousiasme, le besoin de mouvement et de liens.',
      moyen: 'Ta ligne de vie trace un <b>arc équilibré</b> : une énergie régulière, que tu sais doser.',
      serre: 'Ta ligne de vie <b>reste proche du pouce</b> : une énergie qui se protège et qui a besoin de calme pour se recharger. Tu donnes mieux quand tu t’es d’abord ressourcé·e.'
    },
    len: { longue: 'Elle descend loin vers le poignet : endurance et ancrage solide.', moyenne: '', courte: 'Elle s’efface tôt sur la photo, ce qui n’annonce rien d’inquiétant : on y lit plutôt une énergie qui fonctionne par élans, et qu’il faut écouter.' },
    depth: { profonde: 'Bien creusée, elle dit force de caractère et résistance.', fine: 'Fine, elle dit un corps sensible, qui demande de la douceur.', moyenne: '' }
  };
  var HAND = {
    thumb: { long: 'Ton pouce est long : de la volonté, et la capacité de mener tes projets jusqu’au bout.', moyen: 'Ton pouce est proportionné : volonté et souplesse s’équilibrent.', court: 'Ton pouce est plutôt court : tu avances à l’élan et à l’émotion plus qu’à la force de volonté, et ton entourage compte pour toi.' },
    open: { tres: 'Il s’écarte largement de la main : générosité, ouverture, esprit libre.', ouvert: '', serre: 'Il reste près de la main : réserve et prudence, tu protèges ton espace.' },
    ir: { index: 'Ton index dépasse ton annulaire : besoin de diriger, confiance, sens des responsabilités (Jupiter).', annulaire: 'Ton annulaire dépasse ton index : créativité, goût de la beauté et du risque (Apollon).', egal: 'Ton index et ton annulaire s’équilibrent : harmonie entre ambition et créativité.' },
    pinky: { long: 'Ton auriculaire est long : aisance avec les mots, sens du contact (Mercure).', moyen: '', court: 'Ton auriculaire est plutôt court : tu t’exprimes mieux par les actes que par les discours.' }
  };
  var FATE = {
    nette: 'Une ligne du destin nette, qui monte vers le majeur : tu as un sens de la direction, une vocation qui te tient.',
    legere: 'Une ligne du destin légère ou faite de morceaux : ton chemin se construit par étapes, au gré des rencontres. Plus de liberté qu’un destin tout tracé.',
    absente: 'Pas de ligne du destin visible : c’est très courant. Elle dit une vie que tu inventes au jour le jour, sans scénario imposé.'
  };
  var QUESTION = {
    jupiter: 'Qu’attends-tu vraiment de ceux que tu aimes, et te l’accordes-tu à toi-même ?',
    entre: 'Dans quelle relation pourrais-tu donner un peu moins, et recevoir un peu plus ?',
    saturne: 'À qui pourrais-tu dire avec des mots, cette semaine, ce que tu montres déjà par tes actes ?'
  };
  var HEAD_KEY = { droite: 'une pensée claire et pratique', inclinee: 'une pensée qui unit raison et imagination', descendante: 'une pensée créative' };
  var HEART_KEY = { jupiter: 'un cœur idéaliste', entre: 'un cœur équilibré', saturne: 'un cœur qui se protège' };
  var LIFE_KEY = { large: 'une énergie généreuse', moyen: 'une énergie régulière', serre: 'une énergie à préserver' };

  function join(arr) { return arr.filter(Boolean).join(' '); }
  function sec(cls, icon, title, sub, body) {
    return '<section class="c127s-sec ' + cls + '"><h4><span aria-hidden="true">' + icon + '</span> ' + title + (sub ? ' <small>' + sub + '</small>' : '') + '</h4><p>' + body + '</p></section>';
  }
  function reading(t, photo) {
    var E = ELEMENT[t.element], h = '';
    h += '<p class="c127s-eyebrow">Ta lecture de la main</p>';
    h += '<h3 class="c127s-title">' + E.icon + ' Une ' + E.name + ', ' + E.key + '</h3>';
    if (photo) h += '<div class="c127s-photo">' + photo + '</div>';
    h += '<p class="c127s-lead">J’ai regardé ta main entière, puis chacune de tes lignes. Voici ce qu’elles racontent.</p>';
    h += sec('is-hand', '✋', 'Ta main en un regard', '', E.text);
    if (t.heart) h += sec('is-heart', '♥', 'Ligne de cœur', 'ta manière d’aimer', join([HEART.end[t.heart.end], HEART.form[t.heart.form], HEART.len[t.heart.len], HEART.depth[t.heart.depth], t.heart.broken && HEART.broken]));
    if (t.head) h += sec('is-head', '✦', 'Ligne de tête', 'ta manière de penser', join([HEAD.slope[t.head.slope], HEAD.len[t.head.len], t.joint && HEAD.joint[t.joint]]));
    if (t.life) h += sec('is-life', '❦', 'Ligne de vie', 'ton énergie', join([LIFE.arc[t.life.arc], LIFE.len[t.life.len], LIFE.depth[t.life.depth]]) + ' <i>Elle ne dit rien de la durée de ta vie : elle parle de la façon dont tu dépenses et recharges ton énergie.</i>');
    h += sec('is-fingers', '☝', 'Pouce et doigts', 'ta volonté, tes talents', join([HAND.thumb[t.thumb], HAND.open[t.thumbOpen], HAND.ir[t.indexRing], HAND.pinky[t.pinky]]));
    h += '<section class="c127s-sec is-fate"><h4><span aria-hidden="true">↟</span> Ligne du destin <small>ta direction</small></h4>' +
      '<p class="c127s-fate-q">Elle est souvent trop fine pour la photo. Regarde le centre de ta paume : vois-tu une ligne qui monte du poignet vers le majeur ?</p>' +
      '<div class="c127s-fate-b" role="group" aria-label="Ma ligne du destin"><button type="button" data-fate="nette">Oui, nette</button><button type="button" data-fate="legere">Légère ou en morceaux</button><button type="button" data-fate="absente">Je n’en vois pas</button></div><p class="c127s-fate-a" aria-live="polite"></p></section>';
    var end = t.heart ? t.heart.end : 'entre';
    h += '<section class="c127s-sum"><h4>Ce que ta main te murmure</h4><p>' +
      'Une ' + E.name + ', ' + (t.heart ? HEART_KEY[t.heart.end] : 'un cœur à écouter') + ', ' + (t.head ? HEAD_KEY[t.head.slope] : 'une pensée à découvrir') + (t.life ? ' et ' + LIFE_KEY[t.life.arc] : '') + '. ' +
      'Ta force du moment, c’est <b>' + E.force + '</b>. Ce que ta main t’invite à travailler : <b>' + E.defi + '</b>.</p>' +
      '<p class="c127s-q"><span>Question pour ton Grimoire</span>' + QUESTION[end] + '</p></section>';
    h += '<p class="c127s-note">Lecture symbolique inspirée de la chiromancie traditionnelle, à partir des proportions et des lignes mesurées sur ta photo. C’est un miroir pour réfléchir, jamais une prédiction ni un avis médical.</p>';
    return h;
  }

  /* ---------- 3. Remplir le moteur de l'atelier (sa carte du jour s'appuie sur ces champs) ---------- */
  function fill(root, t) {
    var set = function (k, v) {
      var s = root.querySelector('[data-field="' + k + '"]');
      if (!s || !v) return;
      s.value = v; s.dispatchEvent(new Event('change', { bubbles: true }));
    };
    set('palm_shape', { carree: 'plutôt carrée', rect: 'plutôt rectangulaire', longue: 'plutôt longue et étroite' }[t.shape]);
    set('finger_length', { courts: 'courts par rapport à la paume', prop: 'proportionnés', longs: 'longs par rapport à la paume' }[t.fingers]);
    set('thumb', t.thumbOpen === 'tres' ? 'très ouvert par rapport à la paume' : t.thumb);
    var aspect = function (L, alt) { return L.broken ? 'discontinue' : alt || (L.depth === 'moyenne' ? '' : L.depth); };
    if (t.heart) { set('heart_length', t.heart.len); set('heart_aspect', aspect(t.heart, t.heart.form === 'souple' ? '' : t.heart.form)); }
    if (t.head) { set('head_length', t.head.len); set('head_aspect', aspect(t.head, t.head.slope === 'droite' ? 'droite' : t.head.slope === 'descendante' ? 'courbe' : '')); }
    if (t.life) { set('life_length', t.life.len); set('life_aspect', aspect(t.life, t.life.arc === 'large' ? 'courbe' : '')); }
    Array.prototype.forEach.call(root.querySelectorAll('[data-quality]'), function (cb) { if (!cb.checked) cb.click(); });
  }

  /* ---------- 4. La séance ---------- */
  function setup(root) {
    if (root.__c127s) return; root.__c127s = true;
    var stage = root.querySelector('[data-step="2"]'), finalP = root.querySelector('[data-step="6"]');
    var wrap = root.querySelector('[data-map-wrap]'), file = root.querySelector('[data-file]'), img = root.querySelector('[data-preview]');
    if (!stage || !finalP || !wrap || !file) return;
    root.classList.add('c127s');
    document.body.classList.add('c127s-on');

    var intro = stage.querySelector('.terra127__muted');
    if (intro) intro.innerHTML = 'Photographie l’intérieur de ta main, bien à plat, doigts légèrement écartés, dans une lumière douce. <b>Terra fait le reste.</b>';
    // Un exemple réel de lecture, avant de photographier sa propre main.
    var EX = (window.C127TerraDetailed && window.C127TerraDetailed.example) || '/terra-lit-la-main/';
    [root.querySelector('[data-step="1"]'), stage].forEach(function (panel) {
      if (!panel || panel.querySelector('.c127s-example')) return;
      var a = el('a', 'c127s-example', '<span aria-hidden="true">✦</span> Voir une lecture en exemple');
      a.href = EX;
      var h = panel.querySelector('h2,h3');
      var after = panel === stage ? (intro || h) : h;
      if (after && after.parentNode === panel) panel.insertBefore(a, after.nextSibling); else panel.insertBefore(a, panel.firstChild);
    });
    var upLabel = stage.querySelector('.terra127__upload span');
    if (upLabel) upLabel.textContent = 'Photographier ma paume';

    var sweep = el('div', 'c127s-sweep'); sweep.setAttribute('aria-hidden', 'true'); wrap.appendChild(sweep);
    var steps = el('ol', 'c127s-steps', '<li data-s="photo">Photo reçue</li><li data-s="hand">Main repérée</li><li data-s="lines">Lignes lues</li>');
    steps.setAttribute('aria-live', 'polite'); steps.hidden = true;
    var found = el('div', 'c127s-found wp-exclude-emoji'); found.hidden = true;
    var cap = stage.querySelector('.terra127__capture');
    (cap || wrap).parentNode.insertBefore(steps, (cap || wrap).nextSibling);
    steps.parentNode.insertBefore(found, steps.nextSibling);

    var order = ['photo', 'hand', 'lines'];
    function progress(s) {
      steps.hidden = false;
      var i = order.indexOf(s);
      Array.prototype.forEach.call(steps.children, function (li, j) { li.className = j < i ? 'is-done' : j === i ? 'is-now' : ''; });
    }
    var T = null;
    root.addEventListener('c127:palm', function (e) {
      var d = e.detail || {};
      if (d.stage === 'photo') {
        root.classList.remove('c127s-ready', 'c127s-auto', 'c127s-edit'); found.hidden = true; T = null;
        wrap.classList.add('is-scanning'); progress('photo');
        if (upLabel) upLabel.textContent = 'Changer de photo';
        setTimeout(function () { wrap.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 80);
      } else if (d.stage === 'hand' || d.stage === 'lines') {
        progress(d.stage);
      } else if (d.stage === 'done') {
        wrap.classList.remove('is-scanning');
        Array.prototype.forEach.call(steps.children, function (li) { li.className = 'is-done'; });
        T = d.feats ? traits(d.feats) : null;
        showFound(d);
      } else if (d.stage === 'nohand' || d.stage === 'fail') {
        wrap.classList.remove('is-scanning'); steps.hidden = true;
        found.hidden = false; found.className = 'c127s-found wp-exclude-emoji is-warn';
        found.innerHTML = '<p><b>' + (d.stage === 'nohand' ? 'Je ne vois pas bien ta main.' : 'La lecture automatique ne marche pas sur cet appareil.') + '</b> ' +
          (d.stage === 'nohand' ? 'Reprends la photo : paume face à l’objectif, toute la main dans le cadre, doigts écartés, sans contre-jour.' : '') + '</p>' +
          '<div class="c127s-actions"><button type="button" class="c127s-cta" data-c127s="retake">Reprendre la photo</button>' +
          '<button type="button" class="c127s-link" data-c127s="manual">Continuer en décrivant ma main</button></div>';
      }
    });

    function trait(txt, cls) { return '<li class="' + (cls || '') + '">' + txt + '</li>'; }
    function showFound(d) {
      root.classList.add('c127s-ready');
      found.hidden = false; found.className = 'c127s-found wp-exclude-emoji';
      var t = T, list = '';
      if (t) {
        root.classList.add('c127s-auto');
        var E = ELEMENT[t.element];
        list += trait(E.icon + ' ' + E.name.charAt(0).toUpperCase() + E.name.slice(1));
        if (t.heart) list += trait('♥ Cœur ' + { jupiter: 'idéaliste', entre: 'équilibré', saturne: 'protégé' }[t.heart.end], 'is-heart');
        if (t.head) list += trait('✦ Pensée ' + { droite: 'pratique', inclinee: 'raison et imagination', descendante: 'créative' }[t.head.slope], 'is-head');
        if (t.life) list += trait('❦ Énergie ' + { large: 'généreuse', moyen: 'régulière', serre: 'à préserver' }[t.life.arc], 'is-life');
      }
      var partial = d.found && d.found.length < 3;
      found.innerHTML = '<p class="c127s-found__t">' + (t && !d.geometric ? '✓ Terra a lu ta main' : '✓ Main repérée') + '</p>' +
        (list ? '<ul class="c127s-traits">' + list + '</ul>' : '') +
        (d.geometric || partial ? '<p class="c127s-found__s">Certaines lignes étaient peu visibles : leur tracé suit la forme de ta main. Tu peux les ajuster.</p>' : '<p class="c127s-found__s">Les tracés colorés suivent tes vrais plis.</p>') +
        '<div class="c127s-actions"><button type="button" class="c127s-cta" data-c127s="read">Recevoir ma lecture ✦</button>' +
        '<button type="button" class="c127s-link" data-c127s="edit" aria-pressed="false">Ajuster les tracés</button></div>';
    }

    stage.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c127s]'); if (!b) return;
      var a = b.getAttribute('data-c127s');
      if (a === 'retake') file.click();
      else if (a === 'manual') { root.classList.remove('c127s-auto'); go(3); }
      else if (a === 'edit') { var on = root.classList.toggle('c127s-edit'); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? 'Terminer l’ajustement' : 'Ajuster les tracés'; }
      else if (a === 'read') { root.classList.remove('c127s-edit'); finish(); }
    });

    function go(n) { var nav = root.querySelector('[data-step-nav="' + n + '"]'); if (nav) nav.click(); }
    function photoClone() {
      // vignette : la photo avec ses tracés, figée au moment de la lecture
      if (!img || !img.src) return '';
      var svg = root.querySelector('[data-mapper]'), lines = svg ? svg.querySelector('.terra127__palm-lines') : null;
      var r = img.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
      var box = '<div class="c127s-thumb" style="aspect-ratio:' + (wr.width / wr.height || 0.75).toFixed(3) + '"><img src="' + img.src + '" alt="Ta paume" style="object-fit:' + getComputedStyle(img).objectFit + '">';
      if (lines) box += '<svg viewBox="' + svg.getAttribute('viewBox') + '" preserveAspectRatio="' + (svg.getAttribute('preserveAspectRatio') || 'xMidYMid meet') + '" aria-hidden="true">' + lines.outerHTML + '</svg>';
      void r;
      return box + '</div>';
    }
    function finish() {
      if (!T) { go(3); return; }
      fill(root, T);
      var thumb = photoClone();
      go(6);
      var box = finalP.querySelector('.c127s-reading');
      if (!box) { box = el('article', 'c127s-reading wp-exclude-emoji'); finalP.insertBefore(box, finalP.firstChild); }
      box.innerHTML = reading(T, thumb) +
        '<div class="c127s-after"><button type="button" class="c127s-link" data-c127s="fix">Corriger ce que Terra a lu</button>' +
        (document.getElementById('c127-hub-tab-photo') ? '<button type="button" class="c127s-link" data-c127s="deep">Aller plus loin : lecture détaillée</button>' : '') + '</div>' +
        '<p class="c127s-bridge">Et pour aujourd’hui, Terra te confie un geste.</p>';
      try { sessionStorage.setItem('c127_palm_reading', JSON.stringify({ at: Date.now(), t: T })); } catch (e) {}
      setTimeout(function () { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
    }
    finalP.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c127s],[data-fate]'); if (!b) return;
      if (b.hasAttribute('data-fate')) {
        var k = b.getAttribute('data-fate'), sec2 = b.closest('.c127s-sec');
        Array.prototype.forEach.call(sec2.querySelectorAll('[data-fate]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        sec2.querySelector('.c127s-fate-a').textContent = FATE[k].replace(/<[^>]+>/g, '');
        var s = root.querySelector('[data-field="fate_length"]');
        if (s && k !== 'absente' && !s.value) { s.value = k === 'nette' ? 'longue' : 'courte'; s.dispatchEvent(new Event('change', { bubbles: true })); }
        return;
      }
      var a = b.getAttribute('data-c127s');
      if (a === 'fix') { root.classList.remove('c127s-auto'); go(3); root.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      if (a === 'deep') { var tab = document.getElementById('c127-hub-tab-photo'); if (tab) { tab.click(); tab.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
    });
  }

  function boot(n) {
    var roots = document.querySelectorAll('.terra127');
    if (!roots.length) { if ((n || 0) < 30) setTimeout(function () { boot((n || 0) + 1); }, 200); return; }
    Array.prototype.forEach.call(roots, setup);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(0); }); else boot(0);
})();
