# Fiche App Store : Le Cercle 127

Tout ce qu'il faut copier-coller dans **App Store Connect** (appstoreconnect.apple.com).
Les limites de caractères d'Apple sont respectées.

## 1. Informations de l'app

| Champ | Valeur |
|---|---|
| Nom (30 max) | `Le Cercle 127` |
| Sous-titre (30 max) | `Journal de rêves et symboles` |
| Identifiant de lot (Bundle ID) | `com.lecercle127.app` |
| SKU | `lecercle127-ios` |
| Langue principale | Français (France) |
| Catégorie principale | **Style de vie** (Lifestyle) |
| Catégorie secondaire | Références (Reference) |
| Prix | Gratuit |
| Disponibilité | Tous les pays, ou France, Belgique, Suisse et Canada pour commencer |
| URL de confidentialité | https://lecercle127.com/confidentialite-le-cercle-127/ |
| URL d'assistance | https://lecercle127.com/application/ |
| URL marketing | https://lecercle127.com/ |
| Copyright | `2026 Safia METTRI` |

> Éviter la catégorie « Santé et forme » : l'application ne fait ni diagnostic ni soin, et cette catégorie
> déclenche une relecture plus stricte.

## 2. Texte promotionnel (170 max, modifiable sans nouvelle version)

```
Notez vos rêves au réveil, même hors connexion. Retrouvez ce qui revient, explorez 3 900 symboles et laissez les Sept Sœurs du Cercle éclairer vos nuits.
```

## 3. Mots-clés (100 max, séparés par des virgules, sans espace)

```
rêve,journal de rêves,symboles,interprétation,onirique,songe,cauchemar,rêve lucide,grimoire,oracle
```

## 4. Description (4 000 max)

```
Chaque rêve est un message qu'on ne sait pas lire seul. Le Cercle 127 vous aide à le garder, à le comprendre et à avancer.

NOTEZ VOS RÊVES AU RÉVEIL
Racontez votre rêve tel qu'il vient, même en fragments. Il est gardé sur votre téléphone, même sans réseau, puis rejoint votre Grimoire dès que vous êtes connecté·e. Un rappel du matin, si vous le souhaitez, vous aide à ne plus les laisser s'effacer.

VOTRE GRIMOIRE PRIVÉ
Retrouvez toutes vos nuits au même endroit et voyez ce qui revient : émotions, lieux, symboles. Votre Grimoire est le même que sur lecercle127.com. Il n'appartient qu'à vous.

3 900 SYMBOLES ONIRIQUES
Un serpent, une maison, de l'eau, une chute ? Cherchez un symbole et découvrez ses sens possibles. Des pistes, jamais des verdicts : vous gardez la main sur le sens de vos rêves.

LES SEPT SŒURS DU CERCLE
Oni lit les rêves. Alka relie les motifs, Naïa apaise les émotions, Terra ramène au corps, Ignis passe à l'action, Astria oriente vers vos envies, Irma aide à choisir. Explorez aussi l'Oracle 127, le Grand Labyrinthe et le rêve lucide.

ONI, AVEC VOTRE ACCORD
Lorsque cette fonction est proposée, vous pouvez demander à Oni des hypothèses et des questions sur un rêve. Elle s'appuie sur un outil d'intelligence artificielle : votre accord vous est demandé à chaque envoi.

RESPECT DE VOS DONNÉES
Pas de publicité, pas de revente de données. Vous pouvez supprimer votre compte et vos rêves directement depuis l'application.

Le Cercle 127 est un compagnon de réflexion. Il ne prédit pas l'avenir et ne remplace pas un accompagnement médical ou thérapeutique.
```

## 5. Nouveautés de cette version

```
Première version de l'application Le Cercle 127 : journal de rêves hors connexion, Grimoire, dictionnaire des symboles, Oracle 127 et Sept Sœurs.
```

## 6. Captures d'écran

Dossier `store/ios-6.9/`, au format iPhone **6,9 pouces (1320 × 2868)**. Apple les réutilise pour les tailles plus petites.

