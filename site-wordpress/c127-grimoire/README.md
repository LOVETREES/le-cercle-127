# Le Cercle 127 — Grimoire 1.0.1

Cette mise à jour répare l’entrée de /grimoire/ pour les personnes déconnectées.

## Existant et cause

Le tableau de bord 1.0.0 se charge uniquement pour un compte connecté. Les visiteurs recevaient donc encore les anciens blocs de la page : dictée, déconnexion, carte en chargement puis en erreur et widget de mémoire.

## Modification minimale

Le contenu principal visiteur est remplacé après le rendu des shortcodes par une présentation du Grimoire, la création de compte et le formulaire Core 127 déjà présent. Ses champs, son nonce, son traitement serveur et ses messages de validation sont conservés. Si ce formulaire n’est plus disponible, un lien de connexion WordPress revient au Grimoire après authentification.

Le script du nouveau tableau de bord reste réservé aux sessions connectées. Les anciens scripts de dictée et de carte observés en production s’arrêtent quand leurs éléments sont absents ; les blocs correspondants sont retirés du HTML visiteur. Le widget de mémoire ajouté par le pont F127 est également retiré de cette vue.

La page demande des en-têtes de non-cache et l’exclusion du cache de page afin de séparer les rendus selon la session.

## Impact

Le changement ne crée aucune table, ne migre aucune donnée et ne remplace pas le gestionnaire d’authentification. Il s’applique uniquement au contenu principal de la page Grimoire pour un visiteur. Les styles du formulaire sont limités à cette entrée.

## Vérification automatisée

Le contrôle PHP couvre les visiteurs, la conservation du formulaire et des messages, le repli sans DOM, la création de compte, les rendus connectés, les autres pages et l’absence de script/configuration de données pour un visiteur. Exécuter php scripts/test-grimoire-entry.php puis php -n scripts/test-grimoire-entry.php depuis la racine du dépôt.

La syntaxe PHP est aussi vérifiée en CI. Ces contrôles n’authentifient aucun vrai compte et ne remplacent pas le test après installation.

## Installation

1. Tester cette mise à jour sur staging.
2. Dans Extensions → Ajouter → Téléverser une extension, envoyer le ZIP c127-grimoire-1.0.1-installable.zip.
3. Remplacer la version 1.0.0 du plugin Le Cercle 127 — Grimoire, puis vérifier son activation.
4. Purger une fois le cache de /grimoire/ dans le système de cache du site. Une page déjà mise en cache peut être servie avant l’exécution du plugin.
5. Vérifier en navigation privée : présentation, création de compte, connexion ; aucun bouton de déconnexion, carte personnelle ou erreur de récupération avant connexion.
6. Vérifier avec un compte de test : échec de connexion lisible, connexion réussie, tableau de bord, déconnexion puis retour à l’entrée visiteur. Vérifier l’onglet réseau : aucune requête vers les données de rêves ou de mémoire avant connexion.

## Retour arrière

Réinstaller la version 1.0.0 depuis le commit parent de la correction et purger le cache de /grimoire/. La mise à jour ne modifie aucune donnée utilisateur. La désactivation du plugin retire son tableau de bord et son entrée visiteur ; la page historique redevient visible.

## Limite de déploiement

Le paquet est une mise à jour du plugin du dépôt. L’accès WordPress de production n’était pas disponible pendant sa préparation ; l’activation et la purge de cache restent à effectuer sur le site.
