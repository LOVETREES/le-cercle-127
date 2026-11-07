# Version Android 1.0.2

La version Android reprend les écrans corrigés des Sept Sœurs et du journal, l’inscription accessible, le retrait du bandeau cookies dans les pages intégrées et la dictée en texte.

Sur Android 13 ou plus, le carnet capture l’audio et le texte reconnu dans la même session vocale. Le fichier WAV et sa transcription sont gardés ensemble ; ces nouveaux WAV peuvent être transcrits à nouveau. Le format réel du fichier est conservé, sans le renommer en M4A. Sur les versions plus anciennes, la dictée reste utilisable et l’enregistrement audio seul est une action distincte.

Le modèle français installé est vérifié avant de privilégier la reconnaissance locale. Si le service doit traiter la voix à distance, l’app demande un accord. La reconnaissance nécessite un service vocal compatible sur l’appareil ; la qualité réelle doit être vérifiée sur un téléphone Android.

Le profil preview produit un APK signé et incrémente le versionCode Android géré par Expo. Un APK peut être installé directement. Le profil production produit un AAB pour Google Play ; aucun envoi sur Google Play n’est déclenché par la seule construction de l’APK.

Validation avant construction : TypeScript, lint et 117 tests réussis. Les tests simulent la capture Android, l’association du résultat final au WAV, l’absence de duplication d’un événement de fin et le refus du service distant si aucun modèle français n’est installé. L’export Hermes Android réussit. Le profil preview résolu par EAS confirme APK, signature distante et incrémentation du versionCode. Aucun test de voix réelle sur téléphone Android n’est revendiqué.
