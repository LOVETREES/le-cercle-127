# Version 1.0.1 préparée après le build 7

Ces corrections sont dans la source de cet environnement. Elles ne modifient pas automatiquement le Mac ni le build déjà installé dans TestFlight.

- Navigation : Accueil · Oracle · Rêve · Grimoire · Symboles. Les événements et la navigation utilisent les types réels du SDK 58 ; la totalité du bouton Rêve reste dans sa zone tactile.
- Identité visuelle : une source commune `assets/brand/icon.png` est utilisée par l’en-tête, l’icône iOS, le favicon et le démarrage. Le fichier montre le croissant/portail doré entouré de sept lumières. Android utilise les fichiers adaptatifs regroupés dans le même dossier. Vérifier le rendu final sur l’appareil.
- Carnet vocal : écran local utilisant expo-audio, avec permission explicite, arrêt/sauvegarde, écoute, suppression et conservation sur l’appareil. Les refus et erreurs sont affichés. L’audio n’est ni synchronisé ni envoyé à une IA ; la dictée du clavier reste disponible pour le texte.
- Offres : l’encart réel « Commencer simplement avec Oni », le montant 3,90 €, la Perle d’Oni et les paiements connus sont filtrés dans les WebViews mobiles, y compris après insertion dynamique. Les destinations de paiement sont bloquées, même dans les cadres.
- Facebook : retrait des boutons des Sœurs et blocage des destinations Facebook dans l’app mobile ; les liens internes de dialogue restent disponibles.
- Confidentialité : écran natif, accord explicite à chaque demande d’IA avec ses destinataires, service désactivé quand le serveur le ferme. Les scripts de mesure connus sont retirés des pages avant leur rendu mobile. Les choix de cookies restent accessibles.
- Compte : erreurs de suppression visibles, suppression locale complète, protection contre la réapparition d’un cache après une requête tardive. La suppression réelle n’est confirmée qu’après une réponse positive du serveur.
- Démonstration locale : trois rêves fictifs et une lecture d’exemple, distincts du carnet personnel, accessibles sans identifiants.
- Boutique : description, notes de relecture et complément de confidentialité préparés pour les fonctions réelles de 1.0.1. La politique publique et App Store Connect n’ont pas été modifiés.

## Essayer avec Docker

Dans le dossier qui contient `package.json` et `compose.yaml`, suivre [DOCKER.md](DOCKER.md). Ouvrir un nouveau terminal pour les commandes lorsque Metro ou les journaux occupent le terminal courant.

```sh
docker compose up --build -d expo
```

Après modification des dépendances, synchroniser aussi le volume existant :

```sh
docker compose run --rm --no-deps expo npm ci
docker compose up -d expo
```

Ouvrir http://localhost:8081. Les filtres des pages distantes sont propres aux WebViews iOS/Android : l’iframe de l’aperçu web continue d’afficher le site public. Le carnet vocal et le mode démo sont des écrans locaux dans les deux cas.

## Construire le nouveau binaire

Dans ce même dossier, avec Node 24 ou depuis le conteneur :

```sh
npm ci
npm run typecheck
npm run lint
npm test
npx eas-cli@latest build --platform ios --profile production --clear-cache
```

Le profil production incrémente le numéro de build à distance. Vérifier que la version est 1.0.1 et relever le nouveau numéro ; ne pas sélectionner le build 7.

Après vérification du binaire obtenu, transmettre son identifiant précis :

```sh
npx eas-cli@latest submit --platform ios --id ID_DU_BUILD_EAS
```

Aucun build signé ni envoi à Apple n’a été exécuté ici. Les exports locaux ne remplacent pas cette construction.

## Validation

Voir [docs/APP-REVIEW-VALIDATION.md](docs/APP-REVIEW-VALIDATION.md) pour les résultats, et [store/APP-STORE.md](store/APP-STORE.md) pour les informations à compléter avant soumission. Les essais locaux ne garantissent pas l’acceptation Apple.
