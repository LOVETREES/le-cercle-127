# Le Cercle 127 : application mobile

Application iPhone et Android de **lecercle127.com**, construite avec Expo (SDK 58, Expo Router).
Elle reprend la version mobile actuelle du site : même en-tête « Onirologue », même barre du bas
(Accueil · Oracle · Rêve · Grimoire · Symboles), mêmes couleurs, mêmes visuels et mêmes textes.

## Ce que fait l'application

| Écran | Fonctionnement |
|---|---|
| **Accueil** | Écran natif fidèle à l'accueil mobile : image d'accueil, « Raconter un rêve », Grimoire / Oracle / Symboles, carte Oni, fonctionnalités, les Sept Sœurs, Explorer. |
| **Rêve** | Formulaire natif. Le rêve est gardé **sur le téléphone, même sans compte ni réseau**, puis envoyé au Grimoire dès la connexion. |
| **Grimoire** | Connexion, création de compte, liste des rêves, « Ce qui revient », synchronisation par glisser vers le bas. |
| **Symboles** | Recherche native dans les 3 900 symboles du site (API WordPress). |
| **Oracle**, pages des Sœurs, Labyrinthe, Rêve lucide… | Page mobile du site affichée dans l'application, **sans** l'en-tête, la barre du bas, le pied de page ni le bandeau cookies du site. |
| **Mon compte** | Rappel du matin (notification locale), déconnexion, **suppression du compte** (obligatoire sur l'App Store). |

Oni n'est proposée que si le site l'active (`oni_enabled` dans `/wp-json/cercle127/v1/privacy`), avec un
consentement demandé **à chaque envoi**, comme le prévoit la politique de confidentialité.

**Pas d'achat dans l'application (v1).** La Perle d'Oni (3,90 €) reste vendue sur le site. Les liens vers
`/lecture-de-reve/` et Stripe sont masqués et bloqués dans l'application, pour respecter les règles d'Apple
et de Google sur la vente de contenus numériques.

## API utilisée (déjà en ligne sur le site)

`https://lecercle127.com/wp-json/cercle127/v1` : `auth/login` (champs `login`, `password`), `auth/register`,
`auth/forgot-password`, `auth/logout`, `me` (GET / DELETE), `dreams` (GET / POST), `dreams/{id}` (DELETE),
`dreams/{id}/oni` (POST), `privacy`.

> **À vérifier avec un compte de test.** Le format exact des réponses (nom du jeton, champs d'un rêve,
> en-tête d'authentification) n'est pas documenté publiquement. `src/lib/model.ts` accepte plusieurs noms
> de champ et `src/lib/api.ts` envoie le jeton dans `Authorization: Bearer` et `X-C127-Token`. Une fois le
> code PHP de la route `cercle127/v1` (ou un compte de test) disponible, on fixe les noms exacts.

## Développer

```bash
cd mobile
npm install
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
npx eas-cli@latest init                 # relie le projet à votre compte Expo
```

### 1. APK Android à télécharger sur le site

```bash
npx eas-cli@latest build --platform android --profile preview
```

Le lien de l'APK s'affiche à la fin. Déposer le fichier dans la médiathèque WordPress et créer une page
« Application » avec un bouton de téléchargement. Sur Android, l'utilisateur doit autoriser
« Installer des applications inconnues » pour son navigateur.

> Sur iPhone, une application **ne peut pas** être installée depuis un site : seule l'App Store est possible.

### 2. Google Play

```bash
npx eas-cli@latest build --platform android --profile production   # fichier .aab
npx eas-cli@latest submit --platform android
```

Un **nouveau compte développeur personnel** doit d'abord faire tester l'application en **test fermé par
au moins 12 personnes pendant 14 jours** avant de pouvoir publier en production. Prévoir ce délai.

### 3. App Store

Nécessite un compte Apple Developer (99 $/an).

```bash
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios
```

### Fiches boutiques : informations à préparer

- Nom : **Le Cercle 127** · identifiant : `com.lecercle127.app`
- Catégorie : Mode de vie (éviter « Santé » : l'application ne fait ni diagnostic ni soin)
- Politique de confidentialité : https://lecercle127.com/confidentialite-le-cercle-127/
- Mentions légales : https://lecercle127.com/mentions-legales/
- Déclarer l'utilisation d'un service d'IA (OpenAI) pour Oni, la collecte de l'e-mail et des récits de rêves
  (liés au compte, non utilisés pour la publicité), et la suppression du compte depuis l'application.
- Compte de démonstration pour les relecteurs Apple et Google.
