import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Eyebrow, GoldButton, Notice, OutlineButton, Title } from '../../components/ui';
import { EMOTIONS, readingSections } from '../../lib/model';
import { useSession } from '../../lib/session';
import { colors, fonts, space } from '../../lib/theme';

function ask(title: string, message: string, action: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
      { text: action, onPress: () => resolve(true) },
    ]),
  );
}

export default function DreamDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dreams, removeDream, exploreWithOni, oniEnabled, user } = useSession();
  const dream = dreams.find((d) => d.id === id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!dream) {
    return (
      <View style={st.empty}>
        <Body muted>Ce rêve n’est plus dans votre Grimoire.</Body>
      </View>
    );
  }

  const emotion = EMOTIONS.find((e) => e.value === dream.emotion)?.label;

  const explore = async () => {
    // Consentement explicite à chaque envoi au service d'IA (politique de confidentialité).
    const ok = await ask(
      'Demander une exploration à Oni ?',
      'Le récit de ce rêve, son titre et son émotion seront transmis à notre prestataire d’intelligence artificielle (OpenAI) pour proposer des hypothèses et des questions. Ils ne servent pas à entraîner ses modèles.',
      'Envoyer à Oni',
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await exploreWithOni(dream.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Oni n’a pas pu répondre pour le moment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.night }} contentContainerStyle={st.content}>
      <View style={{ gap: space.sm }}>
        <Eyebrow>
          {dream.dreamDate}
          {emotion ? ` · ${emotion}` : ''}
          {dream.intensity ? ` · intensité ${dream.intensity}/5` : ''}
        </Eyebrow>
        <Title>{dream.title}</Title>
        {dream.pending && <Notice text="Ce rêve est gardé sur cet appareil. Il sera ajouté à votre Grimoire en ligne dès que vous serez connecté·e." />}
      </View>

      <Text style={st.story} selectable>
        {dream.story}
      </Text>

      {dream.symbols && dream.symbols.length > 0 && (
        <Card>
          <Eyebrow>Symboles repérés</Eyebrow>
          <Text style={st.symbols}>{dream.symbols.join(' · ')}</Text>
        </Card>
      )}

      {dream.oniReading ? (
        <Card>
          <Eyebrow>Ce qu’Oni y voit</Eyebrow>
          {readingSections(dream.oniReading, dream.title).map((sec, i) => (
            <View key={i} style={{ gap: 6 }}>
              {sec.heading && sec.heading !== 'Le rêve' ? <Text style={st.readingHeading}>{sec.heading}</Text> : null}
              {sec.heading === 'Le rêve'
                ? null
                : sec.lines.map((line, j) => (
                    <Text
                      key={j}
                      style={sec.heading === 'La lecture d’Oni' ? st.reading : st.readingLine}
                      selectable
                    >
                      {sec.heading === 'Ce qui se joue' || sec.heading === 'Ce que le rêve laisse ouvert' ? `· ${line}` : line}
                    </Text>
                  ))}
            </View>
          ))}
          <Body muted style={{ fontSize: 12 }}>
            Des pistes, pas des vérités : vous gardez la main sur le sens. Réponse préparée avec l’aide d’une intelligence
            artificielle.
          </Body>
        </Card>
      ) : oniEnabled && user && !dream.pending ? (
        <Card>
          <Eyebrow>Oni</Eyebrow>
          <Body muted>Oni peut proposer des hypothèses et des questions à partir de ce rêve, sans vous dire quoi penser.</Body>
          <GoldButton label="Demander une lecture à Oni" onPress={explore} loading={busy} />
        </Card>
      ) : !dream.pending ? (
        <Card>
          <Eyebrow>Lecture d’Oni</Eyebrow>
          <Body muted>
            {user
              ? 'Oni n’a pas encore lu ce rêve. Sa lecture apparaîtra ici et dans l’onglet Lectures.'
              : 'Connectez-vous pour qu’Oni puisse lire ce rêve.'}
          </Body>
        </Card>
      ) : null}

      {error && <Notice tone="error" text={error} />}

      <OutlineButton
        danger
        label="Supprimer ce rêve"
        onPress={async () => {
          const ok = await ask('Supprimer ce rêve ?', 'Il sera effacé définitivement de votre Grimoire.', 'Supprimer');
          if (!ok) return;
          try {
            await removeDream(dream.id);
            router.back();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Suppression impossible.');
          }
        }}
      />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  content: { padding: space.md, gap: space.lg, paddingBottom: 60 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.night, padding: space.lg },
  story: { fontFamily: fonts.body, fontSize: 16, lineHeight: 26, color: colors.text },
  symbols: { fontFamily: fonts.title, fontSize: 18, lineHeight: 26, color: colors.gold },
  reading: { fontFamily: fonts.titleItalic, fontSize: 19, lineHeight: 27, color: colors.text },
  readingHeading: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.gold, marginTop: 8 },
  readingLine: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
});
