import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useCallback, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Body, Card, Field, GoldButton, Notice, OutlineButton, Screen, Title } from '../components/ui';
import { useSession } from '../lib/session';
import { deleteVoiceNote, listVoiceNotes, releaseVoiceUrls, saveVoiceNote, updateVoiceTranscript, type VoiceNote } from '../lib/voice-notes';
import { colors, fonts, space } from '../lib/theme';
import { useDictation, type SpeechRecording } from '../lib/use-dictation';
import { getSpeechModule } from '../lib/speech-module';
import { KEYS, local } from '../lib/storage';
import { locale, t } from '../i18n';

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
    setError(t('L’enregistrement a été interrompu par le système. Réessayez lorsque le micro est disponible.'));
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
  const transcribedNoteId = useRef<string | null>(null);
  const androidAudioAndText = Platform.OS === 'android' && Boolean(getSpeechModule()?.supportsRecording());
  const speech = useDictation({ onFinal: useCallback((text: string) => {
    const id = transcribedNoteId.current;
    if (!id) return;
    void updateVoiceTranscript(id, text, isDemo).then(async () => {
      const list = await listVoiceNotes(isDemo);
      if (!focused.current) return releaseVoiceUrls(list);
      releaseVoiceUrls(notesRef.current); notesRef.current = list; setNotes(list);
    }).catch(() => setError(t('Le texte est reconnu mais n’a pas pu être gardé avec l’audio. Réessayez.')));
  }, [isDemo]), onRecording: useCallback((capture: SpeechRecording) => {
    setBusy(true);
    void (async () => {
      try {
        const id = await saveVoiceNote(capture.uri, capture.durationMillis, isDemo);
        if (capture.text) await updateVoiceTranscript(id, capture.text, isDemo);
        transcribedNoteId.current = id;
        const list = await listVoiceNotes(isDemo);
        if (!focused.current) return releaseVoiceUrls(list);
        releaseVoiceUrls(notesRef.current); notesRef.current = list; setNotes(list);
        setNotice(capture.text ? t('Audio et texte gardés sur cet appareil.') : t('Audio gardé. Aucun texte n’a été reconnu ; vous pouvez réessayer la transcription.'));
      } catch { setError(t('L’enregistrement n’a pas pu être gardé. Réessayez.')); }
      finally { setBusy(false); }
    })();
  }, [isDemo]) });

  useFocusEffect(useCallback(() => {
    let active = true;
    focused.current = true;
    listVoiceNotes(isDemo).then((list) => {
      if (!active) return releaseVoiceUrls(list);
      releaseVoiceUrls(notesRef.current);
      notesRef.current = list;
      setNotes(list);
    }).catch(() => setError(t('Le carnet vocal local est indisponible. Vérifiez les autorisations de stockage.')));
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
    if (!focused.current) { releaseVoiceUrls(list); return []; }
    releaseVoiceUrls(notesRef.current);
    notesRef.current = list;
    setNotes(list);
    return list;
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
        if (!recorder.uri) throw new Error(t('Aucun fichier audio n’a été créé. Réessayez.'));
        const id = await saveVoiceNote(recorder.uri, elapsed, isDemo);
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        const list = await reload();
        setNotice(t('Enregistrement gardé sur cet appareil. Aucun audio n’a été envoyé à Oni.'));
        const saved = list.find((note) => note.id === id);
        if (saved && Platform.OS === 'ios') { transcribedNoteId.current = id; await speech.start(saved.uri); }
      } else {
        if (Platform.OS === 'web' && (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined')) {
          throw new Error(t('Le micro nécessite un navigateur compatible sur localhost ou HTTPS. Vous pouvez aussi écrire votre rêve.'));
        }
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!focused.current) return;
        if (!permission.granted) throw new Error(t('Micro refusé. Autorisez-le dans les réglages de cette app ou de ce site, puis réessayez.'));
        player.pause();
        setPlayingId(null);
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        if (!focused.current) { await setAudioModeAsync({ allowsRecording: false }); return; }
        recorder.record();
        setRecording(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Le micro n’a pas pu démarrer. Vérifiez son autorisation.'));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Title>{t('Carnet vocal')}</Title>
      <Body>{t('Gardez votre voix au réveil, puis réécoutez-la à votre rythme.')}</Body>
      {isDemo && <Notice text={t('Démonstration : ces enregistrements sont séparés de votre carnet personnel et effacés en quittant la démo.')} />}
      <Card>
        <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.bodyBold, color: recording ? colors.danger : colors.text }}>
          {recording ? t('Enregistrement en cours · {v0}', { v0: duration(recorderState.durationMillis) }) : Platform.OS === 'android' && speech.active ? t('Dictée en cours : le texte apparaît ci-dessous.') : t('Le micro démarre uniquement lorsque vous le demandez.')}
        </Text>
        <GoldButton label={recording ? Platform.OS === 'ios' ? t('Arrêter et transcrire') : t('Arrêter et garder l’enregistrement') : Platform.OS === 'android' ? speech.active ? t('Arrêter et garder le texte') : androidAudioAndText ? t('Enregistrer et transcrire') : t('Dicter mon rêve en texte') : t('Enregistrer ma voix')} onPress={() => {
          if (Platform.OS !== 'android' || recording) { void toggle(); return; }
          if (speech.active) speech.stop();
          else { player.pause(); setError(null); setNotice(null); transcribedNoteId.current = null; void speech.start(undefined, androidAudioAndText); }
        }} loading={busy || speech.phase === 'starting' || speech.phase === 'stopping'} disabled={Platform.OS !== 'android' && speech.active} />
        {Platform.OS === 'android' && !recording && <OutlineButton label={t('Enregistrer uniquement l’audio')} disabled={busy || speech.active} onPress={toggle} />}
        <Body muted>{t('Arrêtez l’enregistrement avant de quitter cet écran. Vos fichiers restent sur cet appareil et ne sont pas synchronisés avec le compte.')}</Body>
      </Card>
      {error && <Notice tone="error" text={error} />}
      {notice && <Notice tone="success" text={notice} />}
      <Card>
        <Title size={26}>{t('Ma voix en texte')}</Title>
        <Body muted>{t('La dictée utilise d’abord la reconnaissance sur l’appareil lorsqu’elle est disponible. Sinon, votre accord est demandé avant d’utiliser le service vocal du téléphone ou du navigateur.')}</Body>
        <OutlineButton label={speech.active ? t('Arrêter la transcription') : t('Dicter en texte')} disabled={recording || busy || speech.phase === 'starting' || speech.phase === 'stopping'} onPress={() => {
          if (speech.active) speech.stop();
          else { player.pause(); transcribedNoteId.current = null; void speech.start(); }
        }} />
        {speech.active && <Notice text={t('Transcription en cours… Le texte apparaît ci-dessous.')} />}
        {speech.error && <Notice tone="error" text={speech.error} />}
        <Field label={t('Texte reconnu, à relire')} value={speech.text} onChangeText={speech.setText} editable={!speech.active} multiline maxLength={20000} />
        <GoldButton label={t('Utiliser ce texte dans mon rêve')} disabled={speech.active || !speech.text.trim()} onPress={async () => {
          try { await local.setJson(isDemo ? KEYS.demoPendingTranscript : KEYS.pendingTranscript, speech.text); router.navigate('/reve'); }
          catch { setError(t('Le texte n’a pas pu être transféré au récit. Réessayez.')); }
        }} />
        <OutlineButton label={t('Garder le texte corrigé avec l’audio')} disabled={speech.active || !speech.text.trim()} onPress={async () => {
          if (!transcribedNoteId.current) { setNotice(t('Utilisez « Garder dans mon Grimoire » dans l’écran Rêve pour conserver ce texte.')); return; }
          try { await updateVoiceTranscript(transcribedNoteId.current, speech.text, isDemo); await reload(); setNotice(t('Texte gardé avec votre audio.')); }
          catch { setError(t('Le texte n’a pas pu être gardé. Réessayez.')); }
        }} />
      </Card>
      <View style={{ gap: space.md }}>
        <Title size={26}>{t('Mes enregistrements')}</Title>
        {notes.length === 0 && <Body muted>{t('Aucun enregistrement gardé pour l’instant.')}</Body>}
        {notes.map((note) => (
          <Card key={note.id}>
            <Body>{new Date(note.createdAt).toLocaleString(locale())} · {duration(note.durationMillis)}</Body>
            {note.transcript && <Body>{note.transcript}</Body>}
            {(Platform.OS === 'ios' || androidAudioAndText && /\.wav$/i.test(note.uri)) && <OutlineButton label={t('Transcrire cet enregistrement')} disabled={recording || busy || speech.active} onPress={() => { player.pause(); transcribedNoteId.current = note.id; void speech.start(note.uri); }} />}
            <OutlineButton disabled={recording || busy || speech.active} label={playingId === note.id && playback.playing ? t('Mettre en pause') : t('Écouter l’enregistrement')} onPress={() => {
              try {
                if (playingId === note.id && playback.playing) player.pause();
                else { player.replace(note.uri); player.play(); setPlayingId(note.id); }
              } catch { setError(t('Cet enregistrement n’a pas pu être lu.')); }
            }} />
            <OutlineButton disabled={recording || busy || speech.active} danger label={t('Supprimer cet enregistrement')} onPress={async () => {
              try {
                player.pause(); player.replace(null); setPlayingId(null);
                await deleteVoiceNote(note.id, isDemo); await reload();
              } catch { setError(t('L’enregistrement n’a pas pu être supprimé. Réessayez.')); }
            }} />
          </Card>
        ))}
      </View>
      <OutlineButton label={t('Écrire ou dicter un rêve dans mon Grimoire')} onPress={() => router.navigate('/reve')} />
      <Body muted>{Platform.OS === 'android' ? t('Sur Android 13 ou plus, « Enregistrer et transcrire » garde ensemble votre voix et le texte reconnu. Sur les versions plus anciennes, utilisez la dictée pour obtenir le texte. Les anciens audios restent lisibles.') : t('Sur iPhone, la transcription est proposée à l’arrêt de l’enregistrement et peut être relancée depuis chaque audio.')} {t('Relisez le texte avant de le garder dans votre Grimoire.')}</Body>
    </Screen>
  );
}
