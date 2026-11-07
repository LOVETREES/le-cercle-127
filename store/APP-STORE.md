# Soumission App Store — version 1.0.2

Ce dossier prépare une soumission. Il ne confirme ni un nouveau build installé sur iPhone ni une validation Apple.

## Informations

- Nom : Le Cercle 127
- Sous-titre : Journal de rêves et symboles
- Bundle ID : com.lecercle127.app
- Catégorie : Style de vie, Références
- Prix : gratuit, sans parcours d’achat dans l’application
- Assistance : https://lecercle127.com/application/
- Politique publique : https://lecercle127.com/confidentialite-le-cercle-127/
- Contact : contact@lecercle127.com

La description ci-dessous correspond aux fonctions du code 1.0.2. Les nouvelles demandes d’IA sont fermées tant que le serveur renvoie `oni_enabled: false` ; elles ne doivent pas être présentées comme disponibles.

## Description

Le Cercle 127 est un journal de rêves privé pour écrire vos récits, retrouver vos symboles et explorer vos nuits à votre rythme.

VOTRE GRIMOIRE
Écrivez sans compte, même hors connexion. Avec un compte, synchronisez vos rêves écrits avec lecercle127.com. La lecture par Oni dépend de l’activation du service et demande un accord explicite pour chaque rêve.

VOTRE VOIX EN TEXTE
Dictez votre récit en français, relisez le texte puis gardez-le dans votre Grimoire. Sur iPhone, vous pouvez aussi transcrire les audios de votre carnet vocal. La reconnaissance sur l’appareil est privilégiée lorsqu’elle est disponible ; sinon, un accord est demandé avant le recours au service vocal du système ou du navigateur. Les fichiers audio restent stockés sur votre appareil.

UN JOURNAL DE VÉRIFICATION
Notez un contexte et une observation sans inscription. Ce journal local est distinct du journal du site ; les anciennes entrées restent accessibles sur le site avec sa propre connexion.

LES SEPT SŒURS ET LES SYMBOLES
Découvrez les sept Sœurs depuis leur écran dans l’app et recherchez les symboles du dictionnaire du site. Certaines ressources nécessitent Internet.

VOS DONNÉES ET VOS CHOIX
Micro et reconnaissance vocale sont facultatifs. Vous pouvez supprimer les notes, les audios et le compte depuis l’app. Une démonstration locale contient des exemples fictifs séparés de vos données. Aucun achat dans cette version.

Le Cercle 127 accompagne la réflexion personnelle et ne remplace pas un professionnel de santé.

## Texte promotionnel

Écrivez ou dictez vos rêves, relisez vos transcriptions et gardez vos observations dans un journal local accessible sans inscription.

## Nouveautés

Correction des pages intégrées et du chargement des Sept Sœurs, journal local avec accès à l’inscription, retrait du bandeau cookies dans l’app mobile, dictée en texte et transcription des audios sur iPhone.

## Accès pour App Review

Un mode local de démonstration est accessible depuis **Menu → Se connecter → Explorer la démonstration locale**. Il contient trois rêves fictifs et une lecture d’exemple. Il permet d’essayer l’ajout et la suppression d’un rêve, la recherche et les lectures. Il ne vérifie pas l’authentification réelle du serveur.

Le compte de test serveur documenté auparavant est `revue.apple@lecercle127.com`. Son accès n’est pas confirmé par cette révision. Avant la soumission, vérifier qu’il fonctionne et saisir le mot de passe uniquement dans les informations de relecture sécurisées d’App Store Connect. Ne pas mettre de mot de passe dans le dépôt ni dans le chat. Employer un compte jetable distinct pour tester la suppression : ne pas supprimer le compte destiné à Apple pendant ces essais.

### Notes pour le relecteur

