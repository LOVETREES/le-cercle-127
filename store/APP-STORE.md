# Soumission App Store — version 1.0.1

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

La description ci-dessous correspond aux fonctions du code 1.0.1. Les nouvelles demandes d’IA sont fermées tant que le serveur renvoie `oni_enabled: false` ; elles ne doivent pas être présentées comme disponibles.

## Description

Le Cercle 127 est un journal de rêves privé : gardez un récit, retrouvez les symboles qui reviennent et explorez vos nuits à votre rythme.

VOTRE GRIMOIRE, MÊME HORS CONNEXION
Écrivez un rêve sans créer de compte. Le brouillon reste sur votre appareil ; avec un compte, le Grimoire écrit peut être synchronisé avec lecercle127.com.

UN CARNET VOCAL LOCAL
Enregistrez votre voix, réécoutez-la et supprimez vos audios depuis l’application. Les fichiers restent sur cet appareil et ne sont pas envoyés à une IA ni synchronisés avec votre compte. Le carnet enregistre du son ; il ne réalise pas de transcription automatique.

SYMBOLES ET REPÈRES
Cherchez un symbole dans le dictionnaire du site et relisez vos propres récits. Le Grimoire permet de rechercher des mots et d’observer les émotions et symboles que vous avez notés. Des pistes de réflexion, sans diagnostic ni prédiction.

ESSAYEZ SANS IDENTIFIANTS
La démonstration locale contient des rêves fictifs et une lecture d’exemple. Ses données sont séparées de votre carnet personnel et peuvent être effacées. Elle ne crée aucun compte serveur et ne simule pas une nouvelle lecture par l’IA.

VOS CHOIX ET VOS DONNÉES
Le micro et le rappel du matin sont facultatifs. La confidentialité est accessible dans l’app. Vous pouvez supprimer vos enregistrements, effacer les données de cet appareil et demander la suppression de votre compte depuis les réglages.

Certaines ressources sont affichées depuis lecercle127.com et nécessitent Internet. Cette version ne propose aucun achat. Les nouvelles demandes de lecture par Oni dépendent de l’activation du service ; elles ne sont jamais envoyées sans un accord explicite pour chaque rêve.

Le Cercle 127 accompagne la réflexion personnelle et ne remplace pas un professionnel de santé.

## Texte promotionnel

Gardez vos rêves, enregistrez votre voix localement et explorez les symboles. Essayez le Grimoire avec des exemples de démonstration.

## Nouveautés

Carnet vocal local avec écoute et suppression, démonstration isolée, confidentialité détaillée, consentement explicite, suppression du compte renforcée et retrait des offres payantes et liens Facebook dans l’app mobile.

## Accès pour App Review

Un mode local de démonstration est accessible depuis **Menu → Se connecter → Explorer la démonstration locale**. Il contient trois rêves fictifs et une lecture d’exemple. Il permet d’essayer l’ajout et la suppression d’un rêve, la recherche et les lectures. Il ne vérifie pas l’authentification réelle du serveur.

Le compte de test serveur documenté auparavant est `revue.apple@lecercle127.com`. Son accès n’est pas confirmé par cette révision. Avant la soumission, vérifier qu’il fonctionne et saisir le mot de passe uniquement dans les informations de relecture sécurisées d’App Store Connect. Ne pas mettre de mot de passe dans le dépôt ni dans le chat. Employer un compte jetable distinct pour tester la suppression : ne pas supprimer le compte destiné à Apple pendant ces essais.

### Notes pour le relecteur

