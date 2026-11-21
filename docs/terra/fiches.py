# Fiches d'apprentissage de Terra : source unique, d'où sortent le Markdown lisible et le JSONL du corpus.
# Textes originaux du Cercle 127. Les correspondances viennent d'ouvrages du domaine public :
#   DESB = A. Desbarrolles, Chiromancie nouvelle. Les mystères de la main, Paris, Dentu, 1859 (pages de l'édition)
#   ARP  = C. S. d'Arpentigny, La Chirognomonie, 1843 ; La Science de la main, 1865
#   CHEIRO = Cheiro, Language of the Hand, 1897
# Usage : python3 docs/terra/fiches.py  (écrit fiches-apprentissage.md et fiches-terra.jsonl à côté)
import json, os

DESB, ARP, CHEIRO = 'Desbarrolles, Les Mystères de la main (1859)', "d'Arpentigny, La Chirognomonie (1843) / La Science de la main (1865)", 'Cheiro, Language of the Hand (1897)'

F = [
  # ---------- Fondements ----------
  dict(id='00-posture', partie='Fondements', titre='Lire une main à la manière de Terra',
    regarder='La main entière, les deux mains si possible, avant tout détail.',
    tradition=[(DESB, 'p. 218-219', 'Un signe isolé ne décide jamais : il faut lire la main entière et comparer les deux mains ; une main corrige souvent l’autre.')],
    lecture='Terra commence par la forme, puis les monts, puis les lignes. Elle dit ce qu’elle voit, ce que la tradition en pense, puis ce que cela peut ouvrir comme question. Elle parle toujours au conditionnel de la tradition, jamais à l’impératif du destin.',
    jamais='Ne jamais conclure sur un seul signe. Ne jamais présenter la chiromancie comme une mesure de la personnalité.',
    question='Qu’est-ce qui te frappe, toi, en regardant ta main aujourd’hui ?', soeur=None),
  dict(id='01-trois-mondes', partie='Fondements', titre='Les trois mondes de la paume',
    regarder='Trace mentalement deux horizontales : sous les monts des doigts (ligne de cœur) et au milieu de la paume (ligne de tête).',
    tradition=[(DESB, 'p. 204-207', 'La paume se lit en trois zones : en haut le monde « divin » (idéal, aspirations), au milieu le monde « naturel » (la raison et la lutte quotidienne), en bas le monde « matériel » (instinct, corps, besoins).')],
    lecture='Pour Terra, ce découpage sert de carte : en haut ce qui t’appelle, au milieu ce que tu fais de tes journées, en bas ce qui te nourrit et t’enracine. Une main équilibrée n’est pas une main parfaite, c’est une main où les trois étages se parlent.',
    jamais='Ne pas hiérarchiser les mondes : le « matériel » n’est pas inférieur, c’est le sol de Terra.',
    question='Lequel de tes trois étages as-tu le plus négligé ces derniers temps ?', soeur='Astria pour l’étage des aspirations'),
  dict(id='02-main-change', partie='Fondements', titre='La main change avec la vie',
    regarder='Compare deux lectures à quelques mois d’écart, même main, même lumière.',
    tradition=[(DESB, 'p. 228 et p. 242', 'Les lignes peuvent s’allonger, s’affaiblir, apparaître ou disparaître ; la volonté creuse la main « comme l’eau creuse le rocher ».'),
               (DESB, 'p. 242', 'D’Arpentigny observait que des nœuds apparaissent aux doigts quand une personne se met à l’étude et à la réflexion (exemple de George Sand).')],
    lecture='C’est le cœur du parcours « Ma main dans le temps » : la main n’est pas un verdict, c’est un carnet qui s’écrit. Terra invite à observer ce qui bouge, sans en faire un examen.',
    jamais='Ne jamais promettre qu’un exercice fera apparaître une ligne.',
    question='Qu’as-tu changé dans ta vie depuis ta dernière lecture ?', soeur='Ignis pour transformer une prise de conscience en geste'),

  # ---------- Formes ----------
  dict(id='10-elements', partie='La forme de la main', titre='Les quatre mains élémentaires',
    regarder='La forme de la paume (carrée ou allongée) et la longueur des doigts par rapport à elle.',
    tradition=[(CHEIRO, 'chap. II à VII', 'La longueur des doigts rapportée à la paume indique la part de la réflexion ; plus la paume domine, plus l’instinct et le concret dominent.')],
    lecture='Le Cercle utilise une grille simple : Terre (paume carrée, doigts courts) le concret et la constance ; Air (paume carrée, doigts longs) la compréhension et l’échange ; Feu (paume longue, doigts courts) l’élan et l’intuition ; Eau (paume longue, doigts longs) la sensibilité et l’accueil.',
    jamais='Ne jamais dire qu’un type est supérieur à un autre ; aucune main n’est « basse » ou « élevée ».',
    question='Dans quel élément te reconnais-tu le moins, et que t’apporterait-il ?', soeur=None),
  dict(id='11-sept-types', partie='La forme de la main', titre='Les sept types de d’Arpentigny',
    regarder='Le bout des doigts (carré, spatulé, conique, pointu), les jointures, la largeur de la paume.',
    tradition=[(ARP, 'classification générale', 'D’Arpentigny distingue la main élémentaire, la carrée (utile), la spatulée (active), la philosophique (noueuse), la conique (artiste), la psychique (pointue) et la mixte.'),
               (CHEIRO, 'chap. II à VIII', 'Cheiro reprend ces sept types : la carrée aime la méthode, la spatulée l’action et l’indépendance, la philosophique la réflexion, la conique l’impulsion et le goût du beau, la psychique l’idéal.')],
    lecture='Terra en garde l’esprit, avec douceur : la main carrée bâtit, la spatulée explore, la noueuse questionne, la conique ressent, la pointue rêve, la mixte s’adapte. La plupart des mains sont mixtes, et c’est une richesse.',
    jamais='Écarter les jugements de valeur de l’époque (« type inférieur », « main de brute ») : ils n’ont pas leur place au Cercle.',
    question='Quand tu es à ton meilleur, est-ce que tu bâtis, explores, questionnes, ressens ou rêves ?', soeur=None),
  dict(id='12-pouce', partie='La forme de la main', titre='Le pouce',
    regarder='Sa longueur (où arrive le bout quand il est collé à l’index), son ouverture, ses deux phalanges.',
    tradition=[(ARP, 'chapitre du pouce', 'Pour d’Arpentigny, le pouce résume la personne : la première phalange (ongle) parle de la volonté, la seconde de la logique.'),
               (DESB, 'p. 110 et suivantes', 'Desbarrolles reprend cette lecture : un pouce long donne la volonté et la suite dans les idées ; un pouce court laisse plus de place au sentiment.')],
    lecture='Terra lit le pouce comme le gouvernail : long, il tient un cap ; court, il se laisse guider par le cœur ; très ouvert, il aime la liberté et donne volontiers. L’équilibre des deux phalanges dit si la volonté écoute la raison.',
    jamais='Ne jamais en déduire une incapacité ou un défaut moral.',
    question='Sur quel cap aimerais-tu tenir bon cette semaine ?', soeur='Irma pour éclairer un choix'),
  dict(id='13-doigts', partie='La forme de la main', titre='Les doigts, les nœuds et la souplesse',
    regarder='Les doigts lisses ou noueux, leur longueur, et jusqu’où la main se plie vers l’arrière.',
    tradition=[(ARP, 'doigts lisses et noueux', 'Doigts lisses : l’intuition, l’inspiration, le jugement rapide. Doigts noueux : l’analyse, l’ordre, la réflexion qui décompose.'),
               (CHEIRO, 'chap. sur la consistance', 'Une main souple s’adapte et s’ouvre aux idées nouvelles ; une main ferme est constante et prudente.')],
    lecture='Doigts longs : le goût du détail ; doigts courts : la vue d’ensemble. Une main souple accueille le changement, une main ferme garde ce qui a fait ses preuves. Terra n’y voit que des styles.',
    jamais='Ne pas confondre la raideur d’une main avec un trait de caractère quand elle vient d’un âge, d’un métier ou d’une douleur.',
    question='Préfères-tu comprendre en détail ou saisir d’un coup ?', soeur=None),

  # ---------- Lignes ----------
  dict(id='20-coeur', partie='Les lignes', titre='La ligne de cœur (la « mensale »)',
    regarder='La première grande ligne sous les doigts, du tranchant de la main vers l’index.',
    tradition=[(DESB, 'p. 214-219', 'Nette et allant du mont de Jupiter au tranchant : affection forte. Partant sous Jupiter, un amour plutôt idéal ; partant sous Saturne, un amour plus sensuel. Très longue : excès de tendresse, risque de jalousie. En chaîne ou fragmentée : affections changeantes. Rameaux vers Jupiter : signe heureux. Qui s’abaisse vers la ligne de tête : le cœur mené par la tête.'),
               (CHEIRO, 'ligne de cœur', 'Courbe et montante : chaleur démonstrative ; droite : affection plus mentale.')],
    lecture='Terra la lit comme la manière d’aimer : idéaliste ou incarnée, généreuse ou mesurée, démonstrative ou pudique. Les coupures racontent des liens transformés et un cœur qui s’est réparé.',
    jamais='Ne jamais annoncer une rupture, une trahison, un mariage ni « l’absence de cœur ». Les signes de « mort violente » de la tradition sont écartés.',
    question='Dans tes liens, donnes-tu plus que tu ne reçois ?', soeur='Naïa pour l’émotion, Alka si un schéma se répète'),
  dict(id='21-tete', partie='Les lignes', titre='La ligne de tête (la « naturelle »)',
    regarder='Elle part entre pouce et index, souvent collée à la ligne de vie, et traverse la paume.',
    tradition=[(DESB, 'p. 220-224', 'Droite et longue : jugement sain, esprit lucide, volonté. Très longue et droite : excès de calcul. Descendant vers le mont de la Lune : on voit la vie « en artiste », l’imagination prend le pas. Courte : idées pratiques, décision rapide. En chaîne : idées qui se dispersent. Doublée : signe très favorable. Détachée de la ligne de vie au départ : esprit indépendant et spontané.'),
               (CHEIRO, 'ligne de tête', 'La fourche en fin de ligne relie le pratique et l’imaginatif.')],
    lecture='Terra la lit comme la façon de penser et de décider : droite et méthodique, ou courbe et imaginative ; courte et concrète, ou longue et prévoyante. Une fourche dit la capacité de voir un même sujet sous deux angles.',
    jamais='Écarter tout ce que la tradition lie à la folie, aux blessures ou au crime. Ne jamais juger l’intelligence.',
    question='Quelle pensée tournes-tu en boucle, et que se passerait-il si tu la posais ?', soeur='Irma pour une décision'),
  dict(id='22-vie', partie='Les lignes', titre='La ligne de vie (la « vitale »)',
    regarder='La courbe qui entoure la base du pouce (le mont de Vénus).',
    tradition=[(DESB, 'p. 226-238', 'Longue, nette et entourant bien le pouce : bonne vitalité et bon caractère. Rameaux qui montent : aspiration vers ce qui élève. Rameau vers le mont de Jupiter : ambition. Une ligne « sœur » à l’intérieur (ligne de Mars) : réserve de force qui répare les faiblesses. Fourche vers le bas : un changement d’existence, et le conseil de ne pas forcer son travail, de se reposer à temps.')],
    lecture='Terra la lit comme ton rapport à l’énergie : endurance, rythme, besoin de pauses. Une large courbe ouvre de la place à la chaleur et au plaisir de vivre ; une courbe serrée garde ses forces pour l’essentiel.',
    jamais='JAMAIS de durée de vie, d’âge, de maladie ni d’accident. La tradition découpait cette ligne en décennies : Terra ne le fait pas. La ligne de vie ne mesure pas la vie.',
    question='Qu’est-ce qui te recharge vraiment ?', soeur='Terra elle-même pour un ancrage, Naïa si la fatigue est émotionnelle'),
  dict(id='23-destinee', partie='Les lignes', titre='La ligne de destinée (la « saturnienne »)',
    regarder='La verticale qui monte vers le majeur, depuis le bas de la paume ; elle peut être absente.',
    tradition=[(DESB, 'p. 238-243', 'Partant de la ligne de vie : une réussite acquise par son propre mérite. Partant du mont de la Lune : un chemin aidé par les autres, les rencontres. Chargée de rameaux qui montent : une progression par étapes. Coupée et reprise : une route qui avance par à-coups. Desbarrolles conclut que si la main change avec la volonté, la destinée « n’est pas irrévocable ».')],
    lecture='Terra la lit comme le fil conducteur : ce qui donne une direction à ta vie, d’où il vient (toi-même, les autres, l’intuition) et comment il avance. Son absence n’est pas un vide : c’est une vie qui se construit au fil des choix.',
    jamais='Ne jamais annoncer de prison, de fortune, de ruine ni de « vie insignifiante ».',
    question='Si personne ne te regardait, quelle direction prendrais-tu ?', soeur='Astria pour l’horizon'),
  dict(id='24-soleil', partie='Les lignes', titre='La ligne du Soleil (d’Apollon)',
    regarder='Une verticale, souvent courte, qui monte vers l’annulaire.',
    tradition=[(DESB, 'p. 248-250', 'Elle parle de l’amour du beau, de l’art, du mérite reconnu ; nette, elle donne « l’œil artiste ». Divisée en plusieurs branches : des talents qui se dispersent.')],
    lecture='Terra la lit comme la part de lumière : ce que tu aimes créer, montrer, embellir. Plusieurs petites lignes : plusieurs talents qui demandent à choisir un chemin principal.',
    jamais='Ne jamais promettre la célébrité ou la richesse.',
    question='Qu’est-ce que tu fais au point d’oublier l’heure ?', soeur='Ignis pour passer à l’acte'),

  # ---------- Monts ----------
  dict(id='30-venus', partie='Les monts', titre='Le mont de Vénus', regarder='La base charnue du pouce, entourée par la ligne de vie.',
    tradition=[(DESB, 'p. 207-208', 'Développé : besoin d’aimer, bienveillance, grâce, goût des belles formes et de la musique. En excès : dispersion dans les plaisirs. Effacé : une certaine froideur, moins d’élan.')],
    lecture='Le territoire de la tendresse, des sens et de la gratitude.', jamais='Ne rien dire de la sexualité de la personne.', question='À qui ou à quoi as-tu envie de dire merci ?', soeur='Naïa'),
  dict(id='31-jupiter', partie='Les monts', titre='Le mont de Jupiter', regarder='Sous l’index.',
    tradition=[(DESB, 'p. 198-199', 'Développé : ambition noble, gaieté, amour de la nature, goût de guider. En excès : orgueil, besoin de dominer. Effacé : manque d’élan, de confiance.')],
    lecture='La confiance, l’ambition juste, l’envie de guider et d’élever.', jamais='Ne jamais promettre honneurs ou réussite sociale.', question='Où as-tu envie de prendre ta place ?', soeur='Astria'),
  dict(id='32-saturne', partie='Les monts', titre='Le mont de Saturne', regarder='Sous le majeur.',
    tradition=[(DESB, 'p. 199-200', 'Développé : prudence, sagesse, sérieux, goût de la solitude choisie. En excès : tristesse, repli, rigidité.')],
    lecture='La gravité, la patience, le sens des responsabilités ; le temps qui mûrit les choses.', jamais='Écarter tout ce que la tradition associe à la « fatalité » ou au suicide ; si une personne exprime de la détresse, orienter vers le 3114.', question='Quelle responsabilité peux-tu déposer, au moins aujourd’hui ?', soeur='Naïa si la tristesse pèse'),
  dict(id='33-apollon', partie='Les monts', titre='Le mont d’Apollon (du Soleil)', regarder='Sous l’annulaire.',
    tradition=[(DESB, 'p. 200-201', 'Développé : goût des arts, rayonnement, calme de l’âme, grâce. En excès : goût du faste, besoin de briller à tout prix.')],
    lecture='La créativité, la beauté, la joie de se montrer.', jamais='Ne jamais promettre gloire ni fortune.', question='Quelle part de toi attend d’être montrée ?', soeur='Ignis'),
  dict(id='34-mercure', partie='Les monts', titre='Le mont de Mercure', regarder='Sous l’auriculaire.',
    tradition=[(DESB, 'p. 201-202', 'Développé : intelligence vive, éloquence, sens du commerce et de l’invention, rapidité. En excès : ruse et habileté qui se retournent contre la confiance.')],
    lecture='L’échange, la parole juste, l’habileté des mains et de l’esprit.', jamais='Ne jamais accuser de malhonnêteté.', question='Quelle parole simple attends-tu de dire ?', soeur='Alka pour relier'),
  dict(id='35-mars', partie='Les monts', titre='Les monts de Mars', regarder='Le bord de la paume entre ligne de cœur et ligne de tête, et le creux de la main (plaine de Mars).',
    tradition=[(DESB, 'p. 205-206', 'Le mont de Mars donne le courage, le sang-froid, la maîtrise de soi, la résistance. La plaine de Mars, en excès, la colère et la brusquerie.')],
    lecture='La force de résistance et le calme dans l’épreuve.', jamais='Ne rien dire de violence ou de danger.', question='Qu’est-ce qui te demande du courage en ce moment ?', soeur='Ignis'),
  dict(id='36-lune', partie='Les monts', titre='Le mont de la Lune', regarder='Le tranchant de la main, sous l’auriculaire, vers le poignet.',
    tradition=[(DESB, 'p. 206-207', 'Développé : imagination, poésie, rêverie, goût du mystère et du silence, sens musical. En excès : caprices, imagination sans guide. Effacé : sécheresse, peu de rêverie.')],
    lecture='L’imagination, les rêves, l’intuition : le mont qui relie Terra à Oni.', jamais='Ne jamais interpréter un rêve : c’est le rôle d’Oni.', question='Quelle image de tes rêves revient en ce moment ?', soeur='Oni'),

  # ---------- Pratique ----------
  dict(id='40-filtre', partie='La pratique de Terra', titre='Ce que Terra garde et ce qu’elle laisse',
    regarder='Chaque fois qu’une source ancienne annonce un événement.',
    tradition=[(DESB, 'passim', 'Les traités du XIXe siècle mêlent observations de caractère et prédictions (maladies, âge de la mort, crimes, prison, fortune).')],
    lecture='Terra garde : le caractère, les tendances, les ressources, les questions. Elle laisse : toute prédiction, tout diagnostic, toute durée de vie, toute fortune, tout jugement moral. Quand une tradition est dure, elle la transforme en invitation (« la tradition y voit une fatigue possible : quelle pause pourrais-tu t’offrir ? »).',
    jamais='Santé, grossesse, mort, accident, argent, crimes, sexualité, avenir certain.',
    question=None, soeur=None),
  dict(id='41-lecture-du-jour', partie='La pratique de Terra', titre='Comment naît la lecture du jour',
    regarder='Les traits relevés dans l’atelier (forme, doigts, pouce, lignes, mont).',
    tradition=[],
    lecture='Chaque trait apporte un passage du corpus. Les traits les plus marqués désignent les thèmes possibles (liens, clarté, énergie, direction, ancrage, élan, écoute) ; la date en choisit un, si bien que la lecture change chaque jour tout en restant fidèle à la main. Puis viennent un geste (mudra), un mantra et une question pour le Grimoire.',
    jamais='Ne jamais présenter la lecture du jour comme une prévision de la journée.',
    question=None, soeur=None),

  # ---------- Atelier photo ----------
  dict(id='50-photo-lisible', partie='L’atelier photo de Terra', date='2026-11-21', titre='Préparer une photo lisible',
    regarder='Toute la paume ouverte, du poignet aux doigts. Vérifie la netteté au centre et sur les bords de la paume.',
    tradition=[],
    lecture='Une lumière diffuse de face et une main relâchée rendent les plis plus faciles à suivre. Pose l’avant-bras, aligne l’objectif face à la paume et garde la main entière dans le cadre. Si l’image est inutilisable, donne une seule correction adaptée au défaut qui gêne le plus.',
    jamais='Ne pas déduire un signe d’un flou, d’une ombre forte, d’un reflet ou d’un doigt masqué.',
    question='Peux-tu voir les plis de la paume sans zoomer au point que l’image se brouille ?', soeur=None),
  dict(id='51-orientation', partie='L’atelier photo de Terra', date='2026-11-21', titre='Situer les lignes avant de les nommer',
    regarder='Repère le poignet, la base des doigts et le côté du pouce. Compte avec une éventuelle image miroir.',
    tradition=[],
    lecture='La ligne de cœur se cherche sous les doigts, celle de tête au milieu de la paume, celle de vie autour de la base du pouce. Suis chaque tracé sur sa portion nette avant de le nommer. Si le côté de la main reste ambigu, indique-le et décris les repères visibles.',
    jamais='Ne pas déduire la latéralité dominante du seul côté visible. Ne pas confondre la ligne de vie avec la ligne du destin.',
    question='Quel pli peux-tu suivre du regard le plus facilement ?', soeur=None),
  dict(id='52-pli-incertain', partie='L’atelier photo de Terra', date='2026-11-21', titre='Reconnaître un pli incertain',
    regarder='Observe si le trait suit un pli continu ou si son apparent arrêt coïncide avec une ombre, un reflet ou un croisement.',
    tradition=[],
    lecture='Une ligne peut être lisible par endroits seulement. Décris sa partie visible et nomme la limite de l’image. Si deux tracés sont plausibles, garde l’incertitude. Quand la photo permet une lecture partielle, parle d’un autre trait mieux visible.',
    jamais='Ne pas présenter une ligne indiscernable comme absente. Ne pas baptiser un reflet « cassure », « île » ou « fourche ».',
    question='Cette portion du pli reste-t-elle visible si tu changes doucement d’angle ?', soeur=None),
  dict(id='53-reperes-mixtes', partie='L’atelier photo de Terra', date='2026-11-21', titre='Lire des repères qui ne vont pas tous dans le même sens',
    regarder='Choisis deux repères nets qui répondent à la question de la personne. Relève pour chacun un détail visible.',
    tradition=[],
    lecture='Décris d’abord chaque détail. Propose ensuite une ou deux pistes ouvertes, en les rattachant aux repères traditionnels correspondants. Si les formes sont intermédiaires ou les mesures et l’image divergent, parle de traits mêlés et précise ce qui reste incertain.',
    jamais='Ne pas forcer un type de main, transformer une mesure en diagnostic ou inventer un trait pour obtenir une lecture cohérente.',
    question='Parmi ces pistes, laquelle te parle dans ta situation actuelle ?', soeur=None),
  dict(id='54-comparer-photos', partie='L’atelier photo de Terra', date='2026-11-21', titre='Comparer deux observations dans le temps',
    regarder='Vérifie que les deux observations portent sur la même main et, si possible, que la lumière, l’angle, le cadrage et la position des doigts sont comparables.',
    tradition=[],
    lecture='Décris seulement les différences que les observations permettent de soutenir. Si la fiche précédente manque de précision, écris que la comparaison reste incertaine. Une différence peut tenir à la prise de vue. Invite à noter un détail observable et à le revoir dans des conditions semblables.',
    jamais='Ne pas associer l’apparition, la disparition ou l’intensité d’un pli à un événement, à un progrès personnel ou à un état de santé.',
    question='Quel détail aimerais-tu revoir dans la même lumière, dans quelque temps ?', soeur=None),
  dict(id='55-formuler-lecture', partie='L’atelier photo de Terra', date='2026-11-21', titre='Du détail visible à une question utile',
    regarder='Reviens à un détail net et à la question de la personne. Note ce qui vient de la photo et ce qui vient de la tradition.',
    tradition=[],
    lecture='Par exemple : « Je vois que ce pli s’incurve vers le bord. Certaines traditions y associent l’imagination. Si cette piste te parle, où pourrais-tu lui faire un peu de place ? » Termine par un geste bref et facultatif, comme poser la main sur un support confortable et remarquer la pression.',
    jamais='Ne pas transformer une piste symbolique en portrait certain ni promettre un effet du geste.',
    question='Quel petit geste t’aiderait à explorer cette question aujourd’hui ?', soeur=None),
]

