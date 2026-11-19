# D8 — Intégration Grimoire / Core 127

Statut : préparation, fusion interdite à ce stade.
Base mobile : 749b04eab2db039cc5a4460dfbc66af31d2388e7 (codex/build-testflight-20261117).
Ne pas fusionner vers main : son package.json identifie Solana Token Registry.

## Contrats constatés
- `site-wordpress/c127-grimoire/c127-grimoire.php` consomme GET cercle127/v1/dreams et GET c127-f127/v1/memories avec session WordPress et nonce.
- `src/lib/api.ts` consomme GET/DELETE cercle127/v1/me, GET/POST cercle127/v1/dreams et DELETE cercle127/v1/dreams/{id} avec Bearer.
- `site-wordpress/c127-pont-f127/c127-pont-f127.php` fournit le namespace c127-f127/v1 et dépend de F127_Runtime, F127_Observability et du fournisseur d'identité mobile.
- Fournisseurs de cercle127/v1 et classes historiques non identifiés dans les arbres inspectés. Ne pas inventer leurs contrats.
- Compose de cette branche = Expo, pas Core Python/PostgreSQL.

## Écarts à examiner
Comparaison de TestFlight avec grimoire-renouveau : +1/-0 ; Android 1.0.7 Terra : +3/-1 ; fix/draft-account-isolation : +39/-8 ; fix/grimoire-guest-entry : +32/-8.
Examiner les correctifs exclusifs, sans fusion globale automatique.

## Plan de synchronisation
1. Identifier les fournisseurs REST et leurs versions déployées, les schémas et les autorisations. Comparer les sources du Core local à un commit immuable ; ne publier ni secrets ni données personnelles (ce dépôt est public).
2. Sauvegarder les volumes et configurations locales ; tester la restauration. Installer les dépendances dans un environnement isolé, sans écriture externe ni paiement réel.
3. Préserver le contrat mobile et la session WordPress ; l'identité cryptographique Core doit être émise uniquement côté serveur. Pas de duplication de stockage ni de migration MySQL automatique non revue.
4. Conserver le récit original ; porte distincte ; Oni seule interprète. Le Memory Service des découvertes n'est pas un dépôt de rêves.
5. Recette ci-dessous puis revue et PR vers une branche applicative validée, jamais main en l'état.

## Recette bloquante (non exécutée)
- [ ] Mobile : npm ci, npm run typecheck, npm run lint, npm test, exports nécessaires.
- [ ] Core : tests existants et migrations sur base jetable ; pas de régression des découvertes.
- [ ] WordPress : syntaxe PHP, routes présentes, page privée, invité sans accès aux données.
- [ ] Deux comptes synthétiques A/B : créer rêve A, conserver texte exact, obtenir ID stable ; B ne peut ni lire ni modifier ni supprimer.
- [ ] Rêve → intake → Core → Router/Planner → dream.read → Oni → dream.reading.v1 → WordPress → Grimoire ; corrélation et provenance conservées.
- [ ] Réessai/callback dupliqué : une seule lecture et aucun doublon ; panne visible, reprise possible.
- [ ] Déconnexion/reconnexion, changement de compte, redémarrage : isolation, historique et données persistantes.
- [ ] Même rêve et lecture sur web/mobile ; dictée, journal gratuit, Labyrinthe, Oracle et SEO préservés.
- [ ] Paiement simulé uniquement, Stripe/RevenueCat sans régression ; aucun appel Make réel.
- [ ] Export/suppression et consentements vérifiés ; rollback testé ; aucune fuite de secrets dans logs.
- [ ] Vérifier résultats et commit exact ; aucune fusion tant qu'un contrôle critique reste absent.

Ce document est un contrat de recette, pas une preuve de réussite. Aucun changement d'exécution n'est introduit.
