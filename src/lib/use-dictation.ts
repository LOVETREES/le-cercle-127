import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { appendTranscript, speechErrorMessage } from './dictation';
import { getSpeechModule } from './speech-module';
import { locale, t } from '../i18n';
function allowSpeechService(): Promise<boolean> {
  const message = 'La transcription sur cet appareil n’est pas disponible. Le service vocal de votre téléphone ou navigateur peut envoyer cet audio à Apple, Google ou son fournisseur pour le convertir en texte. Autoriser cette transcription ?';
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(message));
  return new Promise((resolve) => Alert.alert(t('Transcription vocale'), message, [
    { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
    { text: 'Autoriser', onPress: () => resolve(true) },
  ], { cancelable: true, onDismiss: () => resolve(false) }));
}

export type SpeechRecording = { uri: string; text: string; durationMillis: number };
export function useDictation({ onTranscript, onFinal, onRecording }: { onTranscript?: (text: string) => void; onFinal?: (text: string) => void; onRecording?: (recording: SpeechRecording) => void } = {}) {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'idle' | 'starting' | 'listening' | 'stopping'>('idle');
  const [error, setError] = useState<string | null>(null);
  const active = useRef(false);
  const focused = useRef(false);
  const generation = useRef(0);
  const committed = useRef('');
  const latest = useRef('');
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const capture = useRef(false);
  const recordingStartedAt = useRef(0);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    const module = getSpeechModule();
    const listeners = module ? [
      module.addListener('start', () => { if (active.current) setPhase('listening'); }),
      module.addListener('audiostart', (event) => { if (capture.current) recordingStartedAt.current = event.timestamp; }),
      module.addListener('audioend', (event) => {
        if (!capture.current || !focused.current) return;
        capture.current = false;
        if (event.uri) onRecording?.({ uri: event.uri, text: latest.current, durationMillis: Math.max(0, event.timestamp - recordingStartedAt.current) });
        else setError(t('Aucun fichier audio n’a été créé. Le texte reconnu reste utilisable dans votre Grimoire.'));
      }),
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
        if (!latest.current) setError(t('Aucun texte reconnu. Réessayez ou écrivez votre récit.'));
      }),
    ] : [];
    return () => {
      focused.current = false; generation.current += 1; capture.current = false;
      const wasActive = active.current; active.current = false;
      if (watchdog.current) clearTimeout(watchdog.current);
      if (wasActive) module?.abort();
      listeners.forEach((listener) => listener.remove());
      setPhase('idle');
    };
  }, [onTranscript, onFinal, onRecording]));

  const start = async (uri?: string, persistRecording = false) => {
    if (active.current || !focused.current) return;
    const current = ++generation.current;
    setError(null); setPhase('starting');
    try {
      const module = getSpeechModule();
      if (!module) throw new Error(t('La dictée nécessite la nouvelle version native de l’app. Elle n’est pas disponible dans Expo Go.'));
      if (!module.isRecognitionAvailable()) throw new Error(t('La dictée n’est pas disponible sur cet appareil ou navigateur.'));
      if (uri && Platform.OS !== 'ios' && !(Platform.OS === 'android' && module.supportsRecording() && /\.wav$/i.test(uri))) throw new Error(t('Pour cet audio, utilisez « Dicter en texte ». Les nouveaux enregistrements Android 13 ou plus peuvent conserver audio et texte ensemble.'));
      if (persistRecording && !module.supportsRecording()) throw new Error(t('Cet appareil permet la dictée en texte, mais pas sa sauvegarde audio simultanée.'));
      const permission = await module.requestPermissionsAsync();
      if (!focused.current || current !== generation.current) return;
      if (!permission.granted) throw new Error(speechErrorMessage('not-allowed'));
      let onDevice = Platform.OS !== 'web' && module.supportsOnDeviceRecognition();
      if (onDevice && Platform.OS === 'android') {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          const locales = await Promise.race([
            module.getSupportedLocales({}),
            new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(t('Locale query timed out'))), 2500); }),
          ]);
          onDevice = locales.installedLocales.some((locale) => /^fr(?:[-_]fr)?$/i.test(locale));
        } catch { onDevice = false; }
        finally { if (timer) clearTimeout(timer); }
      }
      if (!focused.current || current !== generation.current) return;
      if (!onDevice && !await allowSpeechService()) { setPhase('idle'); return; }
      if (!focused.current || current !== generation.current) return;
      committed.current = ''; latest.current = ''; setText('');
      active.current = true; capture.current = persistRecording; recordingStartedAt.current = Date.now();
      module.start({ lang: locale(), interimResults: true, continuous: !uri, maxAlternatives: 1, addsPunctuation: true,
        requiresOnDeviceRecognition: onDevice, iosTaskHint: 'dictation', ...(uri ? { audioSource: { uri } } : {}),
        ...(persistRecording ? { recordingOptions: { persist: true } } : {}),
      });
      watchdog.current = setTimeout(() => {
        if (!active.current) return;
        module.stop(); setPhase('stopping');
        watchdog.current = setTimeout(() => { module.abort(); active.current = false; setPhase('idle'); if (!latest.current) setError(t('La dictée n’a pas répondu. Réessayez ou écrivez votre récit.')); }, 5000);
      }, uri ? 180000 : 120000);
    } catch (cause) {
      active.current = false; capture.current = false; setPhase('idle');
      setError(cause instanceof Error ? cause.message : t('La dictée n’a pas pu démarrer.'));
    }
  };
  const stop = () => {
    if (!active.current) return;
    setPhase('stopping'); getSpeechModule()?.stop();
    if (watchdog.current) clearTimeout(watchdog.current);
    watchdog.current = setTimeout(() => { getSpeechModule()?.abort(); active.current = false; setPhase('idle'); }, 5000);
  };
  return { text, setText, error, phase, active: phase !== 'idle', start, stop };
}
