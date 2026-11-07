export function appendTranscript(existing: string, next: string): string {
  const a = existing.trim(), b = next.trim();
  if (!b) return a;
  if (!a || b.startsWith(a)) return b;
  if (a === b || a.endsWith(b)) return a;
  return `${a}\n${b}`;
}

export function voiceFileExtension(uri: string): string {
  return uri.split(/[?#]/)[0].match(/\.(wav|caf|m4a|mp3|ogg)$/i)?.[1]?.toLowerCase() ?? 'm4a';
}

export function speechErrorMessage(code: string): string {
  if (code === 'not-allowed') return 'La dictée est refusée. Autorisez le micro et la reconnaissance vocale dans les réglages de l’appareil.';
  if (code === 'no-speech' || code === 'speech-timeout') return 'Aucune parole reconnue. Réessayez en parlant près du micro.';
  if (code === 'network') return 'Le service de dictée n’est pas accessible. Vérifiez la connexion puis réessayez.';
  if (code === 'language-not-supported' || code === 'service-not-allowed') return 'La reconnaissance du français n’est pas disponible. Vérifiez les langues de dictée installées sur votre appareil.';
  if (code === 'audio-capture') return 'Cet audio n’a pas pu être transcrit. Vous pouvez le réécouter ou dicter le texte directement.';
  if (code === 'interrupted') return 'La dictée a été interrompue. Le texte déjà reconnu reste disponible.';
  return 'La dictée n’a pas pu aboutir. Le texte déjà reconnu reste disponible ; vous pouvez réessayer.';
}
