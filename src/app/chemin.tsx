// « Mon chemin » : le chemin d'individuation (Jung) — les Sept Sœurs autour du Soi.
// Touche une Sœur : sa part du chemin, ton évolution sur six semaines, ses outils, ton prochain pas.
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';

import { SisterRing } from '../components/Chemin';
import { Body, Screen } from '../components/ui';
import { computeChemin, LEVEL_LABEL, loadChemin, MEETINGS, type Chemin } from '../lib/chemin';
import { allRecurringMotifs } from '../lib/insights';
import { useSession } from '../lib/session';
import { colors, fonts, radius, space } from '../lib/theme';
import { t } from '../i18n';

const EMPTY = computeChemin({ dreams: [], motifs: 0, motifDreams: [], emotions: [], palms: [], gestes: [], bilans: [], draws: [] });
const TREND: Record<string, string> = {
  up: 'Plus présente que les semaines d’avant',
  steady: 'Aussi présente que les semaines d’avant',
  calm: 'Plus calme ces dernières semaines',
  none: 'Pas encore de pas avec elle',
};

export default function CheminScreen() {
  const { s } = useLocalSearchParams<{ s?: string }>();
  const { dreams } = useSession();
  const recurring = useMemo(() => allRecurringMotifs(dreams), [dreams]);
  const [chemin, setChemin] = useState<Chemin>(EMPTY);
  const [picked, setPicked] = useState<string | undefined>(s);
  useFocusEffect(useCallback(() => {
    let active = true;
    loadChemin(dreams, recurring).then((c) => { if (active) setChemin(c); }, () => undefined);
    return () => { active = false; };
  }, [dreams, recurring]));

  const { width } = useWindowDimensions();
  const box = Math.min(360, width - 32);
  const cx = box / 2;
  const r = box / 2 - 46;
  const cur = chemin.stations.find((x) => x.slug === picked) ?? chemin.stations[chemin.nextIndex];
  const pos = chemin.stations.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 7;
    return { x: cx + r * Math.cos(a), y: cx + r * Math.sin(a) };
  });
  const max = Math.max(1, ...cur.weeks);
  // En français, 0 et 1 s'accordent au singulier.
  const unit = t(cur.count <= 1 ? cur.unit[0] : cur.unit[1], { n: cur.count });

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <Text style={st.h1}>{t('Devenir pleinement toi-même')}</Text>
        <Body muted>
          {t('Tes rêves te parlent de parts de toi encore dans l’ombre. Les accueillir, les relier, les vivre et choisir avec elles : c’est ton chemin. Il ne monte pas en ligne droite, il tourne autour de ton centre, comme une spirale.')}
        </Body>
      </View>

      <View style={{ width: box, height: box, alignSelf: 'center' }} accessibilityLabel={t('Le cercle des Sept Sœurs autour du Soi')}>
        <Svg width={box} height={box} style={StyleSheet.absoluteFill}>
          <Circle cx={cx} cy={cx} r={r} stroke="rgba(216,182,107,0.22)" strokeDasharray="3 6" fill="none" />
          <Polygon points={pos.map((p) => `${p.x},${p.y}`).join(' ')} stroke="rgba(216,182,107,0.3)" fill="none" />
          <Circle cx={cx} cy={cx} r={52} stroke="rgba(216,182,107,0.45)" fill={`rgba(232,207,143,${0.06 + chemin.selfShare / 300})`} />
        </Svg>
        <View style={[st.self, { left: cx - 52, top: cx - 52 }]} accessible accessibilityLabel={t('Le Soi : {n} % relié', { n: chemin.selfShare })}>
          <Text style={st.selfKicker}>{t('LE SOI')}</Text>
          <Text style={st.selfPct}>{chemin.selfShare} %</Text>
          <Text style={st.selfSub}>{t('relié')}</Text>
        </View>
        {chemin.stations.map((x, i) => (
          <Pressable key={x.slug} onPress={() => setPicked(x.slug)} style={[st.node, { left: pos[i].x - 40, top: pos[i].y - 37 }]}
            accessibilityRole="button" accessibilityState={{ selected: x.slug === cur.slug }}
            accessibilityLabel={t('{v0}, {v1} : {v2}', { v0: x.name, v1: t(x.verb), v2: t(LEVEL_LABEL[x.level]) })}>
            <SisterRing s={x} size={64} selected={x.slug === cur.slug} />
            <Text style={[st.nodeName, { color: x.color }]}>{x.name}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[st.panel, { borderColor: cur.color }]} accessibilityLiveRegion="polite">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <SisterRing s={cur} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[st.kicker, { color: cur.color }]}>{t(MEETINGS[cur.meeting - 1].title).toUpperCase()}</Text>
            <Text style={st.h2}>{cur.name} · {t(cur.verb)}</Text>
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={st.label}>{t('SA PART DE TON CHEMIN')}</Text>
          <Text style={st.text}>{t(cur.role)}</Text>
        </View>

        <View style={st.evo}>
          <View style={st.rowBetween}>
            <Text style={st.label}>{t('TON ÉVOLUTION')}</Text>
            <Text style={[st.levelTxt, { color: cur.level ? colors.gold : colors.muted }]}>{t(LEVEL_LABEL[cur.level])}</Text>
          </View>
          <View style={st.bars} accessible accessibilityLabel={t('Activité des six dernières semaines : {v0}', { v0: cur.weeks.join(', ') })}>
            {cur.weeks.map((v, i) => (
              <View key={i} style={[st.bar, { height: Math.max(4, (v / max) * 52), backgroundColor: v ? cur.color : 'rgba(169,164,184,0.25)' }]} />
            ))}
          </View>
          <View style={st.rowBetween}>
            <Text style={st.axis}>{t('il y a 6 semaines')}</Text>
            <Text style={st.axis}>{t('cette semaine')}</Text>
          </View>
          <Text style={st.text}><Text style={{ fontFamily: fonts.bodyBold }}>{unit}</Text> · <Text style={{ color: cur.trend === 'up' ? colors.success : colors.muted }}>{t(TREND[cur.trend])}</Text></Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {['Graine', 'Pousse', 'Arbre'].map((l, i) => (
              <View key={l} style={[st.step, cur.level > i ? { backgroundColor: cur.color, borderColor: cur.color } : null]}>
                <Text style={[st.stepTxt, { color: cur.level > i ? colors.night : colors.muted }]}>{t(l)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={st.label}>{t('SES OUTILS DANS LE CERCLE')}</Text>
          {cur.tools.map((tool) => (
            <Pressable key={tool.title} style={st.tool} onPress={() => router.navigate(tool.route as never)} accessibilityRole="link" accessibilityLabel={t(tool.title)}>
              <View style={{ flex: 1 }}>
                <Text style={st.toolTitle}>{t(tool.title)}</Text>
                <Text style={st.toolSub}>{t(tool.sub)}</Text>
              </View>
              <Text style={st.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={st.nextBtn} onPress={() => router.navigate(cur.tools[0].route as never)} accessibilityRole="button">
          <Text style={st.nextKicker}>{t('TON PROCHAIN PAS')}</Text>
          <Text style={st.nextText}>{t(cur.next)}</Text>
        </Pressable>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={st.h2}>{t('Les quatre rencontres du chemin')}</Text>
        <Body muted style={{ fontSize: 13 }}>{t('Inspirées de Carl Gustav Jung. On les traverse plusieurs fois, à des profondeurs différentes.')}</Body>
        {MEETINGS.map((m) => (
          <View key={m.n} style={st.meeting}>
            <Text style={st.meetingN}>{m.n}</Text>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={st.toolTitle}>{t(m.title)}</Text>
              <Text style={st.toolSub}>{t(m.text)}</Text>
              <Text style={st.meetingSis}>{chemin.stations.filter((x) => x.meeting === m.n).map((x) => x.name).join(' · ')}</Text>
            </View>
          </View>
        ))}
      </View>

      <Body muted style={{ fontSize: 12 }}>
        {t('Les indices viennent de ce que tu fais déjà dans le Cercle : rêves, motifs, émotions, gestes, bilans et tirages. Ils sont calculés sur ton téléphone. Une boussole, pas une note.')}
      </Body>
    </Screen>
  );
}

const st = StyleSheet.create({
  h1: { fontFamily: fonts.title, fontSize: 34, lineHeight: 39, color: colors.text },
  h2: { fontFamily: fonts.title, fontSize: 26, lineHeight: 30, color: colors.text },
  self: { position: 'absolute', width: 104, height: 104, alignItems: 'center', justifyContent: 'center' },
  selfKicker: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 2, color: colors.gold },
  selfPct: { fontFamily: fonts.title, fontSize: 30, color: colors.text, lineHeight: 34 },
  selfSub: { fontFamily: fonts.body, fontSize: 10, color: colors.muted },
  node: { position: 'absolute', width: 80, alignItems: 'center', gap: 2 },
  nodeName: { fontFamily: fonts.bodyBold, fontSize: 12 },
  panel: { backgroundColor: colors.surface, borderWidth: 1, borderRadius: radius.lg, padding: space.md, gap: 16 },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.6 },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.6, color: colors.muted },
  text: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  evo: { gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.surfaceRaised },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  levelTxt: { fontFamily: fonts.bodyBold, fontSize: 13 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 56 },
  bar: { flex: 1, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  axis: { fontFamily: fonts.body, fontSize: 10, color: colors.muted },
  step: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(169,164,184,0.35)' },
  stepTxt: { fontFamily: fonts.bodyBold, fontSize: 12 },
  tool: { flexDirection: 'row', alignItems: 'center', minHeight: 50, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  toolTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  toolSub: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.muted },
  chevron: { fontFamily: fonts.title, fontSize: 26, color: colors.gold },
  nextBtn: { padding: 16, borderRadius: 18, backgroundColor: '#e8cf8f', gap: 4 },
  nextKicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.6, color: '#1b1730' },
  nextText: { fontFamily: fonts.title, fontSize: 21, lineHeight: 26, color: '#1b1730' },
  meeting: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(216,182,107,0.18)' },
  meetingN: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.gold, color: colors.gold, textAlign: 'center', lineHeight: 26, fontFamily: fonts.title, fontSize: 16 },
  meetingSis: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.gold },
});
