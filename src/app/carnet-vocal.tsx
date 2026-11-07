import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useCallback, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Body, Card, GoldButton, Notice, OutlineButton, Screen, Title } from '../components/ui';
import { useSession } from '../lib/session';
import { deleteVoiceNote, listVoiceNotes, releaseVoiceUrls, saveVoiceNote, type VoiceNote } from '../lib/voice-notes';
import { colors, fonts, space } from '../lib/theme';

function duration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function CarnetVocal() {
  const { isDemo } = useSession();
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mimeType = Platform.OS === 'web' && typeof MediaRecorder !== 'undefined'
    ? ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((type) => MediaRecorder.isTypeSupported(type)) : undefined;
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: 'cache', ...(mimeType ? { web: { mimeType, bitsPerSecond: 128000 } } : {}) }, (status) => {
    if (!status.hasError && !status.mediaServicesDidReset) return;
    setRecording(false);
    setError('L’enregistrement a été interrompu par le système. Réessayez lorsque le micro est disponible.');
    void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
  });
  const recorderState = useAudioRecorderState(recorder, 250);
  const player = useAudioPlayer(null);
  const playback = useAudioPlayerStatus(player);
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const notesRef = useRef<VoiceNote[]>([]);
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const focused = useRef(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    focused.current = true;
    listVoiceNotes(isDemo).then((list) => {
      if (!active) return releaseVoiceUrls(list);
      releaseVoiceUrls(notesRef.current);
      notesRef.current = list;
      setNotes(list);
    }).catch(() => setError('Le carnet vocal local est indisponible. Vérifiez les autorisations de stockage.'));
    return () => {
      active = false; focused.current = false;
      player.pause();
      if (recorder.isRecording) {
        void recorder.stop().catch(() => undefined).finally(() => setAudioModeAsync({ allowsRecording: false }).catch(() => undefined));
        setRecording(false);
      }
      releaseVoiceUrls(notesRef.current);
      notesRef.current = [];
    };
  }, [isDemo, player, recorder]));

  const reload = async () => {
    const list = await listVoiceNotes(isDemo);
    releaseVoiceUrls(notesRef.current);
    notesRef.current = list;
    setNotes(list);
  };

  const toggle = async () => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (recording) {
        const elapsed = recorderState.durationMillis;
        await recorder.stop();
        setRecording(false);
        if (!recorder.uri) throw new Error('Aucun fichier audio n’a été créé. Réessayez.');
        await saveVoiceNote(recorder.uri, elapsed, isDemo);
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        await reload();
        setNotice('Enregistrement gardé sur cet appareil. Aucun audio n’a été envoyé à Oni.');
      } else {
        if (Platform.OS === 'web' && (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined')) {
          throw new Error('Le micro nécessite un navigateur compatible sur localhost ou HTTPS. Vous pouvez aussi écrire votre rêve.');
        }
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!focused.current) return;
        if (!permission.granted) throw new Error('Micro refusé. Autorisez-le dans les réglages de cette app ou de ce site, puis réessayez.');
        player.pause();
        setPlayingId(null);
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        if (!focused.current) { await setAudioModeAsync({ allowsRecording: false }); return; }
        recorder.record();
        setRecording(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Le micro n’a pas pu démarrer. Vérifiez son autorisation.');
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Title>Carnet vocal</Title>
      <Body>Gardez votre voix au réveil, puis réécoutez-la à votre rythme.</Body>
      {isDemo && <Notice text="Démonstration : ces enregistrements sont séparés de votre carnet personnel et effacés en quittant la démo." />}
      <Card>
        <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.bodyBold, color: recording ? colors.danger : colors.text }}>
          {recording ? `Enregistrement en cours · ${duration(recorderState.durationMillis)}` : 'Le micro démarre uniquement lorsque vous le demandez.'}
        </Text>
        <GoldButton label={recording ? 'Arrêter et garder l’enregistrement' : 'Enregistrer ma voix'} onPress={toggle} loading={busy} />
        <Body muted>Arrêtez l’enregistrement avant de quitter cet écran. Vos fichiers restent sur cet appareil et ne sont pas synchronisés avec le compte.</Body>
      </Card>
      {error && <Notice tone="error" text={error} />}
      {notice && <Notice tone="success" text={notice} />}
      <View style={{ gap: space.md }}>
        <Title size={26}>Mes enregistrements</Title>
        {notes.length === 0 && <Body muted>Aucun enregistrement gardé pour l’instant.</Body>}
        {notes.map((note) => (
          <Card key={note.id}>
            <Body>{new Date(note.createdAt).toLocaleString('fr-FR')} · {duration(note.durationMillis)}</Body>
            <OutlineButton disabled={recording || busy} label={playingId === note.id && playback.playing ? 'Mettre en pause' : 'Écouter l’enregistrement'} onPress={() => {
              try {
                if (playingId === note.id && playback.playing) player.pause();
                else { player.replace(note.uri); player.play(); setPlayingId(note.id); }
              } catch { setError('Cet enregistrement n’a pas pu être lu.'); }
            }} />
            <OutlineButton disabled={recording || busy} danger label="Supprimer cet enregistrement" onPress={async () => {
              try {
                player.pause(); player.replace(null); setPlayingId(null);
                await deleteVoiceNote(note.id, isDemo); await reload();
              } catch { setError('L’enregistrement n’a pas pu être supprimé. Réessayez.'); }
            }} />
          </Card>
        ))}
      </View>
      <OutlineButton label="Écrire ou dicter un rêve dans mon Grimoire" onPress={() => router.navigate('/reve')} />
      <Body muted>Pour transformer votre voix en texte, utilisez la dictée de votre clavier dans le champ du récit. Ce carnet conserve de l’audio et ne promet pas de transcription automatique.</Body>
    </Screen>
  );
}
