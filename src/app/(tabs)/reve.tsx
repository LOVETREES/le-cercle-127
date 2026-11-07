import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Eyebrow, Field, GoldButton, Notice, OutlineButton, Screen, Title } from '../../components/ui';
import { EMOTIONS, validateDream, type Emotion } from '../../lib/model';
import { useSession } from '../../lib/session';
import { colors, fonts, radius, space } from '../../lib/theme';
import { useDictation } from '../../lib/use-dictation';
import { appendTranscript } from '../../lib/dictation';
import { KEYS, local } from '../../lib/storage';

const today = () => new Date().toISOString().slice(0, 10);

export default function Reve() {
  const { addDream, user, oniEnabled, isDemo } = useSession();
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [dreamDate, setDreamDate] = useState(today());
  const [emotion, setEmotion] = useState<Emotion | undefined>();
  const [intensity, setIntensity] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const dictationBase = useRef('');
  const speech = useDictation({ onTranscript: useCallback((text: string) => {
    setStory(appendTranscript(dictationBase.current, text).slice(0, 20000)); setSaved(false);
  }, []) });
  useFocusEffect(useCallback(() => {
    let active = true;
    const key = isDemo ? KEYS.demoPendingTranscript : KEYS.pendingTranscript;
    local.getJson<string>(key, '').then(async (text) => {
      if (!active || !text) return;
      setStory((previous) => appendTranscript(previous, text).slice(0, 20000));
      setSaved(false); await local.remove([key]);
    });
    return () => { active = false; };
  }, [isDemo]));

  const submit = async () => {
    const input = { title, story, dreamDate, emotion, intensity };
    const problem = validateDream(input);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addDream(input);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setSaved(true);
      setTitle('');
      setStory('');
      setEmotion(undefined);
      setIntensity(undefined);
      setDreamDate(today());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={{ gap: space.sm }}>
          <Eyebrow>Le Cercle des 7 Sœurs</Eyebrow>
          <Title>Confiez-lui votre rêve</Title>
          <Body muted>
            Posez votre rêve ici comme il vient. Il n’a pas besoin d’être clair, complet ou bien raconté. Les fragments,
            les sensations et les étrangetés ont aussi leur place.
          </Body>
        </View>

        {saved && (
          <Notice
            tone="success"
            text={
              isDemo ? 'Rêve gardé dans la démonstration locale, séparément de vos données personnelles.' : user
                ? oniEnabled
                  ? 'Votre rêve est dans votre Grimoire. Pour demander une lecture à Oni, ouvrez-le : votre accord sera demandé avant l’envoi. La lecture sera accessible dans l’écran Lectures.'
                  : 'Votre rêve est dans votre Grimoire. Les nouvelles demandes de lecture à Oni sont actuellement indisponibles.'
                : 'Votre rêve est gardé sur cet appareil. Connectez-vous pour le synchroniser avec votre Grimoire.'
            }
          />
        )}

        <Card style={{ gap: space.lg }}>
          <Text style={st.oniListens}>Oni vous écoute.</Text>
          <OutlineButton label="Ouvrir mon carnet vocal" onPress={() => router.push('/carnet-vocal')} />
          <Field label="Si votre rêve avait un nom…" placeholder="Un titre, même provisoire" value={title} onChangeText={setTitle} maxLength={140} />
          <Field
            label="Vous souvenez-vous de la nuit où il est venu ?"
            placeholder="AAAA-MM-JJ"
            value={dreamDate}
            onChangeText={setDreamDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          <Field
            label="Que s’est-il passé ?"
            editable={!speech.active}
            required
            placeholder="Je me souviens que…"
            value={story}
            onChangeText={(t) => {
              setStory(t);
              setSaved(false);
            }}
            multiline
            maxLength={20000}
          />
          <OutlineButton label={speech.active ? 'Arrêter la dictée' : 'Dicter mon rêve en texte'} disabled={speech.phase === 'starting' || speech.phase === 'stopping'} onPress={() => {
            if (speech.active) speech.stop();
            else { dictationBase.current = story; void speech.start(); }
          }} />
          {speech.active && <Notice text="Dictée en cours : le texte reconnu apparaît dans votre récit." />}
          {speech.error && <Notice tone="error" text={speech.error} />}
          <Body muted style={{ fontSize: 13 }}>
            Racontez sans chercher à comprendre. Qui était là ? Où étiez-vous ? Que voyiez-vous, entendiez-vous ou
            ressentiez-vous ? Vous pouvez écrire dans le désordre, utiliser la dictée ci-dessus ou celle du clavier.
          </Body>

          <View style={{ gap: space.sm }}>
            <Text style={st.label}>Quelle émotion est restée la plus présente ?</Text>
            <View style={st.chips}>
              {EMOTIONS.map((e) => {
                const on = emotion === e.value;
                return (
                  <Pressable
                    key={e.value}
                    onPress={() => setEmotion(on ? undefined : e.value)}
                    style={[st.chip, on && st.chipOn]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={e.label}
                  >
                    <Text style={[st.chipText, on && st.chipTextOn]}>{e.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: space.sm }}>
            <Text style={st.label}>À quel point était-elle forte ?</Text>
            <View style={st.chips}>
              {['À peine', 'Légère', 'Présente', 'Forte', 'Très forte'].map((l, i) => {
                const v = i + 1;
                const on = intensity === v;
                return (
                  <Pressable
                    key={l}
                    onPress={() => setIntensity(on ? undefined : v)}
                    style={[st.chip, on && st.chipOn]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={l}
                  >
                    <Text style={[st.chipText, on && st.chipTextOn]}>{l}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error && <Notice tone="error" text={error} />}
          <GoldButton label="Garder dans mon Grimoire" onPress={submit} loading={busy} disabled={speech.active} />
          <Body muted style={{ fontSize: 13 }}>
            Votre récit reste sur cet appareil tant que vous n’êtes pas connecté·e. Il n’est jamais envoyé à Oni sans
            votre accord.
          </Body>
        </Card>

        {saved && (
          <View style={{ gap: space.sm }}>
            <GoldButton label="Voir mon Grimoire" onPress={() => router.navigate('/grimoire')} />
            <OutlineButton label="Lectures d’Oni" onPress={() => router.navigate('/lectures')} />
          </View>
        )}

        <View style={st.frame}>
          <Text style={st.frameTitle}>Un espace symbolique et réflexif</Text>
          <Body muted>Oni ne prédit pas l’avenir et ne remplace pas un accompagnement médical ou thérapeutique.</Body>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  oniListens: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  label: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderWidth: 1, borderColor: 'rgba(170,160,230,0.45)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: '#e8cf8f', borderColor: '#e8cf8f' },
  chipText: { fontFamily: fonts.body, fontSize: 13, color: colors.text },
  chipTextOn: { color: '#1b1730', fontFamily: fonts.bodyBold },
  frame: { borderLeftWidth: 3, borderLeftColor: '#7fd1c4', backgroundColor: colors.surface, borderRadius: radius.md, padding: space.lg, gap: space.sm },
  frameTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: '#cfeee8' },
});
