# Développement Expo 1.0.5 avec Docker

Le service par défaut lance Metro pour développer l’application corrigée sur Mac, Windows ou Linux. Node 24, le code de l’application et les dépendances JavaScript sont dans l’image. Compose monte les fichiers du projet pour le rechargement automatique. L’image ne génère pas à elle seule le binaire iOS signé pour TestFlight.

Source de cette mise à jour : branche `claude/upbeat-lamport-ymb7e2`, commit `9fd7aa5` du 12 novembre 2026. La branche `main` ne contient pas l’application mobile. Le numéro affiché vient de `app.json` (1.0.5) ; le numéro interne du paquet npm est encore 1.0.2.

Compose étiquette l’image `le-cercle-127:1.0.5`. Pour une prochaine version, modifier le tag avec `C127_IMAGE_TAG` lors de la construction et du démarrage. Le code embarqué correspond aux sources locales au moment du build.

## Démarrer avec Docker Desktop

Pour récupérer la source depuis GitHub dans un nouveau dossier :

```sh
git clone --branch claude/upbeat-lamport-ymb7e2 --single-branch https://github.com/LOVETREES/le-cercle-127.git le-cercle-127-mobile
cd le-cercle-127-mobile
```

Démarrer Docker Desktop. Dans Terminal, se placer dans le dossier contenant `package.json`, `Dockerfile` et `compose.yaml`, puis lancer :

```sh
docker compose up --build -d --wait expo
docker compose logs -f expo
```

Ouvrir http://localhost:8081 pour l’aperçu navigateur. Pour saisir d’autres commandes, ouvrir un deuxième onglet Terminal ; celui qui affiche les journaux reste occupé. Vérifier que Mon compte affiche la version 1.0.5 (version Expo dans `app.json`). Les modifications dans `src/` sont prises en compte par Metro et Fast Refresh. Le mode développement n’active pas `CI=1`, qui désactiverait la surveillance des fichiers dans cette version d’Expo.

### Tester sur iPhone, sur le même Wi-Fi

Le téléphone doit pouvoir atteindre l’adresse du Mac. Sur un Mac connecté en Wi-Fi par `en0` :

```sh
export C127_LAN_HOST="$(ipconfig getifaddr en0)"
export C127_BIND_HOST=0.0.0.0
docker compose up --build -d expo
docker compose logs -f expo
```

Vérifier que `C127_LAN_HOST` n’est pas vide et correspond à l’adresse Wi-Fi du Mac dans Réglages Système > Wi-Fi > Détails. Si le Wi-Fi utilise une autre interface, employer cette adresse manuellement. Ouvrir le lien Expo avec un client compatible SDK 58 ou un build de développement. Le conteneur Linux ne pilote pas le simulateur iOS du Mac ; l’accès depuis un véritable iPhone n’est pas vérifié dans le cloud.

## Commandes de développement

```sh
docker compose exec expo npm run typecheck
docker compose exec expo npm run lint
docker compose exec expo npm test
docker compose exec expo npx expo install NOM_DU_PAQUET
docker compose down
```

Les dépendances Linux sont isolées dans le volume `expo_node_modules`. À chaque démarrage, le conteneur compare les fichiers `package.json` et `package-lock.json` aux dépendances installées. Il exécute `npm ci` uniquement si elles doivent être synchronisées. Après une modification de ces fichiers pendant que Metro tourne, lancer `docker compose restart expo`. `docker compose down` garde les caches et la session Expo.

Après avoir récupéré une mise à jour du code avec Git, relancer `docker compose up --build -d --wait expo`. Le volume des dépendances est vérifié automatiquement ; il n’est pas nécessaire d’effacer les volumes.

### Image autonome

L’image contient aussi le code et peut démarrer sans monter le dossier du projet :

```sh
docker build --target development -t le-cercle-127:1.0.5 .
docker run --rm --init -p 127.0.0.1:8082:8081 -e REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1 le-cercle-127:1.0.5
```

Dans ce cas, ouvrir http://localhost:8082. Ce mode utilise le code embarqué au moment de la construction ; pour modifier le code avec Fast Refresh, utiliser Compose.

Pour une construction EAS, utiliser les commandes de `CORRECTIONS-BUILD-SUIVANT.md` depuis le Mac, ou les exécuter dans le conteneur. Par exemple :

