// « La rencontre avec Oni » : l'accueil du premier lancement, une question par écran.
// Oni se présente, demande comment appeler la personne, explique pourquoi, laisse choisir
// ce qu'elle peut inclure dans ses lectures (rien n'est coché d'avance), puis invite au premier rêve.
// Tout rejoint le profil « Faisons connaissance », gardé sur l'appareil.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { AGE_RANGES, DREAM_HABITS, EMPTY_PROFILE, readDreamer, saveDreamer, type DreamerProfile } from '../lib/dreamer';
import { LIFE_AREAS } from '../lib/oni-questions';
import { markWelcomed } from '../lib/welcome';
import { colors, fonts, radius, space } from '../lib/theme';
import { t } from '../i18n';

const GOLD2 = '#f3dca0';
type Topic = 'areas' | 'now' | 'sleep' | 'age';
const TOPICS: { key: Topic; title: string; icon: string }[] = [
  { key: 'areas', title: 'Ce qui occupe ma vie', icon: 'M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z' },
  { key: 'now', title: 'Ce qui compte en ce moment', icon: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
  { key: 'sleep', title: 'Mes rêves et mon sommeil', icon: 'M15 4a8 8 0 1 0 5 13A7 7 0 0 1 15 4zM18 3l.6 1.4L20 5l-1.4.6L18 7l-.6-1.4L16 5l1.4-.6z' },
  { key: 'age', title: 'Mon âge', icon: 'M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9' },
];

function Stars() {
  return (
    <Svg width={220} height={60} viewBox="0 0 220 60" style={{ position: 'absolute', top: -14 }}>
      {[[20, 40, 1.6], [48, 14, 2.4], [170, 10, 2], [200, 38, 1.4], [110, 4, 1.2]].map(([x, y, r]) => (
        <Circle key={`${x}`} cx={x} cy={y} r={r} fill={GOLD2} opacity={0.8} />
      ))}
      <Path d="M186 26l1.4 3.4 3.4 1.4-3.4 1.4-1.4 3.4-1.4-3.4-3.4-1.4 3.4-1.4z" fill={GOLD2} />
      <Path d="M30 14l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill={GOLD2} />
    </Svg>
  );
}

function Oni({ size = 150 }: { size?: number }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: size + 24 }}>
      <Stars />
      <View style={[st.halo, { width: size + 22, height: size + 22, borderRadius: (size + 22) / 2 }]} />
      <Image source={require('../../assets/images/oni.webp')} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: colors.gold }} />
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[st.chip, on && st.chipOn]} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
      <Text style={[st.chipT, on && st.chipTOn]}>{t(label)}</Text>
    </Pressable>
  );
}

