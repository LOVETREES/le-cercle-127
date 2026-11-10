import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Body, GoldButton, Notice, OutlineButton, Screen } from '../components/ui';
import { AGE_RANGES, DREAM_HABITS, EMPTY_PROFILE, clearDreamer, isEmptyProfile, readDreamer, saveDreamer, type DreamerProfile } from '../lib/dreamer';
import { LIFE_AREAS } from '../lib/oni-questions';
import { colors, fonts, radius, space } from '../lib/theme';
import { t } from '../i18n';

// « Oni · Faisons connaissance » : ton histoire donne du sens à tes rêves.
const CARD = '#11122a';

function Choice({ label, on, onPress, multi }: { label: string; on: boolean; onPress: () => void; multi?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[st.opt, on && st.optOn]} accessibilityRole={multi ? 'checkbox' : 'radio'} accessibilityState={{ checked: on }}>
      <Text style={[st.optT, on && st.optTOn]}>{t(label)}</Text>
    </Pressable>
  );
}

export default function Connaissance() {
  const [p, setP] = useState<DreamerProfile>({ ...EMPTY_PROFILE });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      readDreamer().then((x) => active && setP(x), () => undefined);
      return () => {
        active = false;
      };
    }, []),
  );

  const edit = (patch: Partial<DreamerProfile>) => {
    setP((x) => ({ ...x, ...patch }));
    setSaved(false);
  };
  const toggleArea = (a: string) => edit({ areas: p.areas.includes(a) ? p.areas.filter((x) => x !== a) : [...p.areas, a] });
  const toggleHabit = (h: string) => {
    const list = (p.sleep ?? '').split(' · ').filter(Boolean);
    edit({ sleep: (list.includes(t(h)) ? list.filter((x) => x !== t(h)) : [...list, t(h)]).join(' · ') });
  };

  const save = async () => {
    setBusy(true);
    try {
      setP(await saveDreamer(p));
      setSaved(true);
    } finally {
      setBusy(false);
    }
  };

  const erase = () => {
    const go = async () => {
      await clearDreamer();
      setP({ ...EMPTY_PROFILE });
      setSaved(false);
    };
    if (Platform.OS === 'web') void go();
    else
      Alert.alert(t('Effacer ce qu’Oni sait de vous ?'), t('Votre profil de rêveur sera supprimé de cet appareil. Vos rêves ne changent pas.'), [
        { text: t('Annuler'), style: 'cancel' },
        { text: t('Effacer'), style: 'destructive', onPress: () => void go() },
      ]);
  };

  const habits = (p.sleep ?? '').split(' · ');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={st.card}>
          <Text style={st.kicker}>{t('ONI · FAISONS CONNAISSANCE')}</Text>
          <Text style={st.title}>{t('Votre histoire donne du sens à vos rêves.')}</Text>
          <Body muted>{t('Vous pouvez répondre librement, passer une question ou modifier vos réponses plus tard. Aucune identité civile n’est nécessaire.')}</Body>

          <View style={st.block}>
            <Text style={st.q}>{t('Comment souhaitez-vous qu’Oni vous appelle ?')}</Text>
            <TextInput value={p.name ?? ''} onChangeText={(name) => edit({ name: name.slice(0, 60) })} placeholder={t('Prénom ou pseudonyme')} placeholderTextColor={colors.muted} style={st.input} />
          </View>

          <View style={st.block}>
            <Text style={st.q}>{t('Votre tranche d’âge (facultatif)')}</Text>
            <View style={st.opts}>
              {AGE_RANGES.map((a) => (
                <Choice key={a.value} label={a.label} on={p.age === a.value} onPress={() => edit({ age: p.age === a.value ? undefined : a.value })} />
              ))}
            </View>
          </View>

          <View style={st.block}>
            <Text style={st.q}>{t('Quels domaines occupent votre vie en ce moment ?')}</Text>
            <View style={st.opts}>
              {LIFE_AREAS.map((a) => (
                <Choice key={a} multi label={a} on={p.areas.includes(a)} onPress={() => toggleArea(a)} />
              ))}
            </View>
          </View>

          <View style={st.block}>
            <Text style={st.q}>{t('Y a-t-il quelque chose d’important dans votre vie actuelle ?')}</Text>
            <TextInput
              value={p.now ?? ''}
              onChangeText={(now) => edit({ now: now.slice(0, 800) })}
              placeholder={t('Un événement, une relation, un changement, une décision…')}
              placeholderTextColor={colors.muted}
              multiline
              style={[st.input, st.area]}
            />
          </View>

          <View style={st.block}>
            <Text style={st.q}>{t('Vos rêves et votre sommeil')}</Text>
            <View style={st.opts}>
              {DREAM_HABITS.map((h) => (
                <Choice key={h} multi label={h} on={habits.includes(t(h))} onPress={() => toggleHabit(h)} />
              ))}
            </View>
          </View>

          <View style={st.block}>
            <Text style={st.q}>{t('Comment souhaitez-vous utiliser ces informations ?')}</Text>
            <Choice label="Oni peut s’en servir pour lire mes rêves" on={p.use === 'lectures'} onPress={() => edit({ use: 'lectures' })} />
            <Choice label="Les garder pour moi seulement" on={p.use === 'aucun'} onPress={() => edit({ use: 'aucun' })} />
            <Body muted style={{ fontSize: 12.5 }}>
              {t('Gardé sur cet appareil. Oni ne le lit qu’avec un rêve que vous lui confiez, avec votre accord, et ses lectures sont relues par une personne.')}
            </Body>
          </View>

          {saved && <Notice tone="success" text={p.name ? t('Merci, {n}. Oni vous connaît un peu mieux.', { n: p.name }) : t('Merci. Oni vous connaît un peu mieux.')} />}
          <GoldButton label={t('Enregistrer')} onPress={save} loading={busy} />
          {saved ? <OutlineButton label={t('Raconter un rêve à Oni')} onPress={() => router.navigate('/reve')} /> : null}
          {!isEmptyProfile(p) ? (
            <Pressable onPress={erase} accessibilityRole="button" style={{ alignSelf: 'center' }} hitSlop={8}>
              <Text style={st.erase}>{t('Effacer ce qu’Oni sait de moi')}</Text>
            </Pressable>
          ) : null}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: CARD, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(216,182,107,0.5)', padding: space.md, gap: space.md },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.8, color: colors.gold },
  title: { fontFamily: fonts.title, fontSize: 28, lineHeight: 32, color: colors.text },
  block: { gap: space.sm, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: 'rgba(216,182,107,0.18)' },
  q: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 22, color: colors.text },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: { borderWidth: 1, borderColor: 'rgba(170,160,230,0.45)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' },
  optOn: { backgroundColor: '#e8cf8f', borderColor: '#e8cf8f' },
  optT: { fontFamily: fonts.body, fontSize: 13.5, color: colors.text },
  optTOn: { color: '#1b1730', fontFamily: fonts.bodyBold },
  input: { borderWidth: 1, borderColor: 'rgba(216,182,107,0.3)', borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 12, color: colors.text, fontFamily: fonts.body, fontSize: 15 },
  area: { borderRadius: radius.md, minHeight: 84, textAlignVertical: 'top' },
  erase: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.danger },
});