```sh
docker compose exec expo npx eas-cli@latest build --platform ios --profile production --clear-cache
```

EAS demandera l’authentification Expo si elle manque ; aucun identifiant n’est ajouté à l’image. Construire et transmettre un build à Apple reste une opération distincte du démarrage de Metro.

## Limites de l’aperçu navigateur

Les services WordPress et Make restent distants. Leur fonctionnement dépend du réseau, de CORS et des autorisations du site. L’aperçu navigateur utilise des iframes vers le site public : le filtre des encarts payants reste propre aux WebViews iOS/Android et ne s’applique pas à ces iframes. Le carnet vocal est désormais un écran local dans cet aperçu ; son microphone nécessite localhost ou HTTPS et une autorisation du navigateur. Une URL HTTP utilisant l’adresse IP du Mac n’est généralement pas un contexte sécurisé pour le micro web. Les notifications et autres fonctions natives nécessitent un appareil ou client compatible.

## Cloud géré

La construction derrière le proxy utilise son certificat comme secret BuildKit ; il n’est pas conservé dans l’image.

```sh
docker build --target development --secret id=proxy_ca,src="$CODEX_PROXY_CERT" -t le-cercle-127:1.0.5 .
C127_EXPO_OFFLINE=1 docker compose up --no-build -d --wait expo
```

Le mode hors ligne est réservé à cette vérification sans services Expo distants. Pour des commandes HTTPS dans le conteneur du cloud, monter également le certificat du proxy en lecture seule et définir `NODE_EXTRA_CA_CERTS` pour le processus concerné, conformément à la configuration de cet environnement.

## Vérification Docker de la version 1.0.5 — 12 novembre 2026

- Construction de l’image `le-cercle-127:1.0.5` réussie avec Node 24 et le verrou npm existant.
- Configuration Compose et `git diff --check` valides.
- TypeScript : succès. Lint : aucune erreur, 16 avertissements existants. Tests : 198 réussis dans 29 fichiers, exécutés directement avec Node 24.
- Démarrage du conteneur et contrôle de santé non validés : le stockage Docker VFS du cloud sature à la création du conteneur (`no space left on device`). L’image et ses caches ont été retirés après vérification de construction pour libérer le disque. Reconstruire localement avec les commandes ci-dessus.
- L’entrypoint est exécuté avec `sh /app/docker/entrypoint.sh`, ce qui évite une couche de copie supplémentaire sans nécessiter un bit exécutable.

## Vérifications historiques de la version 1.0.2

La version 1.0.2 passe TypeScript, le lint et 117 tests. Les exports iOS, Android et web réussissent. Chromium vérifie le carnet vocal local avec un périphérique simulé : sauvegarde, persistance après rechargement, écoute, suppression, refus du micro. La démonstration est séparée des brouillons personnels. Les cinq onglets ont été exercés dans le navigateur.

La construction de l’image Docker, son démarrage sans montage de source et le contrôle de santé Compose ont été vérifiés. Chromium affiche les sept profils depuis l’image autonome. Le service de développement passe aussi les parcours du journal, de l’inscription avec API simulée et de la dictée avec résultats vocaux simulés. Le démarrage synchronise un ancien volume de dépendances ; le lancement suivant conserve les dépendances déjà à jour.

Les essais réels sur le Mac et sur iPhone restent à effectuer. La connexion et la suppression d’un compte réel n’ont pas été testées, conformément au choix de garder les tests locaux. Le rapport détaillé est dans [docs/APP-REVIEW-VALIDATION.md](docs/APP-REVIEW-VALIDATION.md).

La dictée et la transcription iPhone nécessitent le nouveau module natif expo-speech-recognition 58. Expo Go peut afficher les écrans mais ne fournit pas ce module ; utiliser le nouveau build TestFlight ou un build de développement. Le navigateur utilise son API vocale lorsqu’elle est disponible.

Sur Android 13 ou plus, le carnet peut conserver audio et texte ensemble avec un service vocal compatible. L’APK signé 1.0.2, code 3, a été construit et son module vocal a été vérifié ; son fonctionnement vocal réel sur téléphone reste à tester. Docker fournit le serveur de développement, et ne transforme pas l’aperçu navigateur en application Android native.
