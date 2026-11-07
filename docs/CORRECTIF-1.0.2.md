# Correctif 1.0.2 — retours du build 10

- Sept Sœurs : annuaire natif avec les sept portraits, accessible depuis le lien historique encodé ou ses alias. Les fiches individuelles conservent leur contenu du site.
- Chargement : l’URL canonique issue de la réponse HTML est utilisée par la WebView. Les navigations initiales et les ancres du document restent dans la page au lieu de créer des routes en boucle. Le signal DOM prêt libère le chargement ; un délai global de 25 secondes fournit une erreur et une reprise plutôt qu’un indicateur sans fin.
- Journal : écran local accessible sans compte, création, relecture et suppression des observations. La connexion et l’inscription du Grimoire sont accessibles depuis cet écran. Les anciennes données WordPress restent sur le site, accessible par un lien explicite ; elles ne sont pas prétendues synchronisées dans ce nouveau journal.
- Cookies : retrait de l’interface Complianz statique et dynamique ainsi que de ses scripts. Les scripts de mesure connus restent désactivés ; aucune acceptation automatique n’est envoyée.
- Voix : module expo-speech-recognition 58, dictée en français dans le récit et transcription des fichiers conservés sur iPhone. Résultats partiels et définitifs sont regroupés ; le texte peut être corrigé, gardé avec l’audio et transféré au Grimoire sans l’exposer dans une URL.
- Confidentialité : reconnaissance locale privilégiée ; consentement demandé pour un service vocal distant lorsque nécessaire. Autorisations micro et reconnaissance vocale dans la configuration native. Le journal et les textes temporaires sont inclus dans l’effacement local et la séparation démo/personnel.

La création d’un compte réel et la reconnaissance d’une vraie voix sur iPhone ne sont pas validées par les tests simulés. Le site public et ses extensions ne sont pas modifiés par ce correctif mobile. Ne pas présenter des tests web comme une vérification sur appareil.

## Vérifications avant construction

- TypeScript et lint réussis ; 113 tests couvrant notamment les routes encodées, les redirections canoniques, le bandeau réel de l’Oracle, le journal et les événements vocaux.
- Parcours Chromium : accueil → Sept Sœurs, journal → sauvegarde → rechargement, accès à l’inscription avec API simulée, dictée avec résultats synthétiques et transfert du texte du carnet vers le récit sans données dans l’URL.
- Exports JavaScript/Hermes iOS, Android et web réussis. Configuration native introspectée : version 1.0.2, usages micro et reconnaissance vocale présents.
- Captures de validation navigateur dans store/validation-web-1.0.2, distinctes des captures iPhone.

La création de compte n’a pas été tentée avec une identité réelle sur le serveur. La qualité et la disponibilité de la reconnaissance vocale française sur un véritable iPhone doivent encore être vérifiées après installation du nouveau binaire.
