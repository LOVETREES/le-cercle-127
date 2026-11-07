# Validation locale — version 1.0.1

Rapport historique de préparation, avant l’envoi du build 10. Pour les correctifs suivants, voir [CORRECTIF-1.0.2.md](CORRECTIF-1.0.2.md).

Date : 7 novembre 2026. Source : archive Expo fournie, corrigée dans cet environnement cloud. Le choix de l’utilisateur est de garder les tests locaux ; aucune suppression de compte réel n’a été tentée.

## Résultats

| Contrôle | Résultat et portée |
|---|---|
| TypeScript et lint | Réussis |
| Tests automatisés | 93 tests réussis : modèle, lecture, API simulée, session, offres, Facebook, nettoyage HTML |
| Export Expo | iOS et Android compilés en bundles Hermes ; export web réussi. Aucun binaire signé |
| Docker | Image de développement construite, Compose et contrôle de santé réussis |
| Micro dans Chromium | Périphérique simulé : enregistrement, arrêt, sauvegarde IndexedDB, conservation après rechargement, écoute et suppression réussis |
| Refus du micro | Message visible et accès à la saisie écrite vérifiés |
| Démonstration | Données fictives séparées, ajout local, lecture d’exemple, sortie sans perte du brouillon personnel |
| Navigation | Cinq onglets exercés dans le navigateur ; zone tactile corrigée dans le code |
| Offres payantes | Tests sur l’encart réel, variantes de prix, contenu dynamique et destinations bloquées |
| Facebook | Tests sur les contrôles des sept pages ; 19 liens retirés des copies HTML complètes, liens de dialogue conservés |
| Suivi dans les pages | Scripts/pixels connus retirés avant rendu mobile ; tests du nettoyage HTML réussis |
| API de confidentialité | Consultation publique : le serveur renvoie oni_enabled=false, le code ferme les demandes d’IA |
| API de compte | Réponses simulées seulement : consentement, erreur de suppression, succès, absence de résurrection du cache, brouillon conservé en cas d’échec |
| Icône et démarrage | Configuration introspectée : version 1.0.1, source de marque commune et description du micro. Pas de validation sur appareil |

## À vérifier avant soumission

- Installer le binaire signé sur un iPhone ; relever la version et le numéro dans Mon compte.
- Vérifier l’icône d’accueil, le démarrage, le logo de l’en-tête et les cinq boutons avec VoiceOver et au toucher.
- Enregistrer une vraie voix, la réécouter, relancer l’app, supprimer la note ; essayer aussi l’autorisation refusée et une interruption.
- Tester les pages distantes sur iPhone : chargement, absence d’offre 3,90 € et de Facebook, présence des fonctions gratuites et des choix de cookies. L’aperçu web affiche encore le site public dans ses iframes.
- Avec un compte jetable configuré de manière sécurisée, vérifier connexion, synchronisation puis suppression effective côté serveur. Ces tests sont volontairement reportés.
- Vérifier les durées réelles de conservation et mettre à jour la politique publique avec le complément préparé. Aucun réglage Make, OpenAI ou WordPress n’a été changé.
- Dans App Store Connect, renseigner les données réellement collectées, le questionnaire d’âge, les accès pour le relecteur, l’assistance et les captures du build final.

## Captures

`store/validation-web-1.0.1/` contient six captures de navigateur pour relire les écrans. Elles ne sont pas des captures d’iPhone et ne doivent pas être déposées comme telles dans App Store Connect. Les anciennes captures iOS sont conservées séparément pour éviter de présenter un ancien build comme nouveau.

## Limites

Ces résultats portent sur le code et le navigateur de cet environnement. Ils ne prouvent ni une mise à jour du Mac, ni une installation TestFlight, ni la réussite des services authentifiés, ni une acceptation Apple. Le serveur public et ses pages restent inchangés. La décision de publication appartient à Apple après examen du binaire et de sa fiche.
