# La Perle d'Oni dans l'application Android (achat intégré Google Play)

**Prix** : 6,99 € ; **première Perle d'un compte : 3,99 €** (produit de bienvenue). Paiement unique, sans abonnement.
Lecture approfondie préparée par Oni, **relue et validée par une personne**, livrée dans le Grimoire sous 48 h.
iPhone : l'offre reste masquée (règles d'Apple) jusqu'à l'achat intégré Apple.

```
App (Android, compte connecté) — carte « La Perle d'Oni » sur un rêve
  1. trois accords (CGV, envoi à Oni, renonciation à la rétractation)
  2. paiement Google Play via RevenueCat (react-native-purchases), compte « wp-<id WordPress> »
  3. POST /wp-json/c127-oni/v1/perle { dream_id, product_id, transaction_id }  → « en_preparation »
     (si le réseau coupe : l'achat est gardé sur le téléphone et réessayé)
RevenueCat → site : POST /wp-json/c127-oni/v1/perle-webhook (NON_RENEWING_PURCHASE, CANCELLATION)
  protégé par le secret affiché dans WordPress → Réglages → Perle d'Oni
Site, quand achat confirmé + rêve rattaché : appelle Make « Perle d'Oni (achat app, relue avant envoi) »
  (scénario 10163621, webhook …o75o668f39prrtnqai9ckk0kt3v2kuai) avec { tx, sig } seulement
Make : redemande le dossier signé (GET c127-oni/v1/perle-dossier?tx&sig, signature HMAC du site),
  prépare la lecture approfondie (450–750 mots), la range dans « Oni — Lectures de l'app à relire »
  sous la clé perle-<transaction> au statut « PERLE payée — à valider sous 48 h »
  (ou « PERLE — PRIORITÉ détresse possible »).
Relecture humaine : statut → « validée » ; le scénario « envoi des lectures validées » (10119065)
  la livre dans le Grimoire (dream_id lu dans l'enregistrement). L'app affiche « livrée ».
Remboursement : depuis la Play Console ; RevenueCat prévient le site (CANCELLATION) → « remboursée ».
```

Côté site : extension `c127-oni-du-jour` ≥ 1.2.0 (routes `perle`, `perle-webhook`, `perle-dossier`, page de
réglages, export/effacement RGPD des Perles). Aucune donnée bancaire ne passe par le site.

## Mise en service (à faire une fois)
1. Play Console → **Profil de paiement** (banque, fiscalité).
2. **RevenueCat** : projet « Le Cercle 127 », app Android `com.lecercle127.app`, identifiants du compte de service
   Google ; la **clé publique Android** (goog_…) va dans `app.json` → `extra.revenuecatAndroidKey`.
3. RevenueCat → Integrations → **Webhooks** : URL et « Authorization header value » recopiées depuis
   WordPress → Réglages → Perle d'Oni.
4. Version de l'app avec la clé, importée en test interne ; puis produits `perle_oni` (6,99 €) et
   `perle_oni_bienvenue` (3,99 €) créés dans Google Play et ajoutés dans RevenueCat.
5. Testeurs de licence (Play Console → Paramètres → Test des licences) pour acheter sans être débité.
