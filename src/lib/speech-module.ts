type SpeechModule = typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

export function getSpeechModule(): SpeechModule | null {
  try {
    // Le chargement différé permet d’afficher un message dans Expo Go au lieu d’un écran d’erreur.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-speech-recognition').ExpoSpeechRecognitionModule as SpeechModule;
  } catch { return null; }
}
