import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Eyebrow, GoldButton, Notice, OutlineButton, Title } from '../../components/ui';
import { EMOTIONS, readingSections } from '../../lib/model';
import { splitContext } from '../../lib/oni-questions';
import { useSession, type OniOutcome } from '../../lib/session';
import { dailyReadingUsed } from '../../lib/oni-daily';
import { colors, fonts, space } from '../../lib/theme';
import { t } from '../../i18n';

function ask(title: string, message: string, action: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
      { text: action, onPress: () => resolve(true) },
    ]),
  );
}

function report(title: string) {
  const body = t('Rêve : « {v0} »\n\nCe qui ne va pas dans cette lecture :\n', { v0: title });
  Linking.openURL(`mailto:contact@lecercle127.com?subject=${encodeURIComponent(t('Signaler une lecture d’Oni'))}&body=${encodeURIComponent(body)}`).catch(() => undefined);
}

export default function DreamDetail() {
  const { id, lire } = useLocalSearchParams<{ id: string; lire?: string }>();
  const { dreams, removeDream, exploreWithOni, oniEnabled, oniRequested, user, isDemo } = useSession();
  const dream = dreams.find((d) => d.id === id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OniOutcome | null>(null);
  const [dailyUsed, setDailyUsed] = useState(false);
  const autoAsked = useRef(false);
  useEffect(() => {
    let active = true;
    dailyReadingUsed().then((u) => active && setDailyUsed(u), () => undefined);
    return () => { active = false; };
  }, [outcome]);
  const canAsk = !!dream && oniEnabled && !!user && !isDemo && !dream.pending && !dream.oniReading && !oniRequested.includes(dream.id);

  async function explore() {
    if (!dream) return;
    // Consentement explicite à chaque envoi au service d'IA (politique de confidentialité).
    const ok = await ask(
      t('Demander une lecture à Oni ?'),
      t('La demande passe par Make, qui reçoit votre identifiant de rêve et votre jeton de session pour retrouver le récit. Le titre, le récit et son contexte sont ensuite traités par OpenAI pour préparer une lecture. Votre lecture du jour s’affiche tout de suite et une personne du Cercle la relit ensuite ; les suivantes sont relues avant de vous parvenir. Les données de l’API OpenAI ne servent pas à entraîner les modèles par défaut ; des journaux techniques peuvent être conservés selon les réglages du prestataire. Aucun enregistrement audio n’est envoyé. Acceptez-vous cet envoi pour ce rêve ?'),
      t('Envoyer à Oni'),
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      setOutcome(await exploreWithOni(dream.id, ok));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Oni n’a pas pu répondre pour le moment.'));
    } finally {
      setBusy(false);
    }
  }

  // Venu du formulaire (« Qu'en dit Oni ? ») : l'accord est demandé tout de suite, une seule fois.
  useEffect(() => {
    if (lire === '1' && canAsk && !autoAsked.current && !outcome) {
      autoAsked.current = true;
      void explore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lire, canAsk]);

  if (!dream) {
    return (
      <View style={st.empty}>
        <Body muted>{t('Ce rêve n’est plus dans votre Grimoire.')}</Body>
      </View>
    );
  }

  const emotionRaw = EMOTIONS.find((e) => e.value === dream.emotion)?.label;
  const emotion = emotionRaw ? t(emotionRaw) : undefined;


  return (
    <ScrollView style={{ backgroundColor: colors.night }} contentContainerStyle={st.content}>
      <View style={{ gap: space.sm }}>
        {isDemo && <Notice text={t('Démonstration locale : les rêves et lectures présentés sont des exemples fictifs. Aucun envoi à l’IA.')} />}
        <Eyebrow>
          {dream.dreamDate}
          {emotion ? ` · ${emotion}` : ''}
          {dream.intensity ? t(' · intensité {v0}/5', { v0: dream.intensity }) : ''}
        </Eyebrow>
        <Title>{dream.title}</Title>
        {dream.pending && <Notice text={t('Ce rêve est gardé sur cet appareil. Il sera ajouté à votre Grimoire en ligne dès que vous serez connecté·e.')} />}
      </View>

      <Text style={st.story} selectable>
        {splitContext(dream.story).story}
      </Text>

      {splitContext(dream.story).context ? (
        <Card>
          <Eyebrow>{t('Vos précisions pour Oni')}</Eyebrow>
          <Text style={st.symbols} selectable>{splitContext(dream.story).context?.split('\n').slice(1).join('\n')}</Text>
        </Card>
      ) : null}

      {dream.symbols && dream.symbols.length > 0 && (
        <Card>
          <Eyebrow>{t('Symboles repérés')}</Eyebrow>
          <Text style={st.symbols}>{dream.symbols.join(' · ')}</Text>
        </Card>
      )}

      {dream.oniReading ? (
        <Card>
          <Eyebrow>{t('Ce qu’Oni y voit')}</Eyebrow>
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
            {t('Des pistes, pas des vérités : vous gardez la main sur le sens. Réponse préparée avec l’aide d’une intelligence artificielle.')}
          </Body>
          <Pressable onPress={() => report(dream.title)} accessibilityRole="link">
            <Text style={st.report}>{t('Signaler cette lecture ou demander une relecture')}</Text>
          </Pressable>
        </Card>
      ) : outcome?.status === 'lue' ? (
        <Card>
          <Eyebrow>{t('Lecture du jour d’Oni')}</Eyebrow>
          {outcome.reading.split(/\n+/).map((p, i) => (
            <Text key={i} style={st.reading} selectable>{p}</Text>
          ))}
          {outcome.questions.length > 0 && (
            <View style={{ gap: 6 }}>
              <Text style={st.readingHeading}>{t('Ce que le rêve laisse ouvert')}</Text>
              {outcome.questions.map((q, i) => <Text key={i} style={st.readingLine} selectable>· {q}</Text>)}
            </View>
          )}
          {outcome.closing ? <Text style={st.closing}>{outcome.closing}</Text> : null}
          <Body muted style={{ fontSize: 12 }}>
            {t('Lecture immédiate, préparée avec l’aide d’une intelligence artificielle : une personne du Cercle la relit ensuite. Des pistes, pas des vérités : vous gardez la main sur le sens.')}
          </Body>
          {!outcome.saved && <Body muted style={{ fontSize: 12 }}>{t('Elle sera aussi rangée dans votre Grimoire dès que possible.')}</Body>}
          <Pressable onPress={() => report(dream.title)} accessibilityRole="link">
            <Text style={st.report}>{t('Signaler cette lecture ou demander une relecture')}</Text>
          </Pressable>
        </Card>
      ) : outcome?.status === 'accompagnement' ? (
        <Card>
          <Eyebrow>{t('Oni est là')}</Eyebrow>
          {outcome.reading.split(/\n+/).map((p, i) => (
            <Text key={i} style={st.readingLine} selectable>{p}</Text>
          ))}
          <GoldButton label={t('Appeler le 3114')} onPress={() => Linking.openURL('tel:3114').catch(() => undefined)} />
          <Body muted style={{ fontSize: 12 }}>
            {t('Le 3114 est le numéro national de prévention du suicide : gratuit, 24 h/24. En cas de danger immédiat, appelez le 112. Une personne du Cercle lira aussi votre rêve.')}
          </Body>
        </Card>
      ) : user && !dream.pending && oniRequested.includes(dream.id) ? (
        <Card>
          <Eyebrow>{t('Lecture en préparation')}</Eyebrow>
          {outcome && 'afterDaily' in outcome && outcome.afterDaily ? (
            <Body muted>{t('Votre lecture du jour a déjà été utilisée aujourd’hui.')}</Body>
          ) : null}
          <Body muted>
            {t('Oni lit votre rêve. Sa lecture est relue par une personne du Cercle avant d’arriver ici et dans l’onglet Lectures, en général sous 48 heures. Tirez l’écran du Grimoire vers le bas pour actualiser.')}
          </Body>
        </Card>
      ) : oniEnabled && user && !dream.pending ? (
        <Card>
          <Eyebrow>{dailyUsed ? 'Oni' : t('Lecture du jour d’Oni')}</Eyebrow>
          <Body muted>
            {dailyUsed
              ? t('Votre lecture du jour est utilisée. Oni peut quand même lire ce rêve : sa lecture sera relue par une personne avant de vous parvenir, en général sous 48 heures. Une nouvelle lecture immédiate vous attend demain.')
              : t('Une fois par jour, Oni vous répond tout de suite, en une trentaine de secondes : des hypothèses et des questions, sans vous dire quoi penser. Une personne du Cercle relit ensuite sa lecture.')}
          </Body>
          <GoldButton label={dailyUsed ? t('Demander une lecture relue') : t('Qu’en dit Oni ? Lecture immédiate')} onPress={explore} loading={busy} />
          {busy && !dailyUsed ? <Body muted style={{ fontSize: 12 }}>{t('Oni lit votre rêve…')}</Body> : null}
        </Card>
      ) : !dream.pending ? (
        <Card>
          <Eyebrow>{t('Lecture d’Oni')}</Eyebrow>
          <Body muted>
            {user
              ? isDemo ? t('La démonstration présente une lecture d’exemple dans le premier rêve.') : t('Les nouvelles demandes de lecture sont actuellement indisponibles. Vos rêves restent consultables.')
              : t('Connectez-vous pour qu’Oni puisse lire ce rêve.')}
          </Body>
        </Card>
      ) : null}

      {error && <Notice tone="error" text={error} />}

      <OutlineButton
        danger
        label={t('Supprimer ce rêve')}
        onPress={async () => {
          const ok = await ask(t('Supprimer ce rêve ?'), t('Il sera effacé définitivement de votre Grimoire.'), 'Supprimer');
          if (!ok) return;
          try {
            await removeDream(dream.id);
            router.back();
          } catch (e) {
            setError(e instanceof Error ? e.message : t('Suppression impossible.'));
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
  closing: { fontFamily: fonts.titleItalic, fontSize: 17, lineHeight: 24, color: colors.gold },
  report: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.gold, paddingVertical: 4 },
  readingLine: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
});
