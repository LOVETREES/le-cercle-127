# Développement Expo avec Docker

Le service par défaut lance Metro pour développer l’application corrigée. Node 24 et les dépendances JavaScript sont dans le conteneur ; les fichiers du projet sont montés depuis le Mac. L’image ne génère pas à elle seule le binaire iOS signé pour TestFlight.

## Démarrer sur Mac

Pour récupérer la source depuis GitHub dans un nouveau dossier :

```sh
git clone --branch claude/upbeat-lamport-ymb7e2 --single-branch https://github.com/LOVETREES/le-cercle-127.git le-cercle-127-mobile
cd le-cercle-127-mobile
```

Démarrer Docker Desktop. Dans Terminal, se placer dans le dossier contenant `package.json`, `Dockerfile` et `compose.yaml`, puis lancer :

```sh
docker compose up --build -d expo
docker compose logs -f expo
```

Ouvrir http://localhost:8081 pour l’aperçu navigateur. Pour saisir d’autres commandes, ouvrir un deuxième onglet Terminal ; celui qui affiche les journaux reste occupé. Vérifier que Mon compte affiche la version 1.0.1. Les modifications dans `src/` sont prises en compte par Metro et Fast Refresh. Le mode développement n’active pas `CI=1`, qui désactiverait la surveillance des fichiers dans cette version d’Expo.

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

Les dépendances Linux sont isolées dans le volume `expo_node_modules`. Après une modification du fichier de verrouillage hors du conteneur, les synchroniser avec `docker compose run --rm expo npm ci`, puis relancer le service. `docker compose down` garde les caches.

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
docker build --target development --secret id=proxy_ca,src="$CODEX_PROXY_CERT" -t le-cercle-127:expo-dev .
C127_EXPO_OFFLINE=1 docker compose up --no-build -d --wait expo
```

Le mode hors ligne est réservé à cette vérification sans services Expo distants. Pour des commandes HTTPS dans le conteneur du cloud, monter également le certificat du proxy en lecture seule et définir `NODE_EXTRA_CA_CERTS` pour le processus concerné, conformément à la configuration de cet environnement.

## Vérifications réalisées

L’image de développement a été construite et le service Compose a réussi son contrôle de santé. TypeScript, lint et 93 tests passent. Les exports iOS, Android et web réussissent. Chromium vérifie le carnet vocal local avec un périphérique simulé : sauvegarde, persistance après rechargement, écoute, suppression, refus du micro. La démonstration est séparée des brouillons personnels. Les cinq onglets ont été exercés dans le navigateur.

Les essais réels sur le Mac et sur iPhone restent à effectuer. La connexion et la suppression d’un compte réel n’ont pas été testées, conformément au choix de garder les tests locaux. Le rapport détaillé est dans [docs/APP-REVIEW-VALIDATION.md](docs/APP-REVIEW-VALIDATION.md).