```text
Le Cercle 127 is a French private dream journal.

The local demonstration is available from Menu > Se connecter > Explorer la démonstration locale. It contains fictional dreams and a sample reading, keeps personal drafts separate, and sends no dream to an AI service. It does not test real backend authentication. The real demo account credentials must be supplied separately in App Store Connect for reviewing account-based features.

The native Voice notebook requests microphone permission only when recording starts. Audio can be recorded, played, deleted, and retained locally. It is not automatically transcribed or uploaded.

Account deletion is in Menu > Mon compte > Supprimer mon compte. Local-only data can also be erased without an account. During local demonstration, the equivalent action deletes only demo data.

The server currently reports oni_enabled=false. New AI requests are therefore unavailable. Existing readings remain readable; the demonstration reading is explicitly fictional. When enabled, each new request requires explicit consent disclosing Make and OpenAI.

Some resource pages come from lecercle127.com. Known analytics scripts are removed before mobile rendering; payment offers and Facebook controls are filtered and those destinations are blocked. The app provides no purchase flow.

The app offers reflection tools, not medical advice, diagnosis or predictions. Contact: contact@lecercle127.com
```

## Confidentialité à déclarer

À vérifier selon le fonctionnement réellement déployé et les réglages des prestataires :

| Donnée | Fonction dans l’app | Déclaration à préparer |
|---|---|---|
| E-mail et identifiant | Création de compte et synchronisation | Collectés pour la fonctionnalité du compte, liés à son identité |
| Récits et contexte | Grimoire écrit ; IA uniquement avec accord lorsque le service est activé | Contenu utilisateur lié au compte, destinataires clairement indiqués |
| Audio du carnet | Enregistrement et écoute sur l’appareil | Pas collecté par le serveur dans cette version ; expliquer l’autorisation du micro |
| Images éventuelles dans les pages du site | Fonctions externes du site, distinctes du carnet | Contrôler leurs destinataires et leur consentement avant de déclarer leur absence |
| Mesures d’usage, journaux et ressources du site | Le chargement mobile retire les scripts de suivi connus | Vérifier la configuration effective du serveur et des prestataires ; ne pas choisir « aucune collecte » par défaut |

Le manifeste `app.json` ne remplace pas les réponses App Privacy. La politique publique doit mentionner Make, OpenAI, les audios locaux, la suppression et les durées réelles de conservation. Voir `store/CONFIDENTIALITE-APP.md` pour le complément à relire avant publication. Le serveur et les paramètres de conservation n’ont pas été modifiés ici.

## Classement par âge

Compléter le questionnaire actuellement proposé dans App Store Connect selon les contenus réels, notamment les cauchemars et toute fonction de conversation. Ne pas reprendre automatiquement les anciennes recommandations « 12+ ou 9+ ». La création de compte demande actuellement une confirmation d’au moins 15 ans ; ce seuil applicatif et le classement de la boutique sont deux choses distinctes.

## Captures

Les anciennes captures restent archivées dans `store/ios-6.9`. Les captures de validation web 1.0.1 sont séparées et ne doivent pas être présentées comme des captures d’iPhone. Les captures destinées à la boutique doivent montrer le build final réellement utilisé sur iPhone, avec le même logo, les bons onglets et sans achat ni bouton Facebook.

## Validation avant envoi

1. Installer le nouveau build sur un iPhone et relever son numéro dans Réglages de l’app.
2. Tester le micro autorisé puis refusé, l’écoute, la suppression et la persistance de l’audio après relancement.
3. Tester hors connexion le récit écrit et la recherche locale du Grimoire.
4. Tester la connexion et la synchronisation avec un compte jetable ; demander sa suppression et confirmer le résultat sur le serveur.
5. Parcourir les sept Sœurs, les ressources et la confidentialité : aucune offre d’achat ni ouverture de Facebook dans l’app mobile.
6. Vérifier les captures, les URL d’assistance/confidentialité, les coordonnées de relecture et le compte destiné à Apple.

## Construire et transmettre

```sh
npm ci
npm run typecheck
npm run lint
npm test
npx eas-cli@latest build --platform ios --profile production --clear-cache
```

Relever l’identifiant EAS du build 1.0.1 obtenu. Pour transmettre ce build précis :

```sh
npx eas-cli@latest submit --platform ios --id ID_DU_BUILD_EAS
```

Compléter les informations de relecture et le statut de commerçant UE si nécessaire. La transmission EAS ne remplit pas automatiquement ces rubriques et ne déclenche pas une publication garantie.
