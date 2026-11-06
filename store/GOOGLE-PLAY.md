# Fiche Google Play : Le Cercle 127

À copier dans la **Google Play Console** (play.google.com/console). Les limites de Google sont respectées.

## 1. Créer l'application

**Toutes les applications → Créer une application**

| Champ | Valeur |
|---|---|
| Nom de l'application | `Le Cercle 127` |
| Langue par défaut | Français (France) – fr-FR |
| Application ou jeu | Application |
| Gratuite ou payante | Gratuite (définitif) |
| Déclarations | Cocher les règles du programme pour les développeurs et les lois américaines sur l'exportation |

## 2. Fiche principale (« Présence sur le Play Store → Fiche principale »)

**Nom (30 max)** : `Le Cercle 127`

**Description courte (80 max)** :
```
Journal de rêves : notez vos nuits, voyez ce qui revient, explorez les symboles.
```

**Description complète (4 000 max)** : la même que sur l'App Store (voir `APP-STORE.md`, section 4).

**Éléments graphiques** (dossier `store/android/`) :

| Élément | Fichier |
|---|---|
| Icône de l'application (512 × 512) | `icone-512.png` |
| Image de présentation (1024 × 500) | `banniere-1024x500.png` |
| Captures d'écran du téléphone (2 à 8) | `1-accueil-1080x1920.png`, `2-reve-…`, `3-grimoire-…`, `4-symboles-…` |

Pas de vidéo, ni de captures pour tablette ou Chromebook : ces champs sont facultatifs.

**Coordonnées** : e-mail `contact@lecercle127.com`, site `https://lecercle127.com/application/`.
Le téléphone est facultatif ici.

**Catégorie** : Application → **Style de vie**. Tags conseillés : *Journal*, *Bien-être*, *Développement personnel*.

## 3. Contenu de l'application (« Règles et programmes → Contenu de l'application »)

| Section | Réponse |
|---|---|
| **Règles de confidentialité** | `https://lecercle127.com/confidentialite-le-cercle-127/` |
| **Annonces** | Non, mon application ne contient pas d'annonces |
| **Accès à l'application** | Tout ou partie des fonctionnalités est soumis à des restrictions → ajouter les identifiants du compte de démonstration (`revue.apple@lecercle127.com` et son mot de passe), avec la consigne : « Ouvrir l'onglet Grimoire, puis Entrer dans mon Grimoire ». |
| **Classification du contenu** | Questionnaire IARC → catégorie **« Toutes les autres types d'applications »**. Violence, sexualité, langage, substances, jeux d'argent : **Non**. Interaction entre utilisateurs : **Non** (les rêves sont privés). Partage de la position : **Non**. Achats numériques : **Non**. Résultat attendu : **PEGI 3 / Tout public** ou **12**. |
| **Public cible** | Tranches **16-17 ans** et **18 ans et plus**. Ne pas cocher les tranches de moins de 13 ans, sinon les règles « Familles » s'appliquent. |
| **Application d'actualités** | Non |
| **Applications de santé** | **Aucune** fonctionnalité de santé (ni diagnostic, ni traitement, ni suivi médical) |
| **Applications financières** | Aucune |
| **ID publicitaire** | Non, l'application n'utilise pas d'identifiant publicitaire |
| **Applications gouvernementales** | Non |

## 4. Sécurité des données

**Collecte et partage**
- L'application collecte-t-elle ou partage-t-elle des données utilisateur ? **Oui**
- Toutes les données sont-elles chiffrées en transit ? **Oui** (HTTPS)
- Les utilisateurs peuvent-ils demander la suppression de leurs données ? **Oui** (dans l'application : Mon compte → Supprimer mon compte, ou par e-mail)
- URL de suppression du compte : `https://lecercle127.com/confidentialite-le-cercle-127/`

**Types de données collectées** (aucune n'est **partagée** avec des tiers à des fins propres) :

| Catégorie Google | Type | Collectée | Partagée | Facultative ? | Finalité |
|---|---|---|---|---|---|
| Informations personnelles | **Adresse e-mail** | Oui | Non | Obligatoire | Fonctionnement de l'application, gestion du compte |
| Informations personnelles | **ID utilisateur** | Oui | Non | Obligatoire | Fonctionnement de l'application, gestion du compte |
| Messages / contenu | **Autre contenu généré par l'utilisateur** (récits de rêves) | Oui | Non | Facultative (un rêve peut rester sur l'appareil) | Fonctionnement de l'application |

> L'envoi d'un rêve à Oni (prestataire d'IA OpenAI) se fait seulement avec l'accord de l'utilisateur, au nom
> de l'éditeur et pour fournir le service : selon les définitions de Google, c'est un **prestataire de services**,
> pas un « partage ».

Ne rien déclarer pour la localisation, les contacts, les photos, l'audio, les données financières, la santé, les
identifiants d'appareil ou l'historique web.

## 5. Test fermé obligatoire (nouveaux comptes personnels)

Google exige qu'un **test fermé** tourne avec **au moins 12 testeurs inscrits pendant 14 jours d'affilée** avant
de pouvoir demander l'accès à la **production**.

1. **Construire le fichier pour Google Play** (sur le Mac, dans le dossier du projet) :
   ```bash
   npx --yes eas-cli@latest build --platform android --profile production
   ```
   À la fin : **build:list**, puis télécharger le fichier `.aab` (« Application Archive URL »).
2. **Tests → Tests fermés → Créer un canal** (ou utiliser « Alpha »), puis **Testeurs** → **Créer une liste
   d'adresses e-mail** avec **au moins 12 adresses Gmail** (ou comptes Google). Prévoir 15 à 20 pour avoir de la marge.
3. **Créer une version** → importer le `.aab` à la main (Google exige que la **première** version soit importée
   manuellement), notes de version : « Première version de test du Cercle 127 ».
4. **Envoyer pour examen**. Après validation, copier le **lien d'inscription des testeurs** et l'envoyer aux
   12+ personnes : chacune clique sur « Devenir testeur », puis installe l'application depuis Google Play.
5. **Attendre 14 jours** avec les 12 testeurs toujours inscrits, en leur demandant d'ouvrir l'application
   plusieurs fois et de laisser un retour.
6. **Tableau de bord → Demander l'accès à la production** : Google pose quelques questions sur le test
   (nombre de testeurs, retours reçus, corrections apportées). Réponse en général sous 7 jours.

**Où trouver 12 testeurs** : proches, membres d'associations, abonnés Instagram/TikTok du Cercle, inscrits
à la lettre de la nouvelle lune. Message type :

```
Bonjour ! Je lance l'application Le Cercle 127 (journal de rêves) sur Google Play.
Pour la publier, Google demande 12 testeurs pendant 14 jours. Pourrais-tu m'aider ?
1. Clique sur ce lien avec ton compte Google : [LIEN D'INSCRIPTION]
2. Installe l'application depuis le Play Store
3. Garde-la installée 14 jours et ouvre-la de temps en temps
Merci du fond du cœur ✨
```

## 6. Envois suivants (automatiques)

Après la première importation manuelle, les versions suivantes peuvent partir directement :
```bash
npx --yes eas-cli@latest submit --platform android --latest
```
EAS demandera une clé de compte de service Google (fichier JSON), à créer une fois dans Google Cloud. Voir
https://expo.fyi/creating-google-service-account