```text
Version 1.0.2 adds a native Seven Sisters directory and a local reality-check journal, usable without account creation. Its notes are separate from the website journal. Native registration is accessible from the journal.

Voice dictation writes recognized French text directly into the dream form. On iPhone, saved recordings can also be transcribed. On-device recognition is preferred when available; if a network-based system speech service is needed, the app asks for explicit consent first. The speech framework requests microphone and speech permissions. Audio is not sent to Make or OpenAI by this feature.

Embedded mobile resource pages remove known tracking scripts, the website cookie banner, purchase offers and Facebook controls. These changes do not modify the public website.

The local demonstration remains accessible from Menu > Se connecter > Explorer la démonstration locale. AI reading requests stay unavailable while the backend reports oni_enabled=false. Account deletion is in Menu > Mon compte.
```

## Confidentialité à déclarer

À vérifier selon le fonctionnement réellement déployé et les réglages des prestataires :

| Donnée | Fonction dans l’app | Déclaration à préparer |
|---|---|---|
| E-mail et identifiant | Création de compte et synchronisation | Collectés pour la fonctionnalité du compte, liés à son identité |
| Récits et contexte | Grimoire écrit ; IA uniquement avec accord lorsque le service est activé | Contenu utilisateur lié au compte, destinataires clairement indiqués |
| Audio du carnet | Enregistrement, écoute, dictée et transcription optionnelle | Stockage local ; transcription distante uniquement avec accord si nécessaire. Déclarer les destinataires effectifs du service vocal |
| Images éventuelles dans les pages du site | Fonctions externes du site, distinctes du carnet | Contrôler leurs destinataires et leur consentement avant de déclarer leur absence |
| Mesures d’usage, journaux et ressources du site | Le chargement mobile retire les scripts de suivi connus | Vérifier la configuration effective du serveur et des prestataires ; ne pas choisir « aucune collecte » par défaut |

Le manifeste `app.json` ne remplace pas les réponses App Privacy. La politique publique doit mentionner Make, OpenAI, les audios locaux, la suppression et les durées réelles de conservation. Voir `store/CONFIDENTIALITE-APP.md` pour le complément à relire avant publication. Le serveur et les paramètres de conservation n’ont pas été modifiés ici.

## Classement par âge

Compléter le questionnaire actuellement proposé dans App Store Connect selon les contenus réels, notamment les cauchemars et toute fonction de conversation. Ne pas reprendre automatiquement les anciennes recommandations « 12+ ou 9+ ». La création de compte demande actuellement une confirmation d’au moins 15 ans ; ce seuil applicatif et le classement de la boutique sont deux choses distinctes.

## Captures

Les anciennes captures restent archivées dans `store/ios-6.9`. Les captures de validation web 1.0.2 sont séparées et ne doivent pas être présentées comme des captures d’iPhone. Les captures destinées à la boutique doivent montrer le build final réellement utilisé sur iPhone, avec le même logo, les bons onglets et sans achat ni bouton Facebook.

## Validation avant envoi

1. Installer le nouveau build sur un iPhone et relever son numéro dans Réglages de l’app.
2. Tester le micro et la reconnaissance vocale autorisés puis refusés, la dictée dans le récit, la transcription d’un audio iPhone, l’écoute et la suppression.
3. Tester hors connexion le récit écrit et la recherche locale du Grimoire.
4. Tester la connexion et la synchronisation avec un compte jetable ; demander sa suppression et confirmer le résultat sur le serveur.
5. Ouvrir l’annuaire des Sept Sœurs et le journal local, enregistrer puis supprimer une observation, accéder à l’inscription ; vérifier les ressources sans bandeau cookies, offre d’achat ni ouverture Facebook dans l’app mobile.
6. Vérifier les captures, les URL d’assistance/confidentialité, les coordonnées de relecture et le compte destiné à Apple.

## Construire et transmettre

```sh
npm ci
npm run typecheck
npm run lint
npm test
npx eas-cli@latest build --platform ios --profile production --clear-cache
```

Relever l’identifiant EAS du build 1.0.2 obtenu. Pour transmettre ce build précis :

```sh
npx eas-cli@latest submit --platform ios --id ID_DU_BUILD_EAS
```

Compléter les informations de relecture et le statut de commerçant UE si nécessaire. La transmission EAS ne remplit pas automatiquement ces rubriques et ne déclenche pas une publication garantie.
