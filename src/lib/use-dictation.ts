import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { appendTranscript, speechErrorMessage } from './dictation';
import { getSpeechModule } from './speech-module';
function allowSpeechService(): Promise<boolean> {
  const message = 'La transcription sur cet appareil n’est pas disponible. Le service vocal de votre téléphone ou navigateur peut envoyer cet audio à Apple, Google ou son fournisseur pour le convertir en texte. Autoriser cette transcription ?';
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(message));
  return new Promise((resolve) => Alert.alert('Transcription vocale', message, [
    { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
    { text: 'Autoriser', onPress: () => resolve(true) },
  ], { cancelable: true, onDismiss: () => resolve(false) }));
}

export function useDictation({ onTranscript, onFinal }: { onTranscript?: (text: string) => void; onFinal?: (text: string) => void } = {}) {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'idle' | 'starting' | 'listening' | 'stopping'>('idle');
  const [error, setError] = useState<string | null>(null);
  const active = useRef(false);
  const focused = useRef(false);
  const generation = useRef(0);
  const committed = useRef('');
  const latest = useRef('');
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    const module = getSpeechModule();
    const listeners = module ? [
      module.addListener('start', () => { if (active.current) setPhase('listening'); }),
      module.addListener('result', (event) => {
        if (!active.current) return;
        const next = appendTranscript(committed.current, event.results[0]?.transcript ?? '').slice(0, 20000);
        latest.current = next; setText(next); onTranscript?.(next);
        if (event.isFinal) { committed.current = next; onFinal?.(next); }
      }),
      module.addListener('error', (event) => {
        if (!active.current) return;
        active.current = false; setPhase('idle');
        if (watchdog.current) clearTimeout(watchdog.current);
        if (event.error !== 'aborted') setError(speechErrorMessage(event.error));
      }),
      module.addListener('end', () => {
        if (!active.current) return;
        active.current = false; setPhase('idle');
        if (watchdog.current) clearTimeout(watchdog.current);
        if (!latest.current) setError('Aucun texte reconnu. Réessayez ou écrivez votre récit.');
      }),
    ] : [];
    return () => {
      focused.current = false; generation.current += 1;
      const wasActive = active.current; active.current = false;
      if (watchdog.current) clearTimeout(watchdog.current);
      if (wasActive) module?.abort();
      listeners.forEach((listener) => listener.remove());
      setPhase('idle');
    };
  }, [onTranscript, onFinal]));

  const start = async (uri?: string) => {
    if (active.current || !focused.current) return;
    const current = ++generation.current;
    setError(null); setPhase('starting');
    try {
      const module = getSpeechModule();
      if (!module) throw new Error('La dictée nécessite la nouvelle version native de l’app. Elle n’est pas disponible dans Expo Go.');
      if (!module.isRecognitionAvailable()) throw new Error('La dictée n’est pas disponible sur cet appareil ou navigateur.');
      if (uri && Platform.OS !== 'ios') throw new Error('Pour obtenir du texte ici, utilisez « Dicter en texte ». La transcription des fichiers conservés est disponible sur iPhone.');
      const onDevice = Platform.OS !== 'web' && module.supportsOnDeviceRecognition();
      if (!onDevice && !await allowSpeechService()) { setPhase('idle'); return; }
      const permission = await module.requestPermissionsAsync();
      if (!focused.current || current !== generation.current) return;
      if (!permission.granted) throw new Error(speechErrorMessage('not-allowed'));
      committed.current = ''; latest.current = ''; setText('');
      active.current = true;
      module.start({ lang: 'fr-FR', interimResults: true, continuous: !uri, maxAlternatives: 1, addsPunctuation: true,
        requiresOnDeviceRecognition: onDevice, iosTaskHint: 'dictation', ...(uri ? { audioSource: { uri } } : {}),
      });
      watchdog.current = setTimeout(() => {
        if (!active.current) return;
        module.stop(); active.current = false; setPhase('idle');
        if (!latest.current) setError('La dictée n’a pas répondu. Réessayez ou écrivez votre récit.');
      }, uri ? 180000 : 120000);
    } catch (cause) {
      active.current = false; setPhase('idle');
      setError(cause instanceof Error ? cause.message : 'La dictée n’a pas pu démarrer.');
    }
  };
  const stop = () => {
    if (!active.current) return;
    setPhase('stopping'); getSpeechModule()?.stop();
    if (watchdog.current) clearTimeout(watchdog.current);
    watchdog.current = setTimeout(() => { active.current = false; setPhase('idle'); }, 5000);
  };
  return { text, setText, error, phase, active: phase !== 'idle', start, stop };
}
