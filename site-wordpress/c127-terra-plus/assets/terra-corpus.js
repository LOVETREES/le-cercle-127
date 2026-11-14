/* Corpus de Terra : la lecture symbolique de la main, trait par trait.
   Textes originaux du Cercle 127, écrits dans la voix de Terra. Ils reprennent les correspondances
   de la tradition chiromantique du XIXe siècle, aujourd'hui dans le domaine public :
   C. S. d'Arpentigny (La Chirognomonie, 1843), A. Desbarrolles (Les Mystères de la main, 1859-1862),
   Cheiro (Language of the Hand, 1894).
   Règles de Terra : une tradition symbolique, jamais une mesure ; ni santé, ni durée de vie,
   ni fortune, ni avenir certain ne se déduisent des lignes. */
(function () {
  var C = {
    version: '1.0',
    sources: {
      arp: 'd’après la chirognomonie de d’Arpentigny (1843)',
      desb: 'd’après la chiromancie de Desbarrolles (1859)',
      cheiro: 'd’après Cheiro (1894)',
      terra: 'lecture du Cercle 127'
    },

    /* Les quatre mains de la tradition élémentaire (forme de la paume × longueur des doigts). */
    element: {
      terre: [
        'Ta main a la carrure de la Terre : paume pleine, doigts qui ne s’étirent pas pour rien. La tradition y voit quelqu’un qui comprend en faisant, et qui croit ce qui pousse sous ses yeux.',
        'Une main de Terre : solide, posée, faite pour toucher le réel. Ce genre de main n’aime pas les promesses vagues ; il lui faut quelque chose à tenir.'
      ],
      air: [
        'Paume carrée, doigts longs : la tradition parle d’une main d’Air. L’esprit relie, compare, met des mots ; tes mains pensent presque autant que ta tête.',
        'Ta main est une main d’Air : une base stable et des doigts qui cherchent plus loin. Comprendre est pour toi une façon de respirer.'
      ],
      feu: [
        'Paume allongée, doigts plus courts qu’elle : c’est la main de Feu. On y lit l’élan, l’intuition qui part avant l’explication, l’envie que les choses bougent.',
        'Une main de Feu : le geste devance souvent le mot. Il y a de la chaleur dans cette forme, et le besoin de sentir que la vie avance.'
      ],
      eau: [
        'Paume longue et doigts fins : la main d’Eau. La tradition y lit une grande perméabilité ; tu captes les ambiances avant qu’on te les nomme.',
        'Ta main a la forme de l’Eau : longue, souple dans ses lignes. Elle reçoit beaucoup, et elle a besoin de rives pour ne pas tout porter.'
      ]
    },

    /* Les grandes lignes : chaque longueur et chaque aspect a sa lecture. */
    lines: {
      heart: {
        theme: 'liens',
        name: 'la ligne de cœur',
        length: {
          courte: 'Ta ligne de cœur s’arrête tôt : selon Desbarrolles, l’affection se dit alors en actes plus qu’en déclarations. Tu montres ton attachement par ce que tu fais pour l’autre.',
          moyenne: 'Ta ligne de cœur trouve une longueur d’équilibre : de l’élan vers les autres, sans s’y dissoudre. C’est la ligne de ceux qui savent rester eux-mêmes dans un lien.',
          longue: 'Ta ligne de cœur traverse largement la paume : la tradition y voit une affectivité généreuse, idéaliste, qui donne beaucoup. Sa leçon est de recevoir autant qu’elle offre.'
        },
        aspect: {
          fine: 'Tracée finement, elle parle d’une sensibilité qui se protège : tu ressens beaucoup, mais tu choisis à qui tu le montres.',
          profonde: 'Profondément gravée, elle dit des attachements durables et entiers. Ce que tu aimes, tu l’aimes longtemps.',
          courbe: 'Sa courbe qui monte vers les doigts est, chez Cheiro, le signe d’une chaleur qui s’exprime : tu as besoin que l’affection se voie et se dise.',
          droite: 'Droite et horizontale, elle est lue comme un cœur qui passe par la réflexion : tu aimes avec lucidité, parfois avec réserve.',
          discontinue: 'Ses interruptions racontent des passages : des liens qui se sont transformés, et un cœur qui a appris à se réparer.',
          'bifurquée': 'Elle se divise en fin de course : la tradition y voit un cœur capable de tenir ensemble raison et émotion.'
        }
      },
      head: {
        theme: 'clarte',
        name: 'la ligne de tête',
        length: {
          courte: 'Ta ligne de tête est courte : un esprit qui va à l’essentiel, qui décide vite et préfère le concret aux longs détours.',
          moyenne: 'Ta ligne de tête a une longueur mesurée : la pensée sait s’arrêter quand elle a compris assez pour agir.',
          longue: 'Ta ligne de tête s’étend loin : pour Desbarrolles, c’est la marque d’un esprit qui pèse, prévoit, envisage chaque possibilité, au risque de trop retourner les choses.'
        },
        aspect: {
          fine: 'Fine, elle évoque une pensée délicate et nuancée, qui a besoin de calme pour se déployer.',
          profonde: 'Nette et profonde, elle parle d’une concentration solide : quand tu t’attaches à une idée, tu la creuses.',
          courbe: 'En descendant vers le mont de la Lune, elle tourne la pensée vers l’imagination : tes idées naissent d’images avant de devenir des plans.',
          droite: 'Droite à travers la paume, elle est lue comme un esprit pratique et méthodique, qui aime que les choses tiennent debout.',
          discontinue: 'Ses coupures signalent des changements de cap dans ta façon de penser : tu as su revoir tes certitudes.',
          'bifurquée': 'La « fourche de l’écrivain » : la tradition y voit une pensée qui sait regarder un même sujet sous deux angles.'
        }
      },
      life: {
        theme: 'energie',
        name: 'la ligne de vie',
        length: {
          courte: 'Ta ligne de vie s’arrête tôt sur la paume. La tradition est claire : elle ne mesure aucune durée. On la lit comme un rythme qui préfère les élans courts et les vraies pauses.',
          moyenne: 'Ta ligne de vie entoure le pouce sur une longueur moyenne : une énergie qui se dose, qui sait quand donner et quand récupérer.',
          longue: 'Ta ligne de vie descend loin autour du pouce : on y lit une vitalité de fond, de l’endurance, le goût de durer dans ce que tu entreprends.'
        },
        aspect: {
          fine: 'Fine, elle invite à ménager tes ressources : ton énergie est réelle, mais elle aime être écoutée.',
          profonde: 'Profonde et nette, elle parle d’une présence robuste : tu as de quoi traverser les saisons chargées.',
          courbe: 'Sa large courbe qui ouvre le mont de Vénus est lue comme une chaleur vitale tournée vers les autres et vers le plaisir de vivre.',
          droite: 'Plus droite, serrée contre le pouce, elle évoque une énergie prudente, qui se garde pour l’essentiel.',
          discontinue: 'Ses interruptions sont lues comme des changements de rythme ou de décor : tu as connu des recommencements, et tu en es sortie ou sorti.',
          'bifurquée': 'Elle se divise vers le bas : la tradition y voit le goût du mouvement, des horizons qui changent.'
        }
      },
      fate: {
        theme: 'direction',
        name: 'la ligne de destinée',
        length: {
          courte: 'Ta ligne de destinée est brève : selon la tradition, ta direction s’est dessinée tard ou se construit par étapes, au fil de tes propres choix.',
          moyenne: 'Ta ligne de destinée monte à mi-paume : une direction qui se précise à mesure que tu avances.',
          longue: 'Ta ligne de destinée remonte loin vers le majeur : on y lit un fil conducteur, une vocation qui t’accompagne depuis longtemps.'
        },
        aspect: {
          fine: 'Discrète, elle rappelle que ton chemin n’a pas besoin d’être spectaculaire pour être le tien.',
          profonde: 'Bien marquée, elle parle d’une volonté de suivre ton propre axe, même quand le monde propose autre chose.',
          courbe: 'Partie du mont de la Lune, elle est lue comme une direction nourrie par les autres, les rencontres et l’intuition.',
          droite: 'Droite comme un axe, elle évoque la constance : tu avances quand tu sais pourquoi.',
          discontinue: 'Ses coupures sont lues comme des bifurcations : des changements de route choisis ou subis, qui t’ont appris à repartir.',
          'bifurquée': 'Elle se partage : deux élans coexistent en toi, et ce n’est pas une faute de ne pas avoir encore choisi.'
        }
      }
    },

    /* Le pouce : la volonté et la logique chez d'Arpentigny. */
    thumb: {
      court: 'Ton pouce est plutôt court : d’Arpentigny y lisait une volonté qui passe par le cœur plus que par le calcul.',
      moyen: 'Ton pouce a une longueur d’équilibre : la volonté et la logique se répondent sans que l’une écrase l’autre.',
      long: 'Ton pouce est long : pour d’Arpentigny, le pouce est l’homme même, et un pouce long dit une volonté qui sait tenir un cap.',
      'très ouvert par rapport à la paume': 'Ton pouce s’écarte largement de la main : la tradition y voit une nature indépendante et généreuse, qui n’aime pas être enfermée.'
    },

    /* Les doigts et la souplesse de la main. */
    fingers: {
      'courts par rapport à la paume': 'Tes doigts plus courts que la paume saisissent l’ensemble avant le détail : tu vois vite la forme d’une situation.',
      'proportionnés': 'Tes doigts équilibrés avec la paume parlent d’un juste milieu entre l’idée et le geste.',
      'longs par rapport à la paume': 'Tes doigts longs aiment le détail et la nuance : tu prends le temps de comprendre comment les choses sont faites.'
    },
    flexibility: {
      'plutôt souple': 'Ta main se plie volontiers vers l’arrière : on y lit une capacité d’adaptation, une ouverture aux idées nouvelles.',
      'intermédiaire': 'Ta main garde une souplesse mesurée : ouverte sans être sans forme.',
      'plutôt ferme': 'Ta main est ferme : elle parle de prudence, de fidélité à ce qui a fait ses preuves.'
    },

    /* Les monts, nommés d'après les planètes par la tradition. */
    mounts: {
      'Vénus': { theme: 'liens', t: 'Le mont de Vénus, à la base du pouce, est le territoire de la tendresse, des sens et de la gratitude.' },
      'Jupiter': { theme: 'direction', t: 'Le mont de Jupiter, sous l’index, parle de la confiance, de l’ambition juste et du désir de guider.' },
      'Saturne': { theme: 'ancrage', t: 'Le mont de Saturne, sous le majeur, est celui de la gravité, de la solitude choisie et du sens des responsabilités.' },
      'Apollon': { theme: 'elan', t: 'Le mont d’Apollon, sous l’annulaire, est lié à la créativité, à la beauté et à la joie de se montrer.' },
      'Mercure': { theme: 'clarte', t: 'Le mont de Mercure, sous l’auriculaire, parle de l’échange, de la parole juste et de l’habileté.' },
      'Lune': { theme: 'ecoute', t: 'Le mont de la Lune, sur le tranchant de la main, est celui de l’imagination, des rêves et de l’intuition.' }
    },
    relief: {
      'peu marqué': 'Il est discret chez toi : une qualité qui ne demande qu’à être nourrie.',
      'modéré': 'Il est présent sans excès : une ressource sur laquelle tu peux compter.',
      'très marqué': 'Il est bien bombé : la tradition y voit une force vive, qui gagne à être canalisée.'
    },

    /* Les thèmes du jour : un geste, des mantras, des questions. */
    themes: {
      liens: {
        label: 'tes liens',
        mudras: ['anjali', 'padma'],
        mantras: ['J’ouvre sans me perdre. Je protège sans me fermer.', 'Je reçois autant que je donne.', 'Mes liens ont le droit d’avoir des rives.'],
        questions: ['Quelle limite rendrait aujourd’hui une relation plus juste ?', 'À qui ai-je envie de dire merci, et qu’est-ce qui me retient ?', 'Dans quel lien est-ce que je donne plus que je ne reçois ?']
      },
      clarte: {
        label: 'ta clarté',
        mudras: ['jnana', 'buddhi'],
        mantras: ['Je rassemble mon attention là où je veux vivre.', 'Une seule chose à la fois, et elle suffit.', 'Je pense, puis je pose.'],
        questions: ['Quelle pensée puis-je cesser de nourrir pour retrouver de la clarté ?', 'Quelle décision attend seulement que j’ose la formuler ?', 'Que sais-je déjà, que je fais semblant de ne pas savoir ?']
      },
      energie: {
        label: 'ton énergie',
        mudras: ['prithvi', 'apana'],
        mantras: ['Mon rythme est une ressource, pas une faute.', 'Je donne du poids à ce que je choisis.', 'Je reviens dans mon corps avant de repartir.'],
        questions: ['Qu’est-ce qui me recharge vraiment, et quand l’ai-je fait pour la dernière fois ?', 'Quelle pause puis-je m’offrir aujourd’hui sans attendre d’être épuisé·e ?', 'Où est-ce que je dépense une énergie qui ne me revient pas ?']
      },
      direction: {
        label: 'ta direction',
        mudras: ['jnana', 'shuni'],
        mantras: ['Je marche à mon pas, sur mon chemin.', 'Un petit pas fidèle vaut mieux qu’un grand saut forcé.', 'Je choisis ma direction, même lentement.'],
        questions: ['Qu’est-ce qui mérite aujourd’hui une forme concrète dans ma vie ?', 'Quel premier pas réversible pourrais-je faire cette semaine ?', 'Si personne ne me regardait, quelle direction prendrais-je ?']
      },
      ancrage: {
        label: 'ton ancrage',
        mudras: ['shuni', 'prithvi'],
        mantras: ['Je tiens ce qui compte, je pose le reste.', 'La patience est aussi une force.', 'Mes racines me portent quand le vent souffle.'],
        questions: ['Quelle responsabilité puis-je déposer, au moins pour aujourd’hui ?', 'Qu’est-ce qui demande du temps plutôt que de l’effort ?', 'Sur quoi puis-je m’appuyer quand tout bouge ?']
      },
      elan: {
        label: 'ton élan',
        mudras: ['surya', 'padma'],
        mantras: ['J’ai le droit de briller sans m’excuser.', 'Ma joie est un chemin, pas une récompense.', 'Je crée d’abord, je juge ensuite.'],
        questions: ['Qu’est-ce que j’aime faire au point d’oublier l’heure ?', 'Quelle part de moi attend d’être montrée ?', 'Quel petit geste créatif puis-je glisser dans ma journée ?']
      },
      ecoute: {
        label: 'ton écoute intérieure',
        mudras: ['dhyana', 'varuna'],
        mantras: ['Je laisse le silence remettre chaque chose à sa place.', 'Mon intuition parle bas ; je baisse le bruit.', 'Je n’ai pas besoin de tout résoudre aujourd’hui.'],
        questions: ['Qu’est-ce que je comprendrais mieux si je ne cherchais pas à le résoudre tout de suite ?', 'Quelle image de mes rêves revient en ce moment ?', 'Que me dit mon corps, avant que ma tête ne réponde ?']
      }
    },

    /* Les gestes : la façon de faire, sans obligation ; arrêter en cas d’inconfort. */
    mudras: {
      anjali: { name: 'Anjali Mudra — le geste du rassemblement', how: 'Réunis les paumes sans pression devant la poitrine, épaules relâchées. Sens simplement les deux mains se rencontrer.' },
      padma: { name: 'Padma Mudra — le geste du lotus', how: 'Garde les bases des paumes et les pouces et auriculaires en contact, ouvre les autres doigts comme une fleur. Respire quelques fois dans cette ouverture.' },
      jnana: { name: 'Jnana Mudra — le geste de l’attention', how: 'Approche doucement le bout du pouce et de l’index. Les autres doigts restent souples. Reviens à une seule chose à la fois.' },
      buddhi: { name: 'Buddhi Mudra — le geste de la parole juste', how: 'Touche doucement le bout du pouce avec le bout de l’auriculaire, les autres doigts détendus. Laisse venir le mot simple.' },
      prithvi: { name: 'Prithvi Mudra — le geste de la Terre', how: 'Approche le bout du pouce et de l’annulaire, les autres doigts détendus. Un symbole de stabilité et de présence.' },
      apana: { name: 'Apana Mudra — le geste du lâcher', how: 'Réunis le bout du pouce, du majeur et de l’annulaire ; index et auriculaire restent libres. Laisse l’expiration s’allonger d’elle-même.' },
      shuni: { name: 'Shuni Mudra — le geste de la patience', how: 'Approche le bout du pouce et du majeur, sans serrer. Un rappel : certaines choses demandent du temps, pas de la force.' },
      surya: { name: 'Surya Mudra — le geste du soleil', how: 'Replie l’annulaire sous la base du pouce et pose le pouce dessus, doucement. Les autres doigts s’étirent vers la lumière.' },
      dhyana: { name: 'Dhyana Mudra — le geste du silence', how: 'Pose les mains l’une dans l’autre, paumes vers le haut, sans chercher une forme parfaite. Laisse le geste devenir immobile.' },
      varuna: { name: 'Varuna Mudra — le geste de l’eau', how: 'Touche le bout du pouce avec le bout de l’auriculaire, et laisse la main reposer sur la cuisse. Pense à une eau qui retrouve son cours.' }
    },

    /* Pour relier la lecture à l'aujourd'hui, sans prédire. */
    invitations: {
      liens: ['Aujourd’hui, ta main t’invite à regarder tes liens avec douceur et précision.', 'Ce jour est propice pour honorer un lien, ou pour lui redonner une forme plus juste.'],
      clarte: ['Aujourd’hui, ta main t’invite à trier : garder ce qui éclaire, laisser ce qui encombre.', 'Ce jour est fait pour une seule décision claire plutôt que pour dix pistes ouvertes.'],
      energie: ['Aujourd’hui, ta main t’invite à écouter ton rythme avant celui des autres.', 'Ce jour demande de doser ton énergie : donner, puis te reposer, vraiment.'],
      direction: ['Aujourd’hui, ta main t’invite à faire un pas, même petit, dans ta propre direction.', 'Ce jour est bon pour regarder où tu vas, sans te presser d’y être.'],
      ancrage: ['Aujourd’hui, ta main t’invite à revenir au sol : ce qui est simple, ce qui est là.', 'Ce jour demande de la patience : laisse le temps faire une part du travail.'],
      elan: ['Aujourd’hui, ta main t’invite à laisser de la place à ce qui te met en joie.', 'Ce jour est fait pour créer quelque chose, même minuscule, juste pour toi.'],
      ecoute: ['Aujourd’hui, ta main t’invite à baisser le bruit pour entendre ton intuition.', 'Ce jour demande moins de réponses et plus d’écoute.']
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = C;
  if (typeof window !== 'undefined') window.C127TerraCorpus = C;
})();