export default function Rencontre() {
  const [step, setStep] = useState(0); // 0 présentation · 1 prénom · 2 enchantée · 3 choix · 4.. questions · fin
  const [p, setP] = useState<DreamerProfile>({ ...EMPTY_PROFILE });
  const [topics, setTopics] = useState<Topic[]>([]);
  const [fade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    readDreamer().then((d) => setP(d), () => undefined);
  }, []);
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }).start();
  }, [step, fade]);

  const chosen = TOPICS.filter((x) => topics.includes(x.key)).map((x) => x.key);
  const last = 4 + chosen.length; // écran final
  const topicAt = step >= 4 && step < last ? chosen[step - 4] : undefined;
  const name = p.name?.trim();

  const later = async () => {
    await markWelcomed();
    router.back();
  };
  const finish = async (toDream: boolean) => {
    await saveDreamer({
      ...p,
      areas: topics.includes('areas') ? p.areas : [],
      now: topics.includes('now') ? p.now : undefined,
      sleep: topics.includes('sleep') ? p.sleep : undefined,
      age: topics.includes('age') ? p.age : undefined,
      use: 'lectures',
    });
    await markWelcomed();
    router.back();
    if (toDream) router.navigate('/reve');
  };
  const next = () => setStep((s) => Math.min(s + 1, last));
  const habits = (p.sleep ?? '').split(' · ');

  let body: React.ReactNode;
  let cta = t('Continuer');
  let onCta: () => void = next;
  if (step === 0) {
    body = (
      <>
        <Oni size={170} />
        <Text style={st.kicker}>{t('LE CERCLE 127')}</Text>
        <Text style={st.h1}>{t('Je suis Oni, gardienne de vos rêves.')}</Text>
        <Text style={st.vow}>{t('Je ne cherche pas à tout savoir de vous. Je cherche à comprendre ce que vos rêves signifient pour vous.')}</Text>
      </>
    );
    cta = t('Commencer');
  } else if (step === 1) {
    body = (
      <>
        <Oni size={110} />
        <Text style={st.h1}>{t('Comment souhaitez-vous que je vous appelle ?')}</Text>
        <TextInput
          value={p.name ?? ''}
          onChangeText={(v) => setP((x) => ({ ...x, name: v.slice(0, 60) }))}
          placeholder={t('Prénom ou pseudonyme')}
          placeholderTextColor={colors.muted}
          style={st.input}
          autoFocus
          returnKeyType="next"
          onSubmitEditing={next}
        />
        <Text style={st.small}>🔒 {t('Vos réponses restent sur votre téléphone.')}</Text>
      </>
    );
    cta = name ? t('Continuer') : t('Passer');
  } else if (step === 2) {
    body = (
      <>
        <Oni size={150} />
        <Text style={st.h1}>{name ? t('Enchantée, {n}.', { n: name }) : t('Enchantée.')}</Text>
        <Text style={st.lead}>{t('Un rêve parle toujours de la vie de celui ou celle qui le fait. Si vous me confiez un peu de la vôtre, mes lectures pourront s’y relier.')}</Text>
      </>
    );
  } else if (step === 3) {
    body = (
      <>
        <Text style={st.h1}>{t('Ce que je peux inclure dans mes lectures…')}</Text>
        <Text style={st.small}>{t('Rien n’est coché d’avance. Vous pourrez tout changer ou effacer plus tard.')}</Text>
        <View style={st.grid}>
          {TOPICS.map((x) => {
            const on = topics.includes(x.key);
            return (
              <Pressable
                key={x.key}
                onPress={() => setTopics((l) => (on ? l.filter((k) => k !== x.key) : [...l, x.key]))}
                style={[st.tile, on && st.tileOn]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
              >
                <View style={[st.tick, on && st.tickOn]}>{on ? <Text style={st.tickT}>✓</Text> : null}</View>
                <Svg width={40} height={40} viewBox="0 0 24 24">
                  <Path d={x.icon} fill="none" stroke={on ? GOLD2 : colors.gold} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={st.tileT}>{t(x.title)}</Text>
              </Pressable>
            );
          })}
        </View>
      </>
    );
    cta = chosen.length ? t('Continuer') : t('Rien pour l’instant');
  } else if (topicAt === 'areas') {
    body = (
      <>
        <Text style={st.h1}>{t('Quels domaines occupent votre vie en ce moment ?')}</Text>
        <View style={st.chips}>
          {LIFE_AREAS.map((a) => (
            <Chip key={a} label={a} on={p.areas.includes(a)} onPress={() => setP((x) => ({ ...x, areas: x.areas.includes(a) ? x.areas.filter((y) => y !== a) : [...x.areas, a] }))} />
          ))}
        </View>
      </>
    );
  } else if (topicAt === 'now') {
    body = (
      <>
        <Text style={st.h1}>{t('Y a-t-il quelque chose d’important dans votre vie actuelle ?')}</Text>
        <TextInput
          value={p.now ?? ''}
          onChangeText={(v) => setP((x) => ({ ...x, now: v.slice(0, 800) }))}
          placeholder={t('Un événement, une relation, un changement, une décision…')}
          placeholderTextColor={colors.muted}
          multiline
          style={[st.input, st.area]}
        />
      </>
    );
  } else if (topicAt === 'sleep') {
    body = (
      <>
        <Text style={st.h1}>{t('Vos rêves et votre sommeil')}</Text>
        <View style={st.chips}>
          {DREAM_HABITS.map((h) => (
            <Chip
              key={h}
              label={h}
              on={habits.includes(t(h))}
              onPress={() => setP((x) => {
                const l = (x.sleep ?? '').split(' · ').filter(Boolean);
                return { ...x, sleep: (l.includes(t(h)) ? l.filter((y) => y !== t(h)) : [...l, t(h)]).join(' · ') };
              })}
            />
          ))}
        </View>
      </>
    );
  } else if (topicAt === 'age') {
    body = (
      <>
        <Text style={st.h1}>{t('Votre tranche d’âge')}</Text>
        <View style={st.chips}>
          {AGE_RANGES.map((a) => (
            <Chip key={a.value} label={a.label} on={p.age === a.value} onPress={() => setP((x) => ({ ...x, age: x.age === a.value ? undefined : a.value }))} />
          ))}
        </View>
      </>
    );
  } else {
    body = (
      <>
        <Oni size={150} />
        <Text style={st.h1}>{name ? t('Merci, {n}. Racontez-moi votre premier rêve.', { n: name }) : t('Merci. Racontez-moi votre premier rêve.')}</Text>
        <Text style={st.lead}>{t('Comme il vient, même en fragments. Je vous poserai peut-être une ou deux questions, toujours facultatives.')}</Text>
      </>
    );
    cta = t('Raconter un rêve');
    onCta = () => void finish(true);
  }

  return (
    <SafeAreaView style={st.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={st.top}>
          {step > 0 ? (
            <Pressable onPress={() => setStep((s) => s - 1)} accessibilityRole="button" accessibilityLabel={t('Retour')} hitSlop={10} style={st.round}>
              <Text style={st.roundT}>←</Text>
            </Pressable>
          ) : <View />}
          <View style={st.dots}>
            {Array.from({ length: last + 1 }, (_, i) => <View key={i} style={[st.dot, i === step && st.dotOn]} />)}
          </View>
          <Pressable onPress={later} accessibilityRole="button" hitSlop={10}>
            <Text style={st.later}>{t('Plus tard')}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fade, gap: space.md, alignItems: 'center', width: '100%' }}>{body}</Animated.View>
        </ScrollView>
        <View style={st.foot}>
          <Pressable onPress={onCta} style={st.cta} accessibilityRole="button">
            <Text style={st.ctaT}>{cta}</Text>
          </Pressable>
          {step === last ? (
            <Pressable onPress={() => void finish(false)} accessibilityRole="button" hitSlop={8}>
              <Text style={st.later}>{t('Découvrir l’application d’abord')}</Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#090b1c' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingTop: space.sm, minHeight: 52 },
  round: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  roundT: { color: colors.gold, fontSize: 20 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(216,182,107,0.3)' },
  dotOn: { backgroundColor: colors.gold, width: 18 },
  later: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted },
  body: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.lg },
  halo: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(216,182,107,0.35)', backgroundColor: 'rgba(216,182,107,0.06)' },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 2.4, color: colors.gold, marginTop: space.sm },
  h1: { fontFamily: fonts.title, fontSize: 32, lineHeight: 37, color: colors.text, textAlign: 'center' },
  vow: { fontFamily: fonts.titleItalic, fontSize: 19, lineHeight: 26, color: GOLD2, textAlign: 'center' },
  lead: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.text, textAlign: 'center', opacity: 0.9 },
  small: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: 'center' },
  input: { width: '100%', borderWidth: 1, borderColor: 'rgba(216,182,107,0.45)', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: radius.md, paddingHorizontal: 18, paddingVertical: 16, color: colors.text, fontFamily: fonts.body, fontSize: 18 },
  area: { minHeight: 130, textAlignVertical: 'top', fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center', width: '100%' },
  tile: { width: '47%', aspectRatio: 1, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(216,182,107,0.3)', backgroundColor: '#11122a', alignItems: 'center', justifyContent: 'center', gap: 10, padding: space.sm },
  tileOn: { borderColor: colors.gold, backgroundColor: '#1a1934' },
  tileT: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 19, color: colors.text, textAlign: 'center' },
  tick: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(216,182,107,0.5)', alignItems: 'center', justifyContent: 'center' },
  tickOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  tickT: { color: '#1b1730', fontSize: 13, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { borderWidth: 1, borderColor: 'rgba(170,160,230,0.45)', borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10 },
  chipOn: { backgroundColor: '#e8cf8f', borderColor: '#e8cf8f' },
  chipT: { fontFamily: fonts.body, fontSize: 14.5, color: colors.text },
  chipTOn: { color: '#1b1730', fontFamily: fonts.bodyBold },
  foot: { paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.sm, alignItems: 'center' },
  cta: { alignSelf: 'stretch', backgroundColor: '#e8cf8f', borderRadius: radius.pill, paddingVertical: 17, alignItems: 'center' },
  ctaT: { fontFamily: fonts.title, fontSize: 21, color: '#1b1730' },
});
