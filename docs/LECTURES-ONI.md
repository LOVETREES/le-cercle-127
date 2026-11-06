# Lectures d'Oni depuis l'application

Une lecture demandée dans l'application est **toujours relue par une personne** avant d'arriver dans le
Grimoire. Le circuit passe par Make (équipe « My Team ») et ne touche pas au Master Worker du site.

```
App : « Demander une lecture à Oni » (accord demandé à chaque envoi)
  │  POST { dream_id, token, consent: true }
  ▼
Make « Cercle 127 — App : demande de lecture d'Oni (relue) »   (webhook …494v4gvalix9usill8zoynzh2mtyt13w)
  1. lit GET /cercle127/v1/dreams avec la connexion de la personne → le rêve doit lui appartenir,
     avoir un récit et ne pas déjà avoir de lecture ;
  2. refuse une 2ᵉ demande pour le même rêve (clé app-<id>) ;
  3. répond tout de suite à l'app (« en_attente » ou « deja_demandee ») ;
  4. Oni (même prompt et même connexion OpenAI que le Master Worker) écrit la lecture ;
  5. la range dans le store « Oni — Lectures de l'app à relire » avec le statut « à valider ».
  ▼
Relecture humaine, dans Make → Data stores → « Oni — Lectures de l'app à relire »
  - lire les colonnes « Lecture d'Oni », « Résumé » et « Questions ouvertes » ;
  - mettre le statut à « validée » (ou « refusée »).
  ▼
Make « Cercle 127 — Oni : envoi des lectures validées »   (toutes les 15 minutes)
  - envoie chaque lecture « validée » à /wp-json/f127/v1/dream-reading-result,
    puis passe son statut à « envoyée » (ou « erreur », avec la réponse du site).
  ▼
La lecture apparaît dans le rêve (Grimoire) et dans l'onglet Lectures de l'app.
```

## Mise en service (une seule fois)

Le scénario d'envoi est créé **inactif** : il lui manque le jeton du site, qui ne doit pas transiter ailleurs que
dans Make.

1. Ouvrir le scénario « Onirologue — Intake … V3.7 », module HTTP, et copier la valeur `f127_token`.
2. Ouvrir « Cercle 127 — Oni : envoi des lectures validées », module HTTP → en-tête `X-F127-Token` :
   remplacer `COLLER_ICI_LE_JETON_F127` par ce jeton, enregistrer.
3. Activer le scénario (interrupteur en bas à gauche).

## Limites connues

- Pour corriger une lecture avant de la valider, il faut demander une nouvelle lecture : supprimer
  l'enregistrement, puis relancer la demande depuis l'app. Le texte envoyé au site est la réponse complète d'Oni.
- Le site renvoie la lecture sans retours à la ligne ; l'app la redécoupe en sections (`readingSections`).
- Le webhook de l'Intake du site est public et accepte n'importe quel `dream_id` : à protéger par une clé partagée.
