// « Mon chemin » : les Sept Sœurs autour du Soi, chacune avec son anneau d'évolution (graine, pousse, arbre).
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { SISTERS } from '../lib/content';
import { LEVEL_LABEL, type Chemin, type StationState } from '../lib/chemin';
import { colors, fonts, radius, space } from '../lib/theme';
import { t } from '../i18n';

const IMG = Object.fromEntries(SISTERS.map((s) => [s.slug, s.image])) as Record<string, number>;

/** Portrait de la Sœur entouré d'un anneau qui se remplit avec son niveau. */
export function SisterRing({ s, size = 62, selected = false }: { s: StationState; size?: number; selected?: boolean }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const share = s.level / 3;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(169,164,184,0.25)" strokeWidth={stroke} fill="none" />
        {share > 0 ? (
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={s.color} strokeWidth={stroke} fill="none" strokeLinecap="round"
            strokeDasharray={`${c * share} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        ) : null}
        {selected ? <Circle cx={size / 2} cy={size / 2} r={size / 2 - 0.5} stroke={s.color} strokeWidth={1} fill="none" /> : null}
      </Svg>
      <View style={{ width: size - 12, height: size - 12, borderRadius: (size - 12) / 2, overflow: 'hidden', backgroundColor: colors.night }}>
        <Image source={IMG[s.slug]} style={{ width: '100%', height: '100%' }} />
        {s.level ? null : <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,11,23,0.45)' }]} />}
      </View>
    </View>
  );
}

const levelText = (s: StationState) => t(LEVEL_LABEL[s.level]);

/** Carte de l'accueil : sept boutons (un par Sœur) et le prochain pas. */
export function CheminCard({ chemin }: { chemin: Chemin }) {
  const next = chemin.stations[chemin.nextIndex];
  return (
    <View style={st.card}>
      <View style={st.head}>
        <Text style={st.title}>{t('Mon chemin')}</Text>
        <Text style={st.count}>{t('{n} / 7 éveillées', { n: chemin.awakened })}</Text>
      </View>
      <Text style={st.intro}>
        {t('Devenir pleinement toi-même : c’est ce que Jung appelait l’individuation. Chaque Sœur veille sur une part de ce chemin et grandit avec tes gestes.')}
      </Text>
      <View style={st.grid}>
        {chemin.stations.map((s) => (
          <Pressable key={s.slug} style={st.cell} onPress={() => router.push({ pathname: '/chemin', params: { s: s.slug } })}
            accessibilityRole="button" accessibilityLabel={t('{v0}, {v1} : {v2}', { v0: s.name, v1: t(s.verb), v2: levelText(s) })}>
            <SisterRing s={s} />
            <Text style={[st.name, { color: s.color }]}>{s.name}</Text>
            <Text style={st.verb}>{t(s.verb)}</Text>
            <Text style={[st.level, { color: s.level ? colors.gold : colors.muted }]}>{levelText(s)}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={st.next} onPress={() => router.push({ pathname: '/chemin', params: { s: next.slug } })} accessibilityRole="button">
        <SisterRing s={next} size={46} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[st.nextKicker, { color: next.color }]}>{t('TON PROCHAIN PAS')}</Text>
          <Text style={st.nextText}>{next.name} : {t(next.next)}</Text>
        </View>
        <Text style={st.chevron}>›</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: space.md, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { fontFamily: fonts.title, fontSize: 28, color: colors.text },
  count: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.gold },
  intro: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 },
  cell: { width: '25%', alignItems: 'center', gap: 3 },
  name: { fontFamily: fonts.bodyBold, fontSize: 13 },
  verb: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  level: { fontFamily: fonts.bodyBold, fontSize: 11 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.surfaceRaised },
  nextKicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.4 },
  nextText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.text },
  chevron: { fontFamily: fonts.title, fontSize: 26, color: colors.gold },
});