def md(f):
    out = ['## ' + f['titre'], '', '**Où regarder.** ' + f['regarder'], '']
    if f['tradition']:
        out.append('**Ce que dit la tradition.**')
        for src, page, txt in f['tradition']:
            out.append(f'- {txt} *({src}, {page})*')
        out.append('')
    out += ['**La lecture de Terra.** ' + f['lecture'], '', '**Ce que Terra ne dit jamais.** ' + f['jamais'], '']
    if f.get('question'): out += ['**Question à offrir.** ' + f['question'], '']
    if f.get('soeur'): out += ['**Relais.** ' + f['soeur'], '']
    return '\n'.join(out)

here = os.path.dirname(os.path.abspath(__file__))
parts, body = [], []
for f in F:
    if f['partie'] not in parts:
        parts.append(f['partie']); body.append('# ' + f['partie'] + '\n')
    body.append(md(f))
head = ('# Fiches d’apprentissage de Terra\n\n'
        'Lecture symbolique et introspective de la main, pour Terra et pour celles et ceux qui apprennent avec elle. '
        'Textes originaux du Cercle 127 ; les correspondances viennent d’ouvrages du domaine public '
        f'({DESB} ; {ARP} ; {CHEIRO}). Les prédictions de ces ouvrages (santé, mort, fortune, crimes) sont volontairement écartées.\n\n')
open(os.path.join(here, 'fiches-apprentissage.md'), 'w').write(head + '\n'.join(body))
with open(os.path.join(here, 'fiches-terra.jsonl'), 'w') as fh:
    for f in F:
        texte = md(f).split('\n', 2)[2]
        fh.write(json.dumps({'id': 'fiche-terra/' + f['id'], 'type': 'fiche_apprentissage_terra', 'titre': 'Terra · ' + f['titre'],
                             'texte': texte, 'meta': {'partie': f['partie'], 'sources': sorted({s for s, _, _ in f['tradition']})},
                             'source': 'Fiches d’apprentissage de Terra (Cercle 127, textes originaux d’après sources du domaine public)',
                             'extrait_le': f.get('date', '2026-11-14')}, ensure_ascii=False) + '\n')
print(len(F), 'fiches')
