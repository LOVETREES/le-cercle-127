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
import { emotionFromAnswer, oniQuestions, withContext, type OniAnswer, type OniQuestion } from '../../lib/oni-questions';
import { OniAsk } from '../../components/OniAsk';
import { dailyReadingUsed } from '../../lib/oni-daily';
import { dreamerLines, isEmptyProfile, readDreamer, type DreamerProfile } from '../../lib/dreamer';
import { t } from '../../i18n';

const today = () => new Date().toISOString().slice(0, 10);

export default function Reve() {
  const { addDream, user, oniEnabled, isDemo, resolveDreamId } = useSession();
  const [lastId, setLastId] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [dailyUsed, setDailyUsed] = useState(false);
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [dreamDate, setDreamDate] = useState(today());
  const [emotion, setEmotion] = useState<Emotion | undefined>();
  const [intensity, setIntensity] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState<OniQuestion[] | null>(null);
  const [answers, setAnswers] = useState<OniAnswer[]>([]);
  const [dreamer, setDreamer] = useState<DreamerProfile | undefined>();
  useFocusEffect(useCallback(() => {
    let active = true;
    readDreamer().then((d) => active && setDreamer(d), () => undefined);
    return () => { active = false; };
  }, []));
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

  // Étape 1 : le récit. Oni le lit et choisit au plus trois questions facultatives.
  const submit = () => {
    const problem = validateDream({ title, story, dreamDate, emotion, intensity });
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setAnswers([]);
    setQuestions(oniQuestions(story, emotion));
  };

  // Étape 2 : garder le rêve, avec les précisions données (ou sans, si la personne passe).
  const save = async (withAnswers: boolean) => {
    const qs = questions ?? [];
    const given = withAnswers ? answers : [];
    const feeling = qs.map((q) => emotionFromAnswer(q, given.find((a) => a.id === q.id))).find(Boolean);
    const input = { title, story: withContext(story, qs, given, t, dreamerLines(dreamer, t)).slice(0, 20000), dreamDate, emotion: emotion ?? feeling, intensity };
    setBusy(true);
    setError(null);
    try {
      const kept = await addDream(input);
      setLastId(kept.id);
      setDailyUsed(await dailyReadingUsed().catch(() => false));
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setSaved(true);
      setQuestions(null);
      setAnswers([]);
      setTitle('');
      setStory('');
      setEmotion(undefined);
      setIntensity(undefined);
      setDreamDate(today());
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Enregistrement impossible.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={{ gap: space.sm }}>
          <Eyebrow>{t('Le Cercle des 7 Sœurs')}</Eyebrow>
          <Title>{t('Confiez-lui votre rêve')}</Title>
          <Body muted>
            {t('Posez votre rêve ici comme il vient. Il n’a pas besoin d’être clair, complet ou bien raconté. Les fragments, les sensations et les étrangetés ont aussi leur place.')}
          </Body>
        </View>

        {saved && user && oniEnabled && !isDemo && lastId ? (
          <Card style={{ gap: space.sm }}>
            <Eyebrow>{dailyUsed ? t('Votre rêve est dans votre Grimoire') : t('Lecture du jour d’Oni')}</Eyebrow>
            <Body muted>
              {dailyUsed
                ? t('Votre lecture immédiate du jour est déjà utilisée. Oni peut quand même lire ce rêve : sa lecture sera relue avant de vous parvenir, en général sous 48 heures.')
                : t('Votre rêve est gardé. Oni peut vous répondre tout de suite, une fois par jour : votre accord vous sera demandé avant l’envoi.')}
            </Body>
            <GoldButton
              label={dailyUsed ? t('Ouvrir mon rêve') : t('Qu’en dit Oni ? Lecture immédiate')}
              loading={opening}
              onPress={async () => {
                setOpening(true);
                setError(null);
                try {
                  const id = await resolveDreamId(lastId);
                  if (!id) {
                    setError(t('Votre rêve n’est pas encore arrivé dans votre Grimoire en ligne. Vérifiez votre réseau, puis ouvrez-le depuis le Grimoire.'));
                    return;
                  }
                  router.push({ pathname: '/reve/[id]', params: { id, lire: dailyUsed ? undefined : '1' } });
                  setSaved(false);
                } finally {
                  setOpening(false);
                }
              }}
            />
          </Card>
        ) : saved && (
          <Notice
            tone="success"
            text={
              isDemo ? t('Rêve gardé dans la démonstration locale, séparément de vos données personnelles.') : user
                ? oniEnabled
                  ? t('Votre rêve est dans votre Grimoire. Pour demander une lecture à Oni, ouvrez-le : votre accord sera demandé avant l’envoi. La lecture sera accessible dans l’écran Lectures.')
                  : t('Votre rêve est dans votre Grimoire. Les nouvelles demandes de lecture à Oni sont actuellement indisponibles.')
                : t('Votre rêve est gardé sur cet appareil. Connectez-vous pour le synchroniser avec votre Grimoire.')
            }
          />
        )}

        {questions && !saved ? (
          <OniAsk
            questions={questions}
            answers={answers}
            onChange={setAnswers}
            busy={busy}
            error={error}
            onSave={() => save(true)}
            onSkip={() => save(false)}
            onBack={() => setQuestions(null)}
            name={dreamer?.use === 'lectures' ? dreamer.name : undefined}
          />
        ) : (
        <>
        {dreamer && isEmptyProfile(dreamer) && !dreamer.updatedAt ? (
          <Pressable onPress={() => router.push('/connaissance')} style={st.meet} accessibilityRole="link">
            <Text style={st.meetKicker}>{t('ONI NE VOUS CONNAÎT PAS ENCORE')}</Text>
            <Text style={st.meetTitle}>{t('Faisons connaissance ›')}</Text>
            <Body muted style={{ fontSize: 13 }}>{t('Quelques mots sur vous, et Oni pourra relier vos rêves à votre vie. Tout est facultatif.')}</Body>
          </Pressable>
        ) : null}
        <Card style={{ gap: space.lg }}>
          <Text style={st.oniListens}>{t('Oni vous écoute.')}</Text>
          <OutlineButton label={t('Ouvrir mon carnet vocal')} onPress={() => router.push('/carnet-vocal')} />
          <Field label={t('Si votre rêve avait un nom…')} placeholder={t('Un titre, même provisoire')} value={title} onChangeText={setTitle} maxLength={140} />
          <Field
            label={t('Vous souvenez-vous de la nuit où il est venu ?')}
            placeholder="AAAA-MM-JJ"
            value={dreamDate}
            onChangeText={setDreamDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
          <Field
            label={t('Que s’est-il passé ?')}
            editable={!speech.active}
            required
            placeholder={t('Je me souviens que…')}
            value={story}
            onChangeText={(value) => {
              setStory(value);
              setSaved(false);
            }}
            multiline
            maxLength={20000}
          />
          <OutlineButton label={speech.active ? t('Arrêter la dictée') : t('Dicter mon rêve en texte')} disabled={speech.phase === 'starting' || speech.phase === 'stopping'} onPress={() => {
            if (speech.active) speech.stop();
            else { dictationBase.current = story; void speech.start(); }
          }} />
          {speech.active && <Notice text={t('Dictée en cours : le texte reconnu apparaît dans votre récit.')} />}
          {speech.error && <Notice tone="error" text={speech.error} />}
          <Body muted style={{ fontSize: 13 }}>
            {t('Racontez sans chercher à comprendre. Qui était là ? Où étiez-vous ? Que voyiez-vous, entendiez-vous ou ressentiez-vous ? Vous pouvez écrire dans le désordre, utiliser la dictée ci-dessus ou celle du clavier.')}
          </Body>

          <View style={{ gap: space.sm }}>
            <Text style={st.label}>{t('Quelle émotion est restée la plus présente ?')}</Text>
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
                    accessibilityLabel={t(e.label)}
                  >
                    <Text style={[st.chipText, on && st.chipTextOn]}>{t(e.label)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: space.sm }}>
            <Text style={st.label}>{t('À quel point était-elle forte ?')}</Text>
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
          <GoldButton label={t('Continuer avec Oni')} onPress={submit} disabled={speech.active} />
          <Body muted style={{ fontSize: 13 }}>
            {t('Votre récit reste sur cet appareil tant que vous n’êtes pas connecté·e. Il n’est jamais envoyé à Oni sans votre accord.')}
          </Body>
        </Card>
        </>
        )}

        {saved && (
          <View style={{ gap: space.sm }}>
            <GoldButton label={t('Voir mon Grimoire')} onPress={() => router.navigate('/grimoire')} />
            <OutlineButton label={t('Mes lectures')} onPress={() => router.push('/mes-lectures')} />
          </View>
        )}

        <View style={st.frame}>
          <Text style={st.frameTitle}>{t('Un espace symbolique et réflexif')}</Text>
          <Body muted>{t('Oni ne prédit pas l’avenir et ne remplace pas un accompagnement médical ou thérapeutique.')}</Body>
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
  meet: { borderWidth: 1, borderColor: 'rgba(216,182,107,0.5)', backgroundColor: '#11122a', borderRadius: radius.lg, padding: space.md, gap: 4 },
  meetKicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.8, color: colors.gold },
  meetTitle: { fontFamily: fonts.title, fontSize: 24, color: colors.text },
  frame: { borderLeftWidth: 3, borderLeftColor: '#7fd1c4', backgroundColor: colors.surface, borderRadius: radius.md, padding: space.lg, gap: space.sm },
  frameTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: '#cfeee8' },
});
