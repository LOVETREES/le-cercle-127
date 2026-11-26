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
  // Chaque main reçoit ses propres variantes, choisies d'après ses mesures : même main, même texte ; autre main, autre texte.
  var SEED = '';
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function vary(x, salt) { return Array.isArray(x) ? x[hash(SEED + '|' + salt) % x.length] : x; }
  function seedOf(F) {
    var H = F.lines.heart || {}, T = F.lines.head || {}, V = F.lines.life || {};
    return [F.ratio, F.fingers, F.thumbLen, F.thumbOpen, F.indexRing, H.length, H.curve, H.endK, T.slope, T.length, V.inner, V.low]
      .map(function (x) { return x == null || isNaN(x) ? '' : (+x).toFixed(2); }).join('|');
  }
  function near(x, t, w) { return x != null && Math.abs(x - t) <= w; }
  function share(x) { return x >= 1 ? 'toute la largeur de ta paume, et même un peu plus' : Math.round(x * 100) + ' % de la largeur de ta paume'; }

  var ELEMENT = {
    terre: { name: 'main de Terre', part: 'de Terre', icon: '△', key: 'concrète et fiable',
      text: ['Paume carrée, doigts plutôt courts : c’est une <b>main de Terre</b>. On y lit une personne concrète, fiable, qui a besoin de toucher, de faire, de construire. Tu crois ce que tu vois pousser, et les grandes théories te laissent souvent froide ou froid. Ta force, c’est la constance. Ton piège : continuer à porter ce qui ne te nourrit plus, par simple fidélité.',
        'Ta paume est plutôt carrée et tes doigts restent courts par rapport à elle : c’est une <b>main de Terre</b>, la main de celles et ceux qui font. Tu as besoin de résultats tangibles, d’un rythme stable, de choses qui tiennent, et on peut compter sur toi. Ton piège : confondre solidité et immobilité, et rester là où tu n’as plus envie d’être.'],
      force: 'ta constance', defi: 'lâcher ce qui pèse sans le trahir' },
    air: { name: 'main d’Air', part: 'd’Air', icon: '◇', key: 'curieuse et vive',
      text: ['Paume carrée, doigts longs : c’est une <b>main d’Air</b>. L’esprit est vif, curieux, communicant. Tu as besoin de comprendre, d’échanger, de mettre des mots sur ce que tu vis. Les idées te portent. Ton piège : vivre dans ta tête et oublier ton corps, ou analyser une émotion au lieu de la ressentir.',
        'Une paume carrée prolongée par des doigts longs : c’est une <b>main d’Air</b>. La tradition y voit un esprit qui relie, questionne et traduit : tu comprends vite et tu aimes faire comprendre. Les conversations te nourrissent autant qu’un repas. Ton piège : tout passer au filtre de la pensée, au point de ne plus savoir ce que tu ressens.'],
      force: 'ta clarté', defi: 'redescendre de la tête vers le corps' },
    feu: { name: 'main de Feu', part: 'de Feu', icon: '▲', key: 'élan et intuition',
      text: ['Paume allongée, doigts plus courts qu’elle : c’est une <b>main de Feu</b>. Il y a de l’élan, de l’enthousiasme, une intuition rapide et l’envie d’agir. Tu démarres vite, tu entraînes les autres, tu as besoin que ça bouge. Ton piège : l’impatience, et cette façon de brûler ton énergie avant d’avoir rechargé.',
        'Ta paume s’allonge et tes doigts restent plus courts qu’elle : c’est une <b>main de Feu</b>. Tu sens avant d’expliquer, tu démarres avant les autres, et ton enthousiasme est contagieux. Ton piège : te lancer dans trois projets à la fois et t’essouffler avant d’avoir fini le premier.'],
      force: 'ton élan', defi: 'ralentir assez pour durer' },
    eau: { name: 'main d’Eau', part: 'd’Eau', icon: '▽', key: 'sensible et intuitive',
      text: ['Paume allongée, doigts longs et fins : c’est une <b>main d’Eau</b>. Sensibilité, imagination, intuition : tu perçois les ambiances avant qu’on te les dise, et tu ressens beaucoup. C’est une main d’artiste et d’écoute. Ton piège : absorber les émotions des autres comme si elles étaient les tiennes.',
        'Une paume allongée et des doigts longs : c’est une <b>main d’Eau</b>. Tu captes les nuances, les non-dits, les atmosphères ; ton imagination est riche et ton écoute précieuse. Ton piège : te laisser envahir par l’humeur des autres jusqu’à oublier la tienne.'],
      force: 'ta sensibilité', defi: 'distinguer ce qui est à toi de ce qui vient des autres' }
  };
  // Une mesure proche d'un seuil : la main est mixte, et on le dit.
  function mixed(F) {
    var nearShape = near(F.ratio, 1.42, 0.05), nearFing = near(F.fingers, 0.9, 0.03);
    if (!nearShape && !nearFing) return '';
    var k = [F.ratio < 1.42 ? 'C' : 'L', F.fingers >= 0.9 ? 'l' : 'c'];
    if (nearShape) k[0] = k[0] === 'C' ? 'L' : 'C'; else k[1] = k[1] === 'l' ? 'c' : 'l';
    var O = ELEMENT[{ Cc: 'terre', Cl: 'air', Lc: 'feu', Ll: 'eau' }[k.join('')]];
    var why = nearShape ? 'ta paume est à la limite entre carrée et allongée (' + num(F.ratio, 2) + ' fois plus longue que large)'
      : 'tes doigts sont à la limite entre courts et longs (ton majeur mesure ' + num(F.fingers, 2) + ' fois ta paume)';
    return 'Une nuance pourtant : ' + why + '. Ta main est mixte, avec une part ' + O.part + ', ' + O.key + '. La plupart des mains sont ainsi, et c’est une richesse.';
  }
  var HEART = {
    end: {
      jupiter: ['Ta ligne de cœur file jusque sous l’index, vers le mont de Jupiter. C’est le <b>cœur idéaliste</b> : tu aimes avec des valeurs, tu cherches une relation qui te fait grandir, et tu peux être exigeant·e, envers l’autre comme envers toi.',
        'Ta ligne de cœur monte jusque <b>sous l’index</b>, au pied de Jupiter. La tradition y lit un amour porté par un idéal : tu veux admirer ceux que tu aimes, et qu’ils t’aident à grandir. Garde un peu d’indulgence pour les imperfections, les tiennes comprises.'],
      entre: ['Ta ligne de cœur s’achève <b>entre l’index et le majeur</b>. C’est la fin que les chiromanciens aiment le plus, celle de l’équilibre entre l’élan et la raison : tu sais donner sans t’oublier, et tu choisis avec ton cœur, mais les yeux ouverts.',
        'Ta ligne de cœur s’arrête <b>entre l’index et le majeur</b>. Les chiromanciens y voient un cœur qui a trouvé sa mesure : chaleureux sans se perdre, lucide sans se fermer. Tu sais dire oui, et tu sais aussi dire non.'],
      saturne: ['Ta ligne de cœur s’arrête <b>sous le majeur</b>, vers le mont de Saturne. C’est un cœur qui se protège : tu aimes concrètement, par des actes plus que par des mots, et tu as besoin de temps avant d’ouvrir ta porte. Une fois qu’elle est ouverte, ta loyauté est profonde.',
        'Ta ligne de cœur vient se poser <b>sous le majeur</b>, au pied du mont de Saturne. La tradition y lit un cœur sérieux, qui observe avant de s’engager : ta tendresse passe par la présence et les services rendus plus que par les déclarations.',
        'Ta ligne de cœur s’achève <b>sous le majeur</b>, sous Saturne, le mont de la patience. Tu n’offres pas ta confiance au premier venu : tu la construis pierre après pierre, et ceux qui l’ont obtenue savent qu’elle tient.']
    },
    form: {
      courbe: ['Sa courbe remonte vers les doigts : tes émotions se voient. Tu exprimes ce que tu ressens, avec chaleur et spontanéité.',
        'Son tracé s’arrondit vers les doigts : tu montres ce que tu ressens, et ta chaleur se voit avant même que tu parles.'],
      souple: ['Son tracé reste souple, ni tout droit ni très arqué : tu passes de la retenue à l’élan selon la confiance que tu accordes.',
        'Son tracé ondule doucement, ni rigide ni très arqué : tu t’ouvres par étapes, au rythme de la confiance.'],
      droite: ['Son tracé est plutôt droit : une affectivité pudique et réfléchie. Tu ressens fort mais tu le dis peu ; ceux qui te connaissent savent lire tes gestes.',
        'Son tracé file presque à l’horizontale : tu gardes tes émotions pour toi, et c’est dans les gestes du quotidien que ton attachement se lit.']
    },
    depth: { profonde: 'Bien marquée, elle signale des émotions vécues pleinement.', fine: 'Fine et délicate, elle trahit une grande sensibilité, parfois gardée pour toi.', moyenne: '' },
    broken: 'On y voit une coupure, souvent lue comme un tournant : une manière d’aimer qui s’est transformée.'
  };
  function heartNuance(H, end) {
    var k = H.endK;
    if (end === 'saturne' && near(k, 0.08, 0.03)) return 'Son extrémité frôle pourtant l’espace entre majeur et index : derrière ta réserve, il y a une vraie envie d’équilibre et d’échange.';
    if (end === 'entre' && near(k, 0.08, 0.03)) return 'Elle penche un peu vers le majeur : ton équilibre garde une part de pudeur.';
    if (end === 'entre' && near(k, 0.22, 0.04)) return 'Elle s’avance presque sous l’index : ton équilibre a une pointe d’idéal.';
    if (end === 'jupiter' && near(k, 0.22, 0.04)) return 'Elle atteint l’index tout juste : un idéal qui garde les pieds sur terre.';
    return '';
  }
  function heartLen(len, H) {
    var opts = {
      longue: ['un cœur vaste, capable d’aimer large, que ce soit la famille, les amis ou les causes.', 'tu as de la place pour beaucoup de monde, et tu t’attaches pour longtemps.'],
      moyenne: near(H.length, 1.0, 0.05) ? ['presque d’un bord à l’autre, un cœur qui s’ouvre plus largement qu’il ne le montre.', 'à un souffle d’un cœur « long », signe que tu aimes plus largement que tu ne le laisses voir.']
        : near(H.length, 0.8, 0.05) ? ['juste au-dessus d’un cœur sélectif, et tu choisis tes proches avec soin.', 'tout près d’un cœur sélectif, avec un petit cercle tenu avec soin.']
        : ['un juste milieu entre ouverture et intimité.', 'assez pour accueillir, sans te disperser.'],
      courte: ['un cœur sélectif, avec peu d’élus mais des liens choisis et intenses.', 'tu réserves ta tendresse à un petit cercle, et tu t’y donnes entièrement.']
    };
    return 'Elle couvre ' + share(H.length) + ' : ' + vary(opts[len], 'hlen');
  }
  // Ce que le cœur devient quand on le lit avec le reste de la main.
  function heartCross(t) {
    var h = t.heart, hd = t.head;
    if (h.end === 'saturne' && t.thumbOpen === 'tres') return 'Avec ton pouce très ouvert, cette réserve cache une vraie générosité : tu donnes beaucoup, simplement pas tes confidences.';
    if (h.end === 'jupiter' && t.thumbOpen === 'serre') return 'Ton pouce resserré tempère cet idéal : tu vises haut, mais tu protèges ton espace.';
    if (hd && h.form === 'droite' && hd.slope === 'descendante') return 'Cœur pudique et tête imaginative : ce que tu ne dis pas, tu le rêves, l’écris ou le crées.';
    if (hd && h.form === 'courbe' && hd.slope === 'droite') return 'Un cœur qui s’exprime et une tête qui raisonne : tu ressens d’abord, tu vérifies ensuite.';
    var byEl = {
      saturne: { air: 'Main d’Air et cœur sous Saturne : tu parles volontiers de tout, sauf de ce que tu ressens vraiment.',
        eau: 'Main d’Eau et cœur sous Saturne : tu ressens énormément, et tu as appris à le garder à l’abri.',
        feu: 'Main de Feu et cœur sous Saturne : ton élan est vif partout, sauf en amour, où tu prends ton temps.',
        terre: 'Main de Terre et cœur sous Saturne : ta tendresse se mesure en fidélité, en présence, en choses faites ensemble.' },
      jupiter: { air: 'Main d’Air et cœur sous Jupiter : tu tombes souvent amoureuse ou amoureux d’un esprit avant tout.',
        eau: 'Main d’Eau et cœur sous Jupiter : tu aimes avec intensité et tu idéalises vite ; laisse aux autres le droit d’être simples.',
        feu: 'Main de Feu et cœur sous Jupiter : quand tu aimes, tu veux construire quelque chose de grand, et vite.',
        terre: 'Main de Terre et cœur sous Jupiter : ton idéal amoureux a les pieds sur terre, un foyer, des projets, du solide.' },
      entre: { air: 'Main d’Air et cœur équilibré : tu sais parler de tes liens sans les abîmer.',
        eau: 'Main d’Eau et cœur équilibré : ta sensibilité trouve sa juste distance.',
        feu: 'Main de Feu et cœur équilibré : l’élan est là, mais tu sais choisir où le mettre.',
        terre: 'Main de Terre et cœur équilibré : un amour simple, fiable, qui ne fait pas de bruit.' }
    };
    return byEl[h.end][t.element];
  }
  var HEAD = {
    slope: {
      droite: ['Ta ligne de tête est <b>droite</b> : une pensée logique et pragmatique. Tu analyses avant de décider et tu aimes les faits.',
        'Ta ligne de tête traverse la paume <b>presque à plat</b> : tu penses par étapes, tu aimes les faits vérifiés et les plans qui tiennent.'],
      inclinee: ['Ta ligne de tête s’incline <b>doucement vers le poignet</b> : tu allies raisonnement et imagination. Tu sais rêver un projet, puis le mettre en plan.',
        'Ta ligne de tête descend <b>en pente douce</b> : la raison tient la barre, l’imagination gonfle les voiles.'],
      descendante: ['Ta ligne de tête <b>plonge vers le mont de la Lune</b> : imagination fertile, pensée créative et symbolique. Les idées te viennent en images ; prends garde seulement à ne pas t’y perdre.',
        'Ta ligne de tête <b>plonge franchement vers le mont de la Lune</b> : tu penses en images, en intuitions, en histoires. Donne-leur une forme, sinon elles tournent en boucle.']
    },
    len: { longue: 'Longue, elle montre que tu aimes approfondir et peser chaque option. Penses-tu parfois trop ?', moyenne: ['', 'De longueur moyenne, elle dit une réflexion qui sait s’arrêter au bon moment.'], courte: 'Plutôt courte, elle montre que tu décides vite, à l’instinct, et que tu vas à l’essentiel.' },
    joint: {
      liees: 'Elle naît collée à ta ligne de vie : c’est un signe de prudence et d’un attachement fort aux tiens. Tu as pris ton temps avant de voler de tes propres ailes.',
      proches: 'Elle démarre tout près de ta ligne de vie, sans s’y coller : un équilibre entre prudence et indépendance.',
      separees: 'Un espace la sépare de ta ligne de vie au départ : indépendance d’esprit, audace, goût de décider par toi-même, parfois un peu vite.'
    }
  };
  function headNuance(slope, T) {
    var d = Math.round(T.slope) + '°';
    if (slope === 'droite' && near(T.slope, 30, 3)) return 'Avec une pente de ' + d + ', elle est à la frontière d’une pensée plus imaginative : la logique domine, mais l’intuition n’est pas loin.';
    if (slope === 'inclinee' && near(T.slope, 30, 3)) return 'À ' + d + ', elle reste proche d’une ligne droite : ton imagination demande toujours un plan.';
    if (slope === 'inclinee' && near(T.slope, 40, 3)) return 'À ' + d + ', elle approche de la Lune : l’imagination prend souvent le dessus.';
    if (slope === 'descendante' && near(T.slope, 40, 3)) return 'À ' + d + ', elle vient tout juste de basculer vers la Lune : un esprit créatif qui garde un fil logique.';
    return '';
  }
  var LIFE = {
    arc: {
      large: ['Ta ligne de vie dessine un <b>large arc</b> qui s’avance vers le centre de la paume : une vitalité généreuse, de l’enthousiasme, le besoin de mouvement et de liens.',
        'Ta ligne de vie <b>s’ouvre largement</b> vers le centre de ta paume : tu as besoin d’espace, de mouvement et de gens autour de toi pour te sentir en forme.'],
      moyen: ['Ta ligne de vie trace un <b>arc équilibré</b> : une énergie régulière, que tu sais doser.',
        'Ta ligne de vie trace <b>un arc régulier</b> autour du pouce : ton énergie est stable, tu sais la répartir sur la journée.'],
      serre: ['Ta ligne de vie <b>reste proche du pouce</b> : une énergie qui se protège et qui a besoin de calme pour se recharger. Tu donnes mieux quand tu t’es d’abord ressourcé·e.',
        'Ta ligne de vie <b>épouse de près la base du pouce</b> : ton énergie est précieuse et tu la dépenses avec soin. Les moments seuls ne sont pas un luxe pour toi, ce sont des recharges.']
    },
    nuance: function (arc, V) {
      if (arc === 'moyen' && near(V.inner, 0.02, 0.015)) return 'Son arc tire vers le large : quand tu es bien entouré·e, ton énergie décolle.';
      if (arc === 'moyen' && near(V.inner, 0.1, 0.02)) return 'Son arc tend à se rapprocher du pouce : garde des temps calmes dans ta semaine.';
      return '';
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
    jupiter: ['Qu’attends-tu vraiment de ceux que tu aimes, et te l’accordes-tu à toi-même ?', 'Quelle part de ton idéal pourrais-tu vivre dès cette semaine, telle quelle, sans attendre qu’elle soit parfaite ?'],
    entre: ['Dans quelle relation pourrais-tu donner un peu moins, et recevoir un peu plus ?', 'Qu’est-ce qui t’aide à rester toi-même au milieu de ceux que tu aimes ?'],
    saturne: ['À qui pourrais-tu dire avec des mots, cette semaine, ce que tu montres déjà par tes actes ?', 'Quelle porte de ton cœur pourrais-tu entrouvrir, et pour qui ?']
  };
  function question(end) { return vary(QUESTION[end], 'q'); }
  var HEAD_KEY = { droite: 'une pensée claire et pratique', inclinee: 'une pensée qui unit raison et imagination', descendante: 'une pensée créative' };
  var HEART_KEY = { jupiter: 'un cœur idéaliste', entre: 'un cœur équilibré', saturne: 'un cœur qui se protège' };
  var LIFE_KEY = { large: 'une énergie généreuse', moyen: 'une énergie régulière', serre: 'une énergie à préserver' };

  // Ce que chaque trait devient quand on le lit avec l'élément de la main
  var TITLE = {
    feu: { jupiter: 'Un feu qui vise haut', entre: 'Un feu qui sait attendre son heure', saturne: 'Un feu qui couve sous la braise' },
    eau: { jupiter: 'Une eau claire qui cherche l’idéal', entre: 'Une eau profonde et juste', saturne: 'Une eau calme qui garde ses secrets' },
    air: { jupiter: 'Un souffle qui porte loin', entre: 'Un vent juste, ni tempête ni calme plat', saturne: 'Un air léger qui protège son cœur' },
    terre: { jupiter: 'Une terre qui fait pousser des rêves', entre: 'Une terre fertile et équilibrée', saturne: 'Une terre solide, fidèle à ses racines' }
  };
  var VERB = { feu: 'Tu brûles', eau: 'Tu ressens tout', air: 'Tu penses vite', terre: 'Tu construis' };
  var HEART_CLAUSE = { jupiter: 'tu vises haut pour ceux que tu aimes', entre: 'tu sais choisir pour qui', saturne: 'tu gardes ta chaleur pour quelques-uns' };
  var HEAD_COMBO = {
    feu: { descendante: 'Le Feu de ta main pousse à agir, et ta tête qui plonge vers la Lune donne à cet élan des images : tu agis souvent sur une vision.', droite: 'Feu et tête droite : tu décides vite et tu sais pourquoi. Prends garde seulement à ne pas confondre rapidité et précipitation.', inclinee: 'Le Feu te pousse, et ta tête inclinée te fait rêver juste assez pour viser la bonne direction.' },
    eau: { descendante: 'Une main d’Eau et une tête qui plonge : ton monde intérieur est très riche. Écrire, dessiner ou créer t’aide à lui donner forme.', droite: 'Ta sensibilité d’Eau est tenue par une tête droite : tu ressens tout, mais tu sais mettre de l’ordre.', inclinee: 'Ta main d’Eau et ta tête inclinée se répondent : l’intuition guide, la raison vérifie.' },
    air: { descendante: 'Une main d’Air et une tête vers la Lune : les idées fusent. Note-les, sinon elles repartent avec le vent.', droite: 'Main d’Air et tête droite : une pensée nette, qui aime comprendre comment les choses marchent.', inclinee: 'Ta main d’Air et ta tête inclinée font une pensée souple et curieuse, qui relie les idées entre elles.' },
    terre: { descendante: 'Une main de Terre et une tête qui plonge : sous ton côté concret vit une imagination qu’on ne soupçonne pas.', droite: 'Terre et tête droite : du concret, du solide, des décisions qui tiennent.', inclinee: 'Ta main de Terre garde les pieds sur terre pendant que ta tête imagine : tu rêves des projets réalisables.' }
  };
  var JOINT_COMBO = {
    liees: { feu: 'Le Feu de ta main pousse à foncer ; cette tête liée te fait d’abord regarder qui tu emmènes avec toi.', eau: 'Ta sensibilité d’Eau s’est construite au contact des tiens : tu ressens d’abord ce que vit ton entourage.', air: 'Ton esprit d’Air consulte, compare et écoute avant de trancher.', terre: 'Ta main de Terre aime les racines : tu avances quand le sol est sûr et les tiens à côté.' },
    separees: { feu: 'Avec une main de Feu, cette indépendance donne de l’audace : tu pars souvent avant les autres.', eau: 'Ta sensibilité d’Eau ne t’empêche pas de suivre ta propre route, même à contre-courant.', air: 'Ton esprit d’Air aime penser par lui-même, hors des sentiers battus.', terre: 'Ta main de Terre bâtit à sa façon, sans attendre l’approbation des autres.' }
  };
  var LIFE_COMBO = { feu: 'Pour une main de Feu, c’est un rappel que l’élan dure quand il est nourri.', eau: 'Pour une main d’Eau, se ressourcer veut souvent dire s’isoler un peu, au calme.', air: 'Pour une main d’Air, l’énergie revient avec le mouvement et l’air libre.', terre: 'Pour une main de Terre, l’énergie revient au contact du concret : marcher, jardiner, faire.' };
  function fingersCombo(t) {
    if (t.indexRing === 'annulaire') return t.head && t.head.slope === 'descendante' ? 'Il rejoint ta ligne de tête qui file vers la Lune : chez toi, l’imagination a de la place.' : 'Chez toi, le goût de créer cherche toujours une place.';
    if (t.indexRing === 'index') return t.head && t.head.slope === 'droite' ? 'Avec ta tête droite, c’est la main de quelqu’un qui sait organiser et mener.' : 'Tu sais prendre ta place quand il le faut.';
    return '';
  }
  var MANTRA = { feu: 'J’avance avec élan, et je garde du souffle pour durer.', eau: 'Je ressens tout, et je choisis ce que je garde.', air: 'Mes idées prennent racine quand je respire.', terre: 'Je bâtis pas à pas, et je laisse de la place à l’imprévu.' };
  var L_END = { jupiter: 'sous l’index', entre: 'entre index et majeur', saturne: 'sous le majeur' };
  var L_SHAPE = { carree: 'paume carrée', rect: 'paume rectangulaire', longue: 'paume allongée' };
  var L_FING = { courts: 'doigts plus courts que la paume', prop: 'doigts proportionnés', longs: 'doigts longs' };
  var L_THUMB = { court: 'pouce court', moyen: 'pouce moyen', long: 'pouce long' };
  var L_OPEN = { serre: 'pouce proche de la main', ouvert: 'pouce ouvert', tres: 'pouce très ouvert' };
  var L_IR = { index: 'index plus long', annulaire: 'annulaire plus long', egal: 'index et annulaire égaux' };
  var L_SLOPE = { droite: 'pensée droite', inclinee: 'légèrement inclinée', descendante: 'vers le mont de la Lune' };
  var L_JOINT = { liees: 'lignes liées', proches: 'lignes proches', separees: 'lignes séparées' };
  var L_ARC = { large: 'large arc', moyen: 'arc équilibré', serre: 'arc serré près du pouce' };
  var L_LIFELEN = { longue: 'descend jusqu’au poignet', moyenne: 'descend vers le poignet', courte: 's’arrête tôt' };

  function num(v, d) { return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace('.', ',').replace('-', '−'); }
  function signed(v, d) { return (v > 0 ? '+' : '') + num(v, d); }
  function join(arr) { return arr.filter(Boolean).join(' '); }
  function obs(list) { return '<ul class="c127s-obs">' + list.filter(Boolean).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; }
  function sec(k, title, sub, paras, list) {
    return '<section class="c127s-sec is-' + k + '" data-k="' + k + '" tabindex="0"><h4>' + title + (sub ? ' <small>' + sub + '</small>' : '') + '</h4>' +
      paras.filter(Boolean).map(function (p) { return '<p>' + p + '</p>'; }).join('') + (list ? obs(list) : '') + '</section>';
  }
  function measures(F, t) {
    var H = F.lines.heart, T = F.lines.head, rows = [
      ['Paume : longueur ÷ largeur', num(F.ratio, 2), L_SHAPE[t.shape]],
      ['Majeur ÷ paume', num(F.fingers, 2), L_FING[t.fingers]],
      ['Pouce ÷ paume', num(F.thumbLen, 2), L_THUMB[t.thumb]],
      ['Écart pouce–index', Math.round(F.thumbOpen) + '°', L_OPEN[t.thumbOpen]],
      ['Index ÷ annulaire', signed(F.indexRing * 100, 1) + ' %', L_IR[t.indexRing]]
    ];
    if (H && t.heart) rows.push(['Fin de la ligne de cœur', signed(H.endK, 2), L_END[t.heart.end]]);
    if (T && t.head) rows.push(['Pente de la ligne de tête', Math.round(T.slope) + '°', L_SLOPE[t.head.slope]]);
    if (t.joint) rows.push(['Écart tête–vie au départ', num(F.joint, 2), L_JOINT[t.joint]]);
    return '<details class="c127s-measures" open><summary>Mesures relevées sur ta photo</summary><dl>' +
      rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '<small>' + r[2] + '</small></dd>'; }).join('') + '</dl></details>';
  }
  /* Ce que Terra reçoit pour écrire la lecture : les mesures mises en mots, jamais la photo. */
  function pct(x) { return Math.round(x * 100) + ' %'; }
  function facts(t, F) {
    var H = F.lines.heart, T = F.lines.head, V = F.lines.life, f = [], n = [];
    var DEPTH = { fine: 'fine', moyenne: 'nettement visible', profonde: 'bien creusée' };
    f.push('Paume ' + { carree: 'plutôt carrée', rect: 'rectangulaire', longue: 'allongée' }[t.shape] + ' (' + num(F.ratio, 2) + ' fois plus longue que large)');
    f.push('Doigts ' + { courts: 'plus courts que la paume', prop: 'proportionnés à la paume', longs: 'longs' }[t.fingers] + ' (le majeur mesure ' + pct(F.fingers) + ' de la paume)');
    f.push('Pouce ' + t.thumb + ', ' + { serre: 'proche de la main', ouvert: 'ouvert', tres: 'très ouvert' }[t.thumbOpen] + ' (' + Math.round(F.thumbOpen) + '° avec l’index)');
    f.push({ index: 'Index plus long que l’annulaire', annulaire: 'Annulaire plus long que l’index', egal: 'Index et annulaire presque égaux' }[t.indexRing]);
    f.push('Auriculaire ' + t.pinky);
    if (H && t.heart) f.push('Ligne de cœur : traverse ' + pct(H.length) + ' de la largeur de la paume, finit ' + L_END[t.heart.end] + ', tracé ' +
      { droite: 'presque droit', souple: 'légèrement arqué', courbe: 'qui remonte en courbe vers les doigts' }[t.heart.form] + ', ' + DEPTH[t.heart.depth] + (t.heart.broken ? ', avec une coupure visible' : ''));
    if (T && t.head) f.push('Ligne de tête : ' + { droite: 'presque horizontale', inclinee: 'descend en pente douce', descendante: 'plonge vers le mont de la Lune' }[t.head.slope] +
      ' (' + Math.round(T.slope) + '°), longueur ' + t.head.len + (t.joint ? ', départ ' + { liees: 'collé à la ligne de vie', proches: 'tout près de la ligne de vie', separees: 'séparé de la ligne de vie' }[t.joint] : '') +
      ', ' + DEPTH[t.head.depth] + (t.head.broken ? ', avec une coupure visible' : ''));
    if (V && t.life) f.push('Ligne de vie : ' + L_ARC[t.life.arc] + ', ' + L_LIFELEN[t.life.len] + ', ' + DEPTH[t.life.depth] + (t.life.broken ? ', avec une coupure visible' : ''));
    if (near(F.ratio, 1.42, 0.05)) n.push('Paume à la limite entre carrée et allongée');
    if (near(F.ratio, 1.6, 0.05)) n.push('Paume à la limite entre rectangulaire et très allongée');
    if (near(F.fingers, 0.9, 0.03)) n.push('Doigts à la limite entre courts et longs');
    if (near(F.thumbOpen, 20, 3) || near(F.thumbOpen, 36, 3)) n.push('Ouverture du pouce entre deux formes');
    if (H && t.heart) {
      if (near(H.endK, 0.08, 0.03)) n.push('Fin de la ligne de cœur entre le majeur et l’espace entre majeur et index');
      if (near(H.endK, 0.22, 0.04)) n.push('Fin de la ligne de cœur presque sous l’index');
      if (near(H.length, 1.0, 0.05)) n.push('Ligne de cœur presque longue');
      if (near(H.length, 0.8, 0.05)) n.push('Ligne de cœur entre courte et moyenne');
      if (near(H.curve, 0.055, 0.008) || near(H.curve, 0.075, 0.008)) n.push('Tracé du cœur entre deux courbures');
    }
    if (T && t.head && (near(T.slope, 30, 3) || near(T.slope, 40, 3))) n.push('Pente de la ligne de tête à la limite entre deux formes');
    if (V && t.life && (near(V.inner, 0.02, 0.015) || near(V.inner, 0.1, 0.02))) n.push('Arc de la ligne de vie entre deux ouvertures');
    return { element: t.element, faits: f, nuances: n };
  }
  function reading(t, F, hasScene) {
    var E = ELEMENT[t.element], H = F.lines.heart, T = F.lines.head, V = F.lines.life, h = '';
    var end = t.heart ? t.heart.end : 'entre';
    SEED = seedOf(F);
    h += '<p class="c127s-eyebrow">Ta lecture de la main</p>';
    h += '<h3 class="c127s-title">Une ' + E.name + ', ' + E.key + '</h3>';
    h += '<div class="c127s-rgrid"><div class="c127s-rside">';
    if (hasScene) h += '<div class="c127s-scenebox"><div data-c127s-scene></div><button type="button" class="c127s-replay" data-c127s="replay">Revoir le scan</button></div>';
    h += measures(F, t) + '</div><div class="c127s-rmain">';
    h += '<section class="c127s-elem"><span class="c127s-sigil" aria-hidden="true">' + E.icon + '</span><div><p class="c127s-k">Ta main en un regard</p><p>' + join([vary(E.text, 'el'), mixed(F)]) + '</p></div></section>';
    if (t.heart) h += sec('heart', 'Ligne de cœur', 'ta manière d’aimer',
      [join([vary(HEART.end[t.heart.end], 'hend'), heartNuance(H, t.heart.end)]),
        join([vary(HEART.form[t.heart.form], 'hform'), heartLen(t.heart.len, H), HEART.depth[t.heart.depth], t.heart.broken && HEART.broken]),
        heartCross(t)],
      [t.heart.len + ' · ' + num(H.length, 2) + ' paume', { droite: 'droite', souple: 'souple', courbe: 'courbe' }[t.heart.form] + ' · courbure ' + num(H.curve, 2), 'finit ' + L_END[t.heart.end]]);
    if (t.head) h += sec('head', 'Ligne de tête', 'ta manière de penser',
      [join([vary(HEAD.slope[t.head.slope], 'hs'), headNuance(t.head.slope, T), vary(HEAD.len[t.head.len], 'hl')]), t.joint ? join([HEAD.joint[t.joint], JOINT_COMBO[t.joint] && JOINT_COMBO[t.joint][t.element]]) : ''],
      ['pente ' + Math.round(T.slope) + '° · ' + { droite: 'droite', inclinee: 'inclinée', descendante: 'descendante' }[t.head.slope], t.joint && { liees: 'départ lié à la vie', proches: 'départ proche de la vie', separees: 'départ séparé de la vie' }[t.joint]]);
    if (t.life) h += sec('life', 'Ligne de vie', 'ton énergie',
      [join([vary(LIFE.arc[t.life.arc], 'la'), LIFE.nuance(t.life.arc, V), LIFE.len[t.life.len], LIFE.depth[t.life.depth]]), 'Elle ne dit rien de la durée de ta vie : elle parle de la façon dont tu dépenses et recharges ton énergie. ' + LIFE_COMBO[t.element]],
      [L_ARC[t.life.arc], L_LIFELEN[t.life.len]]);
    h += sec('fingers', 'Pouce et doigts', 'ta volonté, tes talents',
      [join([HAND.thumb[t.thumb], HAND.open[t.thumbOpen]]), join([HAND.ir[t.indexRing], fingersCombo(t), HAND.pinky[t.pinky]])],
      ['pouce ' + num(F.thumbLen, 2) + ' paume', { index: 'index > annulaire', annulaire: 'annulaire > index', egal: 'index ≈ annulaire' }[t.indexRing]]);
    h += '<section class="c127s-sec is-fate" data-k="fate" tabindex="0"><h4>Ligne du destin <small>ta direction</small></h4>' +
      '<p class="c127s-fate-q">Elle est souvent trop fine pour la photo. Regarde le centre de ta paume : vois-tu une ligne qui monte du poignet vers le majeur ?</p>' +
      '<div class="c127s-fate-b" role="group" aria-label="Ma ligne du destin"><button type="button" data-fate="nette" aria-pressed="false">Oui, nette</button><button type="button" data-fate="legere" aria-pressed="false">Légère ou en morceaux</button><button type="button" data-fate="absente" aria-pressed="false">Je n’en vois pas</button></div><p class="c127s-fate-a" aria-live="polite"></p></section>';
    h += '<section class="c127s-sum"><p class="c127s-k">Le fil qui relie tout</p><h4 class="c127s-sum__t">' + TITLE[t.element][end] + '</h4><p>' +
      'Une ' + E.name + ', ' + (t.heart ? HEART_KEY[t.heart.end] : 'un cœur à écouter') + ', ' + (t.head ? HEAD_KEY[t.head.slope] : 'une pensée à découvrir') + (t.life ? ' et ' + LIFE_KEY[t.life.arc] : '') + '. ' +
      (t.head ? HEAD_COMBO[t.element][t.head.slope] + ' ' : '') + VERB[t.element] + ', et ' + HEART_CLAUSE[end] + '.</p>' +
      '<p>Ta force du moment, c’est <b>' + E.force + '</b>. Ce que ta main t’invite à travailler : <b>' + E.defi + '</b>.</p>' +
      '<p class="c127s-q"><span>Question pour ton Grimoire</span>' + question(end) + '</p>' +
      '<div class="c127s-talk"><button type="button" class="c127s-cta" data-c127s="talk-terra">En parler avec Terra</button>' +
      '<button type="button" class="c127s-link" data-c127s="talk-naia">Ou avec Naïa, si ton cœur a été touché</button></div></section>';
    h += '<p class="c127s-note">Lecture symbolique inspirée de la chiromancie traditionnelle, à partir des proportions et des lignes mesurées sur ta photo, sur ton appareil. Terra rédige ta lecture à partir de ces mesures : ta photo n’est jamais envoyée. C’est un miroir pour réfléchir, jamais une prédiction ni un avis médical.</p>';
    return h + '</div></div>';
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
    var T = null, D = null, sc = null, handP = Promise.resolve();
    var S = window.C127Scene;
    function dropScene() { if (sc) { sc.destroy(); sc = null; } root.classList.remove('c127s-scene'); }
    function ratioOf(P) { return Math.hypot(P[9][0] - P[0][0], P[9][1] - P[0][1]) / (Math.hypot(P[5][0] - P[17][0], P[5][1] - P[17][1]) || 1); }
    root.addEventListener('c127:palm', function (e) {
      var d = e.detail || {};
      if (d.stage === 'photo') {
        dropScene();
        root.classList.remove('c127s-ready', 'c127s-auto', 'c127s-edit'); found.hidden = true; T = null; D = null;
        wrap.classList.add('is-scanning'); progress('photo');
        if (upLabel) upLabel.textContent = 'Changer de photo';
        setTimeout(function () { wrap.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 80);
      } else if (d.stage === 'hand') {
        progress('hand');
      } else if (d.stage === 'lines') {
        progress('lines');
        // La main est trouvée : ses points apparaissent pendant que Terra cherche les lignes.
        if (S && d.P && d.W) {
          dropScene();
          sc = S.create({ W: d.W, H: d.H, fit: getComputedStyle(img).objectFit === 'contain' ? 'contain' : 'cover', over: img, wrap: wrap, ratio: num(ratioOf(d.P), 2) });
          sc.setHand(d.P); root.classList.add('c127s-scene');
          handP = sc.showHand();
        }
      } else if (d.stage === 'done') {
        D = d; T = d.feats ? traits(d.feats) : null;
        var polys = d.feats && d.feats.polys;
        var finishScan = function () {
          wrap.classList.remove('is-scanning');
          Array.prototype.forEach.call(steps.children, function (li) { li.className = 'is-done'; });
          showFound(d);
        };
        if (sc && polys && polys.heart) {
          sc.setLines(polys);
          handP.then(function () { wrap.classList.remove('is-scanning'); return sc && sc.drawAll(); }).then(function () { if (sc) sc.settle(); finishScan(); });
        } else { root.classList.remove('c127s-scene'); finishScan(); }
      } else if (d.stage === 'nohand' || d.stage === 'fail') {
        dropScene();
        wrap.classList.remove('is-scanning'); steps.hidden = true;
        found.hidden = false; found.className = 'c127s-found wp-exclude-emoji is-warn';
        found.innerHTML = '<p><b>' + (d.stage === 'nohand' ? 'Je ne vois pas bien ta main.' : 'La lecture automatique ne marche pas sur cet appareil.') + '</b> ' +
          (d.stage === 'nohand' ? 'Reprends la photo : paume face à l’objectif, toute la main dans le cadre, doigts écartés, sans contre-jour.' : '') + '</p>' +
          '<div class="c127s-actions"><button type="button" class="c127s-cta" data-c127s="retake">Reprendre la photo</button>' +
          '<button type="button" class="c127s-link" data-c127s="manual">Continuer en décrivant ma main</button></div>';
      }
    });

    // Avec « ?diag » dans l'adresse : la voie de calcul et les temps de chaque étape (pour déboguer sur téléphone).
    function diag() {
      if (!/[?&#]diag/.test(location.href)) return '';
      var I = window.__c127ScanInfo || {}, t = I.t || {}, d = function (a, b) { return t[a] && t[b] ? ((t[b] - t[a]) / 1000).toFixed(1) + ' s' : '–'; };
      return '<p class="c127s-found__s" style="font-family:monospace;text-align:left">voie : ' + (I.path || '?') + '<br>photo → main : ' + d('photo', 'detected') +
        '<br>photo → fin : ' + d('photo', 'done') + '<br>worker prêt en : ' + d('workerStart', 'workerReady') + (t.workerOff ? ' (refusé)' : '') +
        '<br>image : ' + (D && D.W) + '×' + (D && D.H) + ' · écran ' + innerWidth + ' px<br>' + navigator.userAgent.replace(/[<>]/g, '').slice(0, 120) + '</p>';
    }
    // Avec « ?diag » : relevé en direct après le scan (page occupée ? défilement bloqué ?).
    function diagLive() {
      if (!/[?&#]diag/.test(location.href) || diagLive.on) return; diagLive.on = true;
      var box = el('p', 'c127s-found__s'); box.style.cssText = 'font-family:monospace;text-align:left;border-top:1px dashed rgba(255,255,255,.2);padding-top:6px';
      found.appendChild(box);
      var maxGap = 0, last = performance.now(), touches = 0, moves = 0, scrolls = 0, prevented = 0;
      document.addEventListener('touchstart', function () { touches++; }, { passive: true, capture: true });
      document.addEventListener('touchmove', function (e) { moves++; setTimeout(function () { if (e.defaultPrevented) prevented++; }, 0); }, { passive: true, capture: true });
      window.addEventListener('scroll', function () { scrolls++; }, { passive: true });
      (function f(now) { var g = now - last; if (g > maxGap) maxGap = g; last = now; requestAnimationFrame(f); })(last);
      var t0 = Date.now();
      setInterval(function () {
        box.textContent = 'après le scan (' + Math.round((Date.now() - t0) / 1000) + ' s) · plus longue pause : ' + Math.round(maxGap) + ' ms · touchers : ' + touches + ' · glissés : ' + moves + ' (bloqués : ' + prevented + ') · défilements : ' + scrolls;
        if (!found.contains(box)) found.appendChild(box);
      }, 1000);
    }
    function trait(txt, cls) { return '<li class="' + (cls || '') + '">' + txt + '</li>'; }
    function showFound(d) {
      setTimeout(diagLive, 50);
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
        diag() +
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
    var rsc = null, AI = null;
    /* Terra réécrit la lecture à partir des mesures ; si elle ne répond pas, la lecture locale reste. */
    function personalize(box) {
      // Une page encore en cache n'a que l'adresse de la lecture détaillée : on en déduit celle du relais.
      var cfg = window.C127TerraDetailed || {};
      var url = cfg.seance || (cfg.rest ? String(cfg.rest).replace(/c127-palm\/v1\/?$/, 'c127-terra/v1/seance') : '');
      AI = null;
      if (!url || !window.fetch) return;
      var key = 'c127_seance_' + hash(SEED);
      var cached = null;
      try { cached = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (e) {}
      if (cached) { apply(cached, false); return; }
      var note = el('p', 'c127s-writing', '<span aria-hidden="true"></span>Terra écrit ta lecture à partir de tes mesures…');
      note.setAttribute('role', 'status');
      box.insertBefore(note, box.firstChild);
      box.classList.add('is-writing');
      var body = facts(T, D.feats); body.lang = (document.documentElement.lang || 'fr').slice(0, 2);
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (d && d.reading) { try { sessionStorage.setItem(key, JSON.stringify(d.reading)); } catch (e) {} apply(d.reading, true); }
        })
        .catch(function () {})
        .then(function () { note.remove(); box.classList.remove('is-writing'); });
      function apply(r, fade) {
        if (!box.isConnected) return;
        AI = r;
        var put = function (n, txt) { if (n && txt) n.textContent = txt; };
        put(box.querySelector('.c127s-title'), r.title);
        put(box.querySelector('.c127s-elem div > p:not(.c127s-k)'), r.overview);
        ['heart', 'head', 'life', 'fingers'].forEach(function (k) {
          var sct = box.querySelector('.c127s-sec[data-k="' + k + '"]');
          if (!sct || !r[k]) return;
          var ps = sct.querySelectorAll(':scope > p');
          if (!ps.length) return;
          ps[0].textContent = r[k];
          for (var i = 1; i < ps.length; i++) ps[i].remove();
        });
        var t4 = box.querySelector('.c127s-sum__t');
        if (t4 && t4.nextElementSibling && t4.nextElementSibling.tagName === 'P') put(t4.nextElementSibling, r.synthesis);
        var q = box.querySelector('.c127s-q');
        if (q && r.question) { var lab = q.querySelector('span'); q.textContent = ''; if (lab) q.appendChild(lab); q.appendChild(document.createTextNode(r.question)); }
        var mq = finalP.querySelector('.c127s-mantra');
        if (mq && r.mantra) { var ml = mq.querySelector('span'); mq.textContent = ''; if (ml) mq.appendChild(ml); mq.appendChild(document.createTextNode('« ' + r.mantra + ' »')); }
        if (fade) { box.classList.remove('is-ai'); void box.offsetWidth; box.classList.add('is-ai'); }
      }
    }
    function finish() {
      if (!T || !D || !D.feats) { go(3); return; }
      fill(root, T);
      go(6);
      var box = finalP.querySelector('.c127s-reading');
      if (!box) { box = el('article', 'c127s-reading wp-exclude-emoji'); finalP.insertBefore(box, finalP.firstChild); }
      var canScene = !!(S && D.P && D.feats.polys && img && img.src);
      box.innerHTML = reading(T, D.feats, canScene) +
        '<div class="c127s-after"><button type="button" class="c127s-link" data-c127s="fix">Corriger ce que Terra a lu</button>' +
        (document.getElementById('c127-hub-tab-photo') ? '<button type="button" class="c127s-link" data-c127s="deep">Aller plus loin : lecture détaillée</button>' : '') + '</div>' +
        '<p class="c127s-bridge">Et pour aujourd’hui, Terra te confie un geste.</p>';
      if (rsc) { rsc.destroy(); rsc = null; }
      var host = box.querySelector('[data-c127s-scene]');
      if (canScene && host) {
        rsc = S.create({ W: D.W, H: D.H, src: img.src, ratio: num(D.feats.ratio, 2) });
        host.appendChild(rsc.el); rsc.setHand(D.P); rsc.setLines(D.feats.polys);
        setTimeout(function () { replay(); }, 500);
      }
      try { sessionStorage.setItem('c127_palm_reading', JSON.stringify({ at: Date.now(), t: T })); } catch (e) {}
      remember(T);
      personalize(box);
      // Le mantra du jour se teinte de l'élément de la main (le moteur vient de remplir le sien).
      setTimeout(function () {
        var q = finalP.querySelector('[data-mantra]'); if (!q || !q.parentNode) return;
        var old = q.parentNode.querySelector('.c127s-mantra'); if (old) old.remove();
        var m = el('p', 'c127s-mantra', '<span>Pour ta ' + ELEMENT[T.element].name + '</span>');
        m.appendChild(document.createTextNode('« ' + (AI && AI.mantra ? AI.mantra : MANTRA[T.element]) + ' »'));
        q.parentNode.insertBefore(m, q.nextSibling);
      }, 80);
      setTimeout(function () { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
    }
    function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
    function remember(t) {
      // L'application coche « Ta main » de son rituel du jour.
      try { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'c127-terra-reading', element: t.element })); } catch (e) {}
      try { if (window.C127Portes) window.C127Portes.mark('terra'); } catch (e) {}
      // Le rituel de l'accueil du site, et l'élément gardé pour l'Oracle et les Sœurs.
      try {
        var R = JSON.parse(localStorage.getItem('c127_rituel') || '{}') || {}, d = today(), y = new Date(Date.now() - 864e5);
        R.main = d;
        if (R.lastDay !== d) { R.streak = R.lastDay === (y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate()) ? (R.streak || 1) + 1 : 1; R.lastDay = d; }
        localStorage.setItem('c127_rituel', JSON.stringify(R));
        localStorage.setItem('c127_main', JSON.stringify({ element: t.element, heart: t.heart && t.heart.end, head: t.head && t.head.slope, at: Date.now() }));
      } catch (e) {}
    }
    function talkText(who) {
      var E = ELEMENT[T.element], end = T.heart ? T.heart.end : 'entre';
      var seen = 'une ' + E.name + ', ' + (T.heart ? HEART_KEY[T.heart.end] : 'un cœur à écouter') + (T.head ? ', ' + HEAD_KEY[T.head.slope] : '');
      return who === 'naia'
        ? 'Terra vient de lire ma main : ' + seen + '. Sa question m’a touché·e : « ' + ((AI && AI.question) || question(end)) + ' » Ce que je ressens en la lisant : '
        : 'Tu viens de lire ma main : ' + seen + '. Ta question : « ' + ((AI && AI.question) || question(end)) + ' » Voici ce que j’en pense : ';
    }
    function talk(who) {
      if (!T) return;
      var text = talkText(who);
      if (who === 'naia') {
        try { sessionStorage.setItem('c127_palm_talk', JSON.stringify({ to: 'naia', text: text, at: Date.now() })); } catch (e) {}
        location.href = ((window.C127TerraDetailed && window.C127TerraDetailed.naia) || '/naia-gardienne-des-emotions/') + '#parler-a-naia';
        return;
      }
      var tab = document.getElementById('c127-hub-tab-parler'); if (tab) tab.click();
      var chat = document.querySelector('.oschat--terra'), ta = chat && chat.querySelector('textarea');
      if (!ta) return;
      ta.value = text; ta.dispatchEvent(new Event('input', { bubbles: true }));
      setTimeout(function () { chat.scrollIntoView({ behavior: 'smooth', block: 'start' }); ta.focus({ preventScroll: true }); try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {} }, 150);
    }
    function live(k) {
      var sec = finalP.querySelector('.c127s-sec[data-k="' + k + '"]');
      if (sec) { sec.classList.remove('is-live'); void sec.offsetWidth; sec.classList.add('is-live'); }
    }
    function replay() { if (rsc) rsc.play(live); }
    function focusLine(k) {
      Array.prototype.forEach.call(finalP.querySelectorAll('.c127s-sec'), function (x) { x.classList.toggle('is-on', x.getAttribute('data-k') === k); });
      if (rsc) rsc.focus(k);
    }
    ['mouseover', 'focusin'].forEach(function (ev) {
      finalP.addEventListener(ev, function (e) { var sct = e.target.closest && e.target.closest('.c127s-sec'); if (sct) focusLine(sct.getAttribute('data-k')); });
    });
    ['mouseout', 'focusout'].forEach(function (ev) {
      finalP.addEventListener(ev, function (e) { var sct = e.target.closest && e.target.closest('.c127s-sec'); if (sct && !(e.relatedTarget && sct.contains(e.relatedTarget))) focusLine(null); });
    });
    finalP.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c127s],[data-fate]');
      if (!b) {
        var sct = e.target.closest('.c127s-sec');
        if (sct && rsc && rsc.lines[sct.getAttribute('data-k')]) {
          focusLine(sct.getAttribute('data-k'));
          var fig = rsc.el.getBoundingClientRect();
          if (fig.bottom < 0 || fig.top > innerHeight) rsc.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      if (b.hasAttribute('data-fate')) {
        var k = b.getAttribute('data-fate'), sec2 = b.closest('.c127s-sec');
        Array.prototype.forEach.call(sec2.querySelectorAll('[data-fate]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        sec2.querySelector('.c127s-fate-a').textContent = FATE[k].replace(/<[^>]+>/g, '');
        var s = root.querySelector('[data-field="fate_length"]');
        if (s && k !== 'absente' && !s.value) { s.value = k === 'nette' ? 'longue' : 'courte'; s.dispatchEvent(new Event('change', { bubbles: true })); }
        return;
      }
      var a = b.getAttribute('data-c127s');
      if (a === 'replay') { replay(); return; }
      if (a === 'talk-terra' || a === 'talk-naia') { talk(a === 'talk-naia' ? 'naia' : 'terra'); return; }
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