1. `1-accueil.png` : Comprendre vos rêves. Avancer concrètement.
2. `2-reve.png` : Notez-le au réveil, même hors connexion.
3. `3-grimoire.png` : Retrouvez vos nuits et ce qui revient.
4. `4-symboles.png` : Le sens des symboles, en un instant.

## 7. Confidentialité de l'app (« App Privacy »)

**Suivi (tracking)** : **Non**. Aucune donnée n'est utilisée pour suivre l'utilisateur entre apps ou sites.

| Type de donnée Apple | Collectée | Liée à l'identité | Suivi | Finalité |
|---|---|---|---|---|
| Coordonnées : **Adresse e-mail** | Oui | Oui | Non | Fonctionnalité de l'app |
| Identifiants : **Identifiant d'utilisateur** | Oui | Oui | Non | Fonctionnalité de l'app |
| Contenu de l'utilisateur : **Autre contenu** (récits de rêves) | Oui | Oui | Non | Fonctionnalité de l'app |

À ne **pas** cocher : localisation, contacts, santé, données financières, historique de navigation, identifiants publicitaires, diagnostics.

Le manifeste de confidentialité (`PrivacyInfo.xcprivacy`) est généré à la construction à partir de `app.json` (`ios.privacyManifests`).

## 8. Classification par âge (questionnaire)

Répondre **« Aucun »** partout, sauf :
- **Thèmes matures ou suggestifs / horreur** : « Peu fréquent ou léger », parce que certaines pages parlent de cauchemars.
- **Contenu généré par les utilisateurs partagé** : **Non**. Les rêves restent privés et ne sont jamais visibles par d'autres.
- **Conseils médicaux** : **Non**.

Résultat attendu : **12+** (ou 9+). Âge minimum de l'achat sur le site : majeur (voir CGV).

## 9. Chiffrement (export)

« Votre app utilise-t-elle du chiffrement ? » → **Non** (uniquement HTTPS standard). C'est déjà déclaré dans
`app.json` (`usesNonExemptEncryption: false`), donc la question ne sera plus posée.

## 10. Informations pour la relecture Apple (obligatoire)

**Compte de démonstration** (créé le 6 novembre 2026, 3 rêves enregistrés) : identifiant
`revue.apple@lecercle127.com`. Le mot de passe a été transmis à part : il ne doit pas figurer dans ce dépôt.
À saisir dans App Store Connect → Informations pour la relecture (« Sign-in required »).

**Notes pour le relecteur** (à coller, en anglais) :

```
Le Cercle 127 is a private dream journal and symbol dictionary (French language).

- Dreams can be written without an account and are stored on the device; with the demo account they sync to the user's private Grimoire.
- Account deletion: Grimoire tab > "Mon compte" > "Supprimer mon compte".
- Some content pages (Oracle, the Seven Sisters) are displayed from our website lecercle127.com, without any payment link.
- The app contains no in-app purchase and no link to external purchases.
- The optional "Oni" AI exploration asks for explicit consent before each request and discloses that an AI provider (OpenAI) is used.
- The app does not provide medical advice, diagnosis or predictions.
Contact: contact@lecercle127.com
```

## 11. Informations de commerçant (Union européenne, DSA)

Apple demande et **affiche publiquement** sur l'App Store de l'UE : nom, adresse, e-mail et **téléphone**.
Les mêmes informations que dans les mentions légales : Safia METTRI EI, 13 place Alsace-Lorraine, 34700 Lodève,
contact@lecercle127.com, et le téléphone (encore à compléter).

## 12. Commandes (depuis le Mac, dans le dossier du projet)

```bash
npx --yes eas-cli@latest build --platform ios --profile production
```

```bash
npx --yes eas-cli@latest submit --platform ios --latest
```

La première construction demande les identifiants Apple et propose de créer certificats et profils : répondre **Y**.
`submit` crée l'app dans App Store Connect si besoin et envoie la construction dans **TestFlight**.
