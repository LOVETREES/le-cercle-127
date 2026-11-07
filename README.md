# Le Cercle 127 : application mobile

> L’application est sur la branche [`claude/upbeat-lamport-ymb7e2`](https://github.com/LOVETREES/le-cercle-127/tree/claude/upbeat-lamport-ymb7e2) du dépôt `LOVETREES/le-cercle-127`. La branche `main` contient un registre Solana : utiliser la branche mobile pour développer et construire cette application.

Version préparée : **1.0.1**. Application iPhone et Android de **lecercle127.com**, construite avec Expo (SDK 58, Expo Router).
Elle reprend la version mobile actuelle du site : même en-tête « Onirologue », même barre du bas
(Accueil · Oracle · Rêve · Grimoire · Symboles), mêmes couleurs, mêmes visuels et mêmes textes.

## Ce que fait l'application

| Écran | Fonctionnement |
|---|---|
| **Accueil** | Écran natif fidèle à l'accueil mobile : image d'accueil, « Raconter un rêve », Grimoire / Oracle / Symboles, carte Oni, fonctionnalités, les Sept Sœurs, Explorer. |
| **Rêve** | Formulaire natif. Le rêve est gardé **sur le téléphone, même sans compte ni réseau**, puis envoyé au Grimoire dès la connexion. |
| **Grimoire** | Connexion, création de compte, liste des rêves, « Ce qui revient », synchronisation par glisser vers le bas. |
| **Symboles** | Recherche native dans les 3 900 symboles du site (API WordPress). |
| **Carnet vocal** | Enregistrement audio local, écoute et suppression. Aucun audio envoyé à l’IA ; aucune transcription automatique. |
| **Démonstration** | Rêves fictifs et lecture d’exemple, données séparées du carnet personnel. |
| **Oracle**, pages des Sœurs, Labyrinthe, Rêve lucide… | Ressources du site dans l’application, sans sa navigation ni ses offres payantes. Les choix de cookies restent accessibles ; les scripts de suivi connus sont retirés avant le rendu mobile. |
| **Mon compte** | Rappel du matin sur mobile, déconnexion, suppression du compte, effacement local et accès à la confidentialité. |

Oni n'est proposée que si le site l'active (`oni_enabled` dans `/wp-json/cercle127/v1/privacy`), avec un
consentement demandé **à chaque envoi**, comme le prévoit la politique de confidentialité.

**Pas d'achat dans l'application (v1).** Dans les pages mobiles du site, les encarts de la Perle d'Oni,
les mentions du prix à 3,90 € et leurs liens de paiement sont masqués, y compris après un chargement
dynamique. Les pages de l'offre et Stripe sont bloqués dès l'URL initiale et dans les cadres intégrés.
Le filtre conserve les fonctions gratuites présentes dans les mêmes groupes de contenu.
Il agit dans les WebViews de l'application iOS et Android ; l'iframe de l'aperçu web affiche le site public.

**Facebook retiré de l’app mobile.** Les boutons « Suivre… » et « Page Facebook » sont retirés des pages intégrées, y compris s’ils apparaissent après leur chargement. Les URL Facebook sont aussi bloquées avant l’ouverture du navigateur ou de l’application Facebook. Les boutons internes de dialogue avec les Sœurs sont conservés. Ce filtre ne modifie pas le site public affiché par l’aperçu navigateur.

## API utilisée (déjà en ligne sur le site)

`https://lecercle127.com/wp-json/cercle127/v1` : `auth/login` (champs `login`, `password`), `auth/register`,
`auth/forgot-password`, `auth/logout`, `me` (GET / DELETE), `dreams` (GET / POST), `dreams/{id}` (DELETE),
`dreams/{id}/oni` (POST), `privacy`.

> **À vérifier avec un compte de test.** Le format exact des réponses (nom du jeton, champs d'un rêve,
> en-tête d'authentification) n'est pas documenté publiquement. `src/lib/model.ts` accepte plusieurs noms
> de champ et `src/lib/api.ts` envoie le jeton dans `Authorization: Bearer` et `X-C127-Token`. Une fois le
> code PHP de la route `cercle127/v1` (ou un compte de test) disponible, on fixe les noms exacts.

## Développer

Pour utiliser Docker avec le code monté depuis le Mac et les dépendances isolées, suivre [DOCKER.md](DOCKER.md). Le service `expo` lance Metro et son aperçu navigateur sur le port 8081.

```bash
npm ci
npx expo start          # puis scanner le QR code (build de développement) ou appuyer sur « w » pour le web
```

Vérifications (à lancer avant chaque commit) :

```bash
npx tsc --noEmit
npx expo lint
npm test
```

## Construire et publier

Les constructions passent par les services cloud d'Expo (EAS Build) : ni Mac ni Android Studio nécessaires.
Il faut un compte Expo gratuit (expo.dev).

```bash
npx eas-cli@latest login
# Le projet EAS est déjà renseigné dans app.json : conserver son identifiant.
```

### 1. APK Android à télécharger sur le site

```bash
npx eas-cli@latest build --platform android --profile preview
```

Le lien de l'APK s'affiche à la fin. Déposer le fichier dans la médiathèque WordPress et créer une page
« Application » avec un bouton de téléchargement. Sur Android, l'utilisateur doit autoriser
« Installer des applications inconnues » pour son navigateur.

> Pour les essais iPhone, utiliser TestFlight ou un build de développement compatible. L’aperçu web ne remplace pas la vérification du binaire natif.

### 2. Google Play

```bash
npx eas-cli@latest build --platform android --profile production   # fichier .aab
npx eas-cli@latest submit --platform android
```

Un **nouveau compte développeur personnel** doit d'abord faire tester l'application en **test fermé par
au moins 12 personnes pendant 14 jours** avant de pouvoir publier en production. Prévoir ce délai.

### 3. App Store

Fiche et instructions de soumission : [`store/APP-STORE.md`](store/APP-STORE.md). Rapport des essais et limites : [`docs/APP-REVIEW-VALIDATION.md`](docs/APP-REVIEW-VALIDATION.md). Les captures web de validation sont séparées des captures iPhone à refaire sur le build final.

Nécessite un compte Apple Developer (99 $/an).

```bash
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --id ID_DU_BUILD_EAS
```

### Fiches boutiques : informations à préparer

- Nom : **Le Cercle 127** · identifiant : `com.lecercle127.app`
- Catégorie : Mode de vie (éviter « Santé » : l'application ne fait ni diagnostic ni soin)
- Politique de confidentialité : https://lecercle127.com/confidentialite-le-cercle-127/
- Mentions légales : https://lecercle127.com/mentions-legales/
- Déclarer l'utilisation d'un service d'IA (OpenAI) pour Oni, la collecte de l'e-mail et des récits de rêves
  (liés au compte, non utilisés pour la publicité), et la suppression du compte depuis l'application.
- Compte de démonstration pour les relecteurs Apple et Google.

## État des vérifications 1.0.1

TypeScript, lint et 93 tests locaux passent ; les bundles iOS, Android et web sont exportés. Le carnet vocal est testé dans Chromium avec un micro simulé, y compris après rechargement et avec autorisation refusée. Voir le rapport pour les limites. Aucun test authentifié sur le serveur, binaire signé, envoi Apple ou installation sur le Mac n’est confirmé par ces résultats.
