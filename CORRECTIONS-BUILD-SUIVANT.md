# Correctif 1.0.2 après le build 10

Le build 10 est la version 1.0.1 déjà envoyée à Apple. Les corrections des nouveaux retours sont détaillées dans [docs/CORRECTIF-1.0.2.md](docs/CORRECTIF-1.0.2.md) : Sept Sœurs natives, journal utilisable sans compte, inscription accessible, retrait du bandeau cookies, dictée en texte et transcription des enregistrements sur iPhone.

Cette version ajoute un module natif. Elle nécessite un nouveau binaire ; elle ne peut pas être reçue en rechargeant le build 10.

## Vérifier et construire

Ouvrir un terminal dans le dossier contenant package.json et eas.json. Si Metro ou les journaux occupent le terminal, ouvrir un deuxième onglet.

```sh
npm ci
npm run typecheck
npm run lint
npm test
npx eas-cli@latest build --platform ios --profile production --clear-cache --auto-submit
```

EAS incrémente le numéro de build à distance. Sélectionner la version 1.0.2 dans TestFlight après le traitement Apple. Ne pas relancer une construction si un build est déjà en cours ; suivre son identifiant.

Les instructions Docker sont dans [DOCKER.md](DOCKER.md). Les tests simulés ne remplacent pas la vérification de la reconnaissance vocale sur un véritable iPhone.
