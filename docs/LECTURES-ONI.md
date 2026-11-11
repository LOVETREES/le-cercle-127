# Lectures d'Oni depuis l'application

**Depuis le 11 novembre 2026 : une lecture du jour immédiate.** Une fois par jour et par compte (heure de Paris),
la lecture arrive tout de suite (≈ 30 s) et une personne la relit **après coup**. Les demandes suivantes du même
jour suivent le circuit relu avant envoi décrit plus bas.

```
App : « Qu'en dit Oni ? Lecture immédiate » (accord demandé à chaque envoi)
  │  POST { dream_id, token, consent: true }
  ▼
Make « Cercle 127 — Lecture du jour d'Oni (immédiate, relue après coup) »  (scénario 10140399,
webhook …epuxbt8jq6of4mux15crbkph88rcb59j)
  1. GET /cercle127/v1/me (compte) puis /dreams → le rêve doit lui appartenir, avoir un récit, pas de lecture ;
  2. déjà demandé (clé app-<id> du store de relecture) → « deja_demandee » ;
  3. quota : store « Oni — lecture du jour (quota) » (208307), clé <compte>-<AAAA-MM-JJ Paris>
     → déjà utilisée : « quota » (l'app bascule alors sur le circuit relu ci-dessous) ;
  4. Oni (gpt-5-mini, même enveloppe F127 que d'habitude, lecture courte) ;
  5. GARDE-FOU : si le récit laisse paraître une détresse réelle (règle 14 du prompt, outputs.safety = "crisis"),
     pas d'interprétation : message d'orientation (3114, 112), rien publié, quota non consommé, et l'enregistrement
     du store de relecture passe au statut « PRIORITÉ — détresse possible, à relire vite » ;
  6. sinon : quota noté, lecture envoyée au site (/f127/v1/dream-reading-result), enregistrement au statut
     « lecture du jour publiée — à relire après coup », et réponse { status: "lue", reading, questions, closing }.
```

**Relecture après coup** : dans Make → Data stores → « Oni — Lectures de l'app à relire », filtrer les statuts
« lecture du jour publiée » et surtout « PRIORITÉ ». Une lecture à corriger se signale aussi par courriel depuis
l'app (« Signaler cette lecture ou demander une relecture » → contact@lecercle127.com).

Testé de bout en bout le 10 novembre 2026 avec le compte de démo : lecture en 28 s enregistrée sur le site,
2ᵉ demande du jour → « quota » en 2,5 s, récit de détresse → « accompagnement » sans publication. Rêves et
enregistrements de test effacés ensuite.

## Lecture relue avant envoi (au-delà de la lecture du jour)

Les autres demandes sont **relues par une personne** avant d'arriver dans le Grimoire. Le circuit passe par Make (équipe « My Team ») et ne touche pas au Master Worker du site.

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

## Mise en service

Fait le 6 novembre 2026 : jeton du site copié dans le scénario d'envoi, scénario activé, test validé de bout en
bout (rêve 18323 du compte de démo : « à valider » → « validée » → « envoyée », réponse du site 200).
Si le jeton du site change, le remplacer aussi dans ce scénario (en-tête `X-F127-Token`).

## Limites connues

- Pour corriger une lecture avant de la valider, il faut demander une nouvelle lecture : supprimer
  l'enregistrement, puis relancer la demande depuis l'app. Le texte envoyé au site est la réponse complète d'Oni.
- Le site renvoie la lecture sans retours à la ligne ; l'app la redécoupe en sections (`readingSections`).
- Le webhook de l'Intake du site est public et accepte n'importe quel `dream_id` : à protéger par une clé partagée.
