import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Image, type ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '../i18n';
import { SISTERS } from '../lib/content';
import { listEmotions } from '../lib/naia';
import { currentOwner, listPalmReadings } from '../lib/palm';
import { readRitual, ritualToday, withGesture, type RitualToday } from '../lib/rituel';
import { KEYS, local } from '../lib/storage';
import { colors, fonts, radius, space } from '../lib/theme';

const PICTO_CARTE = require('../../assets/images/nav-oracle.png');
const portrait = (slug: string) => SISTERS.find((x) => x.slug === slug)?.image as ImageSourcePropType;

const EMPTY: RitualToday = { carte: false, emotion: false, main: false, count: 0, streak: 0 };

/** Trois gestes du jour : une carte (Oracle), une émotion (Naïa), la main (Terra). */
export function RituelDuJour({ refreshKey = 0, onEmotion }: { refreshKey?: number; onEmotion?: () => void }) {
  const [state, setState] = useState<RitualToday>(EMPTY);
  const [bar] = useState(() => new Animated.Value(0));

  const load = useCallback(() => {
    let active = true;
    Promise.all([readRitual(), listEmotions(), listPalmReadings()]).then(([store, emotions, palms]) => {
      if (!active) return;
      const now = new Date();
      const today = ritualToday(store, emotions, palms, now);
      setState(today);
      // Un geste fait aujourd'hui fait avancer la série une fois.
      if (today.count > 0) {
        const next = withGesture(store, now);
        if (next !== store) local.setJson(`${KEYS.rituel}:${currentOwner()}`, next).catch(() => undefined);
      }
    }, () => undefined);
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(load);
  useEffect(load, [refreshKey, load]);
  useEffect(() => {
    Animated.timing(bar, { toValue: state.count / 3, duration: 700, useNativeDriver: false }).start();
  }, [state.count, bar]);

  const gestes = [
    { key: 'carte', img: PICTO_CARTE, round: false, title: 'Ta carte', sub: 'Un éclairage pour aujourd’hui', done: state.carte, go: () => router.navigate('/oracle') },
    { key: 'emotion', img: portrait('naia'), round: true, title: 'Ton émotion', sub: 'L’accueillir avec Naïa', done: state.emotion, go: () => onEmotion?.() },
    {
      key: 'main', img: portrait('terra'), round: true, title: 'Ta main', sub: 'Revenir au corps avec Terra', done: state.main,
      go: () => router.push({ pathname: '/page', params: { path: '/terra-gardienne-de-lancrage/', title: 'Terra' } }),
    },
  ];
  const foot =
    state.count === 3
      ? t('Ton rituel est accompli. Reviens demain : le Cercle garde le fil.')
      : state.count === 0
        ? t('Trois gestes de quelques minutes. Commence par celui qui t’appelle.')
        : t(3 - state.count > 1 ? 'Encore {n} gestes pour accomplir ton rituel.' : 'Encore {n} geste pour accomplir ton rituel.', { n: 3 - state.count });

  return (
    <View style={st.box} accessibilityLabel={t('Ton rituel du jour : {n} gestes sur 3', { n: state.count })}>
      <View style={st.head}>
        <Text style={st.title} accessibilityRole="header">{t('Ton rituel du jour')}</Text>
        <Text style={st.meta}>
          {state.count} / 3{state.streak > 1 ? ` · 🔥 ${t('{n} jours', { n: state.streak })}` : ''}
        </Text>
      </View>
      <View style={st.row}>
        {gestes.map((g) => (
          <Pressable
            key={g.key}
            onPress={g.go}
            style={({ pressed }) => [st.geste, g.done && st.done, pressed && { transform: [{ scale: 0.97 }] }]}
            accessibilityRole="button"
            accessibilityLabel={`${t(g.title)}. ${t(g.sub)}${g.done ? ` (${t('fait aujourd’hui')})` : ''}`}
          >
            {g.done && <Text style={st.check}>✓</Text>}
            <Image source={g.img} style={g.round ? st.portrait : st.picto} resizeMode={g.round ? 'cover' : 'contain'} accessibilityIgnoresInvertColors />
            <Text style={st.gTitle}>{t(g.title)}</Text>
            <Text style={st.gSub}>{t(g.sub)}</Text>
          </Pressable>
        ))}
      </View>
      <View style={st.track}>
        <Animated.View style={[st.fill, { width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <Text style={st.foot}>{foot}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  box: { gap: space.sm, padding: space.md, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(216,182,107,0.28)', backgroundColor: 'rgba(42,30,70,0.45)' },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  title: { fontFamily: fonts.title, fontSize: 22, color: colors.text },
  meta: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.gold },
  row: { flexDirection: 'row', gap: 8 },
  geste: { flex: 1, alignItems: 'center', gap: 4, minHeight: 112, paddingVertical: 12, paddingHorizontal: 6, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' },
  done: { borderColor: 'rgba(105,189,125,0.65)', backgroundColor: 'rgba(105,189,125,0.1)' },
  check: { position: 'absolute', top: 6, right: 8, width: 20, height: 20, borderRadius: 10, overflow: 'hidden', textAlign: 'center', lineHeight: 20, fontSize: 11, fontWeight: '900', color: '#0b1a10', backgroundColor: '#69bd7d' },
  picto: { width: 44, height: 44, borderRadius: 12 },
  portrait: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(216,182,107,0.6)' },
  gTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text, textAlign: 'center' },
  gSub: { fontFamily: fonts.body, fontSize: 11, lineHeight: 14, color: colors.muted, textAlign: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: '#8fbf7a' },
  foot: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.muted, textAlign: 'center' },
});
