import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Eyebrow, Field, GoldButton, Notice, OutlineButton, Screen, Title } from '../../components/ui';
import { EMOTIONS, validateDream, type Emotion } from '../../lib/model';
import { useSession } from '../../lib/session';
import { colors, fonts, radius, space } from '../../lib/theme';

const today = () => new Date().toISOString().slice(0, 10);

export default function Reve() {
  const { addDream, user, oniEnabled } = useSession();
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [dreamDate, setDreamDate] = useState(today());
  const [emotion, setEmotion] = useState<Emotion | undefined>();
  const [intensity, setIntensity] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

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
              user
                ? oniEnabled
                  ? 'Votre rêve est dans votre Grimoire. Pour qu’Oni le lise, ouvrez-le et touchez « Demander une lecture à Oni » : la lecture apparaîtra dans l’onglet Lectures.'
                  : 'Votre rêve est dans votre Grimoire. Quand Oni l’aura lu, sa lecture apparaîtra dans l’onglet Lectures.'
                : 'Votre rêve est gardé sur cet appareil. Connectez-vous pour qu’il rejoigne votre Grimoire et puisse être lu par Oni.'
            }
          />
        )}

        <Card style={{ gap: space.lg }}>
          <Text style={st.oniListens}>Oni vous écoute.</Text>
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
          <Body muted style={{ fontSize: 13 }}>
            Racontez sans chercher à comprendre. Qui était là ? Où étiez-vous ? Que voyiez-vous, entendiez-vous ou
            ressentiez-vous ? Vous pouvez écrire dans le désordre. Pour dicter, touchez le micro 🎙 du clavier.
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
          <GoldButton label="Garder dans mon Grimoire" onPress={submit} loading={busy} />
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
