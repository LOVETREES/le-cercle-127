import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Polyline, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { AppHeader, Body, Card, Eyebrow, GoldButton, Notice, OutlineButton, Title } from '../../components/ui';
import { locale, t } from '../../i18n';
import { SISTERS } from '../../lib/content';
import { EMOTIONS, recurringSymbols, searchDreams, type Dream } from '../../lib/model';
import { listEmotions, type EmotionEntry, type EmotionKey } from '../../lib/naia';
import { listPalmReadings, type PalmReading } from '../../lib/palm';
import { doorStates, readPortes, type Door, type PortesStore } from '../../lib/portes';
import { loadRealityChecks } from '../../lib/reality-journal';
import { readRitual, type RitualStore } from '../../lib/rituel';
import { useSession } from '../../lib/session';
import { colors, fonts, radius, space } from '../../lib/theme';
import { listVoiceNotes } from '../../lib/voice-notes';
import { splitContext } from '../../lib/oni-questions';
import { ICON, iconKey, SymbolIcon } from '../../components/SymbolIcon';

/* ---------- Petits outils ---------- */
const VIOLET = '#7a68c9';
const VIOLET2 = '#a99cf0';
const GOLD2 = '#f3dca0';
const CARD = '#11122a';

const emotionLabel = (v?: string) => {
  const l = EMOTIONS.find((e) => e.value === v)?.label;
  return l ? t(l) : undefined;
};
const NAIA_LABEL: Record<EmotionKey, string> = { peur: 'Peur', colere: 'Colère', tristesse: 'Tristesse', culpabilite: 'Culpabilité', confusion: 'Confusion', soulagement: 'Soulagement' };
const naiaLabel = (k: EmotionKey) => t(NAIA_LABEL[k]);
function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });
}
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const parseDay = (iso?: string) => {
  const m = iso?.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : undefined;
};

// Tonalité d'une émotion, de −1 (lourde) à +1 (lumineuse) : pour la courbe des 30 jours.
const VALENCE: Record<string, number> = {
  joie: 1, serenite: 0.8, emerveillement: 0.9, soulagement: 0.7, surprise: 0.3, aucune: 0, autre: 0,
  confusion: -0.4, culpabilite: -0.7, tristesse: -0.8, colere: -0.9, peur: -1,
};

/* ---------- La porte en arche de l'en-tête ---------- */
function Arch() {
  return (
    <Svg width={96} height={114} viewBox="0 0 220 260">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="55%" r="55%">
          <Stop offset="0" stopColor={GOLD2} stopOpacity={0.85} />
          <Stop offset="0.45" stopColor={colors.gold} stopOpacity={0.3} />
          <Stop offset="1" stopColor={colors.gold} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="door" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f6e2a8" />
          <Stop offset="1" stopColor="#8a6a32" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={110} cy={140} rx={105} ry={120} fill="url(#glow)" />
      <Path d="M30 250V110a80 80 0 0 1 160 0v140" fill="none" stroke={colors.gold} strokeOpacity={0.35} />
      <Path d="M48 250V114a62 62 0 0 1 124 0v136" fill="none" stroke={colors.gold} strokeOpacity={0.55} />
      <Path d="M70 236V120a40 40 0 0 1 80 0v116z" fill="url(#door)" opacity={0.92} />
      <Path d="M110 82v154M70 160h80M84 120h52" stroke="#5c4420" strokeOpacity={0.35} />
      <Circle cx={110} cy={128} r={14} fill="none" stroke="#5c4420" strokeOpacity={0.5} />
      <Path d="M54 236h112M44 244h132M34 252h152" stroke={colors.gold} strokeOpacity={0.5} />
      {[[22, 40], [196, 60], [180, 20], [40, 90], [205, 140], [14, 160]].map(([x, y]) => (
        <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill={GOLD2} />
      ))}
    </Svg>
  );
}

/* ---------- Carte des portes : les 7 Sœurs ---------- */
function DoorMap({ doors, onOpen }: { doors: Door[]; onOpen: (d: Door) => void }) {
  const cx = 160, cy = 150, r = 112;
  const pts = doors.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 7;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  const fill = { ouverte: '#e9cf8d', encours: '#3b2f72', fermee: '#26263a' } as const;
  const stroke = { ouverte: '#f6e2a8', encours: VIOLET2, fermee: '#4a4a63' } as const;
  const ink = { ouverte: '#3a2a10', encours: colors.text, fermee: '#7d7c95' } as const;
  return (
    <Svg width="100%" height={260} viewBox="0 0 320 300">
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.gold} strokeOpacity={0.45} strokeWidth={1.2} />
      <Circle cx={cx} cy={cy} r={r - 34} fill="none" stroke={colors.gold} strokeOpacity={0.2} strokeDasharray="2 5" />
      {pts.map((p, i) => {
        const q = pts[(i + 3) % 7];
        return <Line key={`s${i}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={colors.gold} strokeOpacity={0.16} />;
      })}
      <Path d={`M${cx - 22} ${cy + 34}V${cy - 6}a22 22 0 0 1 44 0V${cy + 34}z`} fill="none" stroke={colors.gold} strokeOpacity={0.6} strokeWidth={1.4} />
      <Path d={`M${cx - 30} ${cy + 34}h60`} stroke={colors.gold} strokeOpacity={0.6} strokeWidth={1.4} />
      {doors.map((d, i) => (
        <G key={d.key} onPress={() => onOpen(d)}>
          <Circle cx={pts[i][0]} cy={pts[i][1]} r={22} fill={fill[d.state]} stroke={stroke[d.state]} strokeWidth={2} />
          <SvgText x={pts[i][0]} y={pts[i][1] + 5} textAnchor="middle" fontSize={14} fontFamily={fonts.title} fill={ink[d.state]}>{d.num}</SvgText>
        </G>
      ))}
    </Svg>
  );
}

/* ---------- Courbe des 30 jours ---------- */
function MoodChart({ points }: { points: [number, number][] }) {
  const W = 300, H = 96;
  const X = (i: number) => 8 + (i / 29) * (W - 16);
  const Y = (v: number) => 10 + (1 - (v + 1) / 2) * (H - 20);
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      {[0, 1, 2].map((g) => (
        <Line key={g} x1={8} x2={W - 8} y1={10 + (g * (H - 20)) / 2} y2={10 + (g * (H - 20)) / 2} stroke="rgba(255,255,255,0.07)" />
      ))}
      {points.length > 1 && (
        <Polyline points={points.map(([i, v]) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')} fill="none" stroke={colors.gold} strokeWidth={1.6} strokeLinejoin="round" />
      )}
      {points.map(([i, v]) => <Circle key={i} cx={X(i)} cy={Y(v)} r={3} fill={GOLD2} />)}
    </Svg>
  );
}

/* ---------- Vignette d'un rêve (illustration d'après son premier symbole) ---------- */
const THUMB: Record<string, [string, string]> = {
  eau: ['#1a2a55', '#081a26'], foret: ['#1c2a3a', '#0e1a14'], maison: ['#2a2236', '#120e18'], feu: ['#2a2236', '#120e18'],
  chute: ['#2a2a44', '#0f0f1e'], oiseau: ['#2a2a44', '#0f0f1e'],
};
function DreamThumb({ k }: { k: string }) {
  const [a, b] = THUMB[k] ?? ['#1d2350', '#0c0f22'];
  return (
    <View style={st.thumb}>
      <Svg width="100%" height="100%" viewBox="0 0 80 80" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`t${k}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={a} />
            <Stop offset="1" stopColor={b} />
          </LinearGradient>
        </Defs>
        <Rect width={80} height={80} fill={`url(#t${k})`} />
        <Circle cx={58} cy={18} r={5} fill={GOLD2} opacity={0.7} />
        {[[14, 22], [30, 10], [66, 44], [20, 60]].map(([x, y]) => <Circle key={`${x}${y}`} cx={x} cy={y} r={0.8} fill="#fff" opacity={0.6} />)}
        <G transform="translate(22 26) scale(1.5)">
          <Path d={ICON[k]} fill="none" stroke={GOLD2} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
        </G>
      </Svg>
    </View>
  );
}

/* ---------- L'écran ---------- */
type Extra = { emotions: EmotionEntry[]; palms: PalmReading[]; ritual: RitualStore; portes: PortesStore; notes: number };
const EMPTY: Extra = { emotions: [], palms: [], ritual: {}, portes: {}, notes: 0 };

export default function Grimoire() {
  const { user, dreams, syncing, lastError, refresh, isDemo } = useSession();
  const [extra, setExtra] = useState<Extra>(EMPTY);
  const [tab, setTab] = useState<'sym' | 'emo'>('sym');
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([listEmotions(), listPalmReadings(), readRitual(), readPortes(), loadRealityChecks(isDemo), listVoiceNotes(isDemo)]).then(
        ([emotions, palms, ritual, portes, checks, voice]) => {
          if (alive) setExtra({ emotions, palms, ritual, portes, notes: (checks?.length ?? 0) + (voice?.length ?? 0) });
        },
        () => undefined,
      );
      return () => { alive = false; };
    }, [isDemo]),
  );

  const sorted = useMemo(() => [...dreams].sort((a, b) => (b.dreamDate || '').localeCompare(a.dreamDate || '')), [dreams]);
  const symbols = useMemo(() => recurringSymbols(dreams, 5), [dreams]);
  const allSymbols = useMemo(() => recurringSymbols(dreams, 99).length, [dreams]);
  const emotionsRec = useMemo(() => {
    const c = new Map<string, number>();
    for (const d of dreams) if (d.emotion && d.emotion !== 'aucune') c.set(emotionLabel(d.emotion) ?? d.emotion, (c.get(emotionLabel(d.emotion) ?? d.emotion) ?? 0) + 1);
    for (const e of extra.emotions) { const l = naiaLabel(e.key); c.set(l, (c.get(l) ?? 0) + 1); }
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [dreams, extra.emotions]);

  const doors = useMemo(
    () => doorStates(
      {
        oni: dreams.map((d) => d.createdAt || d.dreamDate),
        naia: extra.emotions.map((e) => e.at),
        terra: [...extra.palms.map((p) => p.at), extra.ritual.main],
      },
      extra.portes,
    ),
    [dreams, extra],
  );
  const opened = doors.filter((d) => d.state !== 'fermee').length;

  // Les 30 derniers jours : tonalité moyenne des rêves et des émotions notées avec Naïa.
  const mood = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    const byDay = new Map<string, number[]>();
    const add = (d: Date | undefined, v: number | undefined) => {
      if (!d || v == null || d < from) return;
      const k = dayKey(d);
      byDay.set(k, [...(byDay.get(k) ?? []), v]);
    };
    for (const d of dreams) add(parseDay(d.dreamDate), d.emotion ? VALENCE[d.emotion] : undefined);
    for (const e of extra.emotions) add(parseDay(e.day), VALENCE[e.key]);
    const pts: [number, number][] = [];
    const count = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
      const v = byDay.get(dayKey(day));
      if (v) pts.push([i, v.reduce((a, b) => a + b, 0) / v.length]);
    }
    for (const d of dreams) { const day = parseDay(d.dreamDate); if (day && day >= from && d.emotion && d.emotion !== 'aucune') { const l = emotionLabel(d.emotion) ?? d.emotion; count.set(l, (count.get(l) ?? 0) + 1); } }
    for (const e of extra.emotions) { const day = parseDay(e.day); const l = naiaLabel(e.key); if (day && day >= from) count.set(l, (count.get(l) ?? 0) + 1); }
    return { pts, dominant: [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([l]) => l) };
  }, [dreams, extra.emotions]);

  const shown = useMemo(() => searchDreams(sorted, query), [sorted, query]);
  const recent = sorted.slice(0, 3);
  const first = (user?.name ?? '').split(' ')[0];
  const openDoor = (d: Door) => {
    const s = SISTERS.find((x) => x.slug === d.key);
    if (s) router.push({ pathname: '/page', params: { path: s.path, title: s.name } });
  };
  const openDream = (d: Dream) => router.push({ pathname: '/reve/[id]', params: { id: d.id } });
  const recList = tab === 'sym' ? symbols : emotionsRec;
  const recMax = recList[0]?.[1] ?? 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.night }} edges={['top']}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={{ padding: space.md, paddingBottom: 130, gap: space.md }}
        refreshControl={<RefreshControl refreshing={syncing} onRefresh={refresh} tintColor={colors.gold} />}
      >
        {/* En-tête */}
        <View style={st.hero}>
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 60" preserveAspectRatio="none">
            {[[8, 10], [22, 40], [40, 8], [55, 30], [70, 12], [92, 44], [85, 6], [12, 52]].map(([x, y]) => (
              <Circle key={`${x}-${y}`} cx={x} cy={y} r={0.35} fill="#fff" opacity={0.5} />
            ))}
          </Svg>
          <View style={st.archBox} pointerEvents="none"><Arch /></View>
          <View style={{ flex: 1, gap: 4, paddingRight: 64 }}>
            <Text style={st.hello}>{first ? t('Bienvenue, {name}, dans ton', { name: first }) : t('Bienvenue dans ton')}</Text>
            <Text style={st.heroTitle} accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{t('GRIMOIRE')}</Text>
            <View style={st.rule} />
            <Text style={st.heroSub}>{t('Ton espace intime de rêves et de sens.')}</Text>
          </View>
        </View>

        {!user && (
          <Card>
            <Eyebrow>{t('Un espace privé')}</Eyebrow>
            <Title size={28}>{t('Votre Grimoire vous attend')}</Title>
            <Body muted>{t('Connectez-vous pour conserver vos rêves, observer les symboles qui reviennent et les retrouver aussi sur lecercle127.com.')}</Body>
            <GoldButton label={t('Entrer dans mon Grimoire')} onPress={() => router.push('/connexion')} />
            <OutlineButton label={t('Créer mon compte gratuit')} onPress={() => router.push({ pathname: '/connexion', params: { mode: 'register' } })} />
          </Card>
        )}

        {lastError && <Notice tone="error" text={lastError} />}

        {/* Chiffres */}
        <View style={st.stats}>
          {[
            [dreams.length, dreams.length > 1 ? t('Rêves enregistrés') : t('Rêve enregistré')],
            [allSymbols, t('Symboles récurrents')],
            [opened, opened > 1 ? t('Portes ouvertes') : t('Porte ouverte')],
            [extra.notes, t('Notes & réflexions')],
          ].map(([n, l]) => (
            <View key={String(l)} style={st.stat}>
              <Text style={st.statN}>{n}</Text>
              <Text style={st.statL}>{String(l).toUpperCase()}</Text>
            </View>
          ))}
        </View>

        {/* Récurrences */}
        <View style={st.card}>
          <Text style={st.h}>{t('TES RÉCURRENCES')}</Text>
          <View style={st.tabs} accessibilityRole="tablist">
            {(['sym', 'emo'] as const).map((k) => (
              <Pressable key={k} onPress={() => setTab(k)} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} style={[st.tab, tab === k && st.tabOn]}>
                <Text style={[st.tabT, tab === k && { color: GOLD2 }]}>{k === 'sym' ? t('SYMBOLES') : t('ÉMOTIONS')}</Text>
              </Pressable>
            ))}
          </View>
          {recList.length === 0 ? (
            <Body muted>{tab === 'sym' ? t('Note les symboles de tes rêves : ceux qui reviennent apparaîtront ici.') : t('Les émotions de tes réveils apparaîtront ici.')}</Body>
          ) : (
            recList.map(([name, n]) => (
              <View key={name} style={st.rec}>
                {tab === 'sym' ? <SymbolIcon name={iconKey(name)} /> : <View style={st.recDot} />}
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    <Text style={st.recName} numberOfLines={1}>{name}</Text>
                    <Text style={st.recN}>{t(n > 1 ? '{n} apparitions' : '{n} apparition', { n })}</Text>
                  </View>
                  <View style={st.track}><View style={[st.fill, { width: `${Math.max(8, Math.round((n / recMax) * 100))}%` }]} /></View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Carte des portes */}
        <View style={[st.card, { alignItems: 'center' }]}>
          <Text style={[st.h, { alignSelf: 'center' }]}>{t('CARTE DES PORTES')}</Text>
          <DoorMap doors={doors} onOpen={openDoor} />
          <View style={st.legend}>
            {([['ouverte', '#e9cf8d', t('Ouverte')], ['encours', '#5a49a8', t('En cours')], ['fermee', 'transparent', t('Fermée')]] as const).map(([k, c, l]) => (
              <View key={k} style={st.legendItem}>
                <View style={[st.legendDot, { backgroundColor: c, borderWidth: k === 'fermee' ? 1 : 0 }]} />
                <Text style={st.legendT}>{l}</Text>
              </View>
            ))}
          </View>
          <Text style={st.hint}>{t('Chaque porte est une Sœur. Elle s’ouvre quand tu pratiques avec elle.')}</Text>
        </View>

        {/* Rêves récents */}
        <View style={st.card}>
          <Text style={st.h}>{t('TES RÊVES RÉCENTS')}</Text>
          {recent.length === 0 ? (
            <Body muted style={{ textAlign: 'center' }}>{t('Aucun rêve pour l’instant. Le prochain réveil est une porte.')}</Body>
          ) : (
            recent.map((d) => (
              <Pressable key={d.id} onPress={() => openDream(d)} style={({ pressed }) => [st.dream, pressed && { opacity: 0.75 }]} accessibilityRole="link" accessibilityLabel={`${d.title}, ${formatDate(d.dreamDate)}`}>
                <DreamThumb k={d.symbols?.[0] ? iconKey(d.symbols[0]) : 'lune'} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={st.dDate}>{formatDate(d.dreamDate).toUpperCase()}{d.pending ? t(' · sur cet appareil') : ''}</Text>
                  <Text style={st.dTitle} numberOfLines={1}>{d.title}</Text>
                  {(d.symbols?.length || d.emotion) ? (
                    <Text style={st.dMotifs} numberOfLines={1}>{[...(d.symbols ?? []).slice(0, 3), d.emotion && d.emotion !== 'aucune' ? emotionLabel(d.emotion) : undefined].filter(Boolean).join(' · ')}</Text>
                  ) : null}
                  {d.story ? <Text style={st.dExcerpt} numberOfLines={2}>« {splitContext(d.story).story} »</Text> : null}
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* Journal intime */}
        <View style={st.card}>
          <Text style={st.h}>{t('JOURNAL INTIME')}</Text>
          <Body muted>{t('Note ici tes réflexions, tes ressentis et tes prises de conscience, à voix haute ou par écrit.')}</Body>
          <Pressable onPress={() => router.push('/carnet-vocal')} style={({ pressed }) => [st.ghost, pressed && { opacity: 0.7 }]} accessibilityRole="button">
            <Text style={st.ghostT}>{t('ÉCRIRE')}</Text>
          </Pressable>
        </View>

        {/* Suivi émotionnel */}
        <View style={st.card}>
          <Text style={st.h}>{t('SUIVI ÉMOTIONNEL')}</Text>
          <MoodChart points={mood.pts} />
          <Body muted>
            {mood.pts.length
              ? t('Tes émotions dominantes ces 30 derniers jours : {list}.', { list: mood.dominant.join(', ') || '—' })
              : t('Note l’émotion de tes réveils : la courbe des 30 derniers jours se dessinera ici.')}
          </Body>
        </View>

        {/* Appel principal */}
        <Pressable onPress={() => router.navigate('/reve')} style={({ pressed }) => [st.cta, pressed && { transform: [{ scale: 0.98 }] }]} accessibilityRole="button">
          <Svg width={26} height={26} viewBox="0 0 24 24">
            <Path d="M20 3C12 4 6 9 4 20l2-1c1-4 3-7 6-9-2 3-3 5-4 8 6-2 10-7 12-15z" fill="#2a1d0c" />
          </Svg>
          <View style={{ flex: 1 }}>
            <Text style={st.ctaT}>{t('Confier un nouveau rêve à Oni')}</Text>
            <Text style={st.ctaS}>{t('LECTURE APPROFONDIE')}</Text>
          </View>
          <Text style={st.ctaArrow}>›</Text>
        </Pressable>

        {/* Tous les rêves */}
        {dreams.length > 3 && (
          <View style={{ gap: space.sm }}>
            <Text style={[st.h, { marginTop: space.sm }]}>{t('TOUS MES RÊVES')}</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('Chercher dans mes rêves : forêt, eau, peur…')}
              placeholderTextColor="#6f7090"
              style={st.search}
              accessibilityLabel={t('Chercher dans mes rêves')}
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
            {query.trim() !== '' && shown.length === 0 && (
              <Body muted style={{ textAlign: 'center' }}>{t('Aucun rêve ne contient «')} {query.trim()} {t('».')}</Body>
            )}
            {shown.map((d) => (
              <Pressable key={d.id} style={({ pressed }) => [st.row, pressed && { opacity: 0.7 }]} onPress={() => openDream(d)} accessibilityRole="link" accessibilityLabel={`${d.title}, ${formatDate(d.dreamDate)}`}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={st.dDate}>{formatDate(d.dreamDate).toUpperCase()}</Text>
                  <Text style={st.rowTitle} numberOfLines={1}>{d.title}</Text>
                </View>
                {d.emotion ? <Text style={st.rowEmo}>{emotionLabel(d.emotion)}</Text> : null}
              </Pressable>
            ))}
          </View>
        )}

        {/* Citation */}
        <View style={st.quote}>
          <View style={st.quoteLine} />
          <Text style={st.quoteT}>{t('Chaque rêve est une porte vers une version plus vraie de toi.')}</Text>
          <View style={st.quoteLine} />
        </View>
        <Text style={st.foot}>
          {t('Sauvegarde automatique · Tes rêves restent privés · Tu gardes le contrôle')}
          {(extra.ritual.streak ?? 0) > 1 ? ` · ✦ ${t('{n} jours de rituel', { n: extra.ritual.streak ?? 0 })}` : ''}
        </Text>

        {user && <OutlineButton label={t('Mon compte · {v0}', { v0: user.name })} onPress={() => router.push('/compte')} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.lg, minHeight: 170, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(216,182,107,0.22)', backgroundColor: '#0e0f23', overflow: 'hidden' },
  hello: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.text },
  heroTitle: { fontFamily: fonts.title, fontSize: 40, lineHeight: 46, letterSpacing: 2, color: colors.gold },
  archBox: { position: 'absolute', right: 6, top: 0, bottom: 0, justifyContent: 'center', opacity: 0.95 },
  rule: { width: 46, height: 1, backgroundColor: colors.gold, opacity: 0.7, marginVertical: 4 },
  heroSub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.muted },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stat: { flexBasis: '48%', flexGrow: 1, alignItems: 'center', gap: 6, paddingVertical: 18, paddingHorizontal: 8, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(216,182,107,0.2)', backgroundColor: CARD },
  statN: { fontFamily: fonts.title, fontSize: 34, lineHeight: 38, color: colors.text },
  statL: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.6, color: colors.muted, textAlign: 'center' },
  card: { gap: space.sm, padding: space.md, borderRadius: radius.md + 2, borderWidth: 1, borderColor: 'rgba(216,182,107,0.2)', backgroundColor: CARD },
  h: { fontFamily: fonts.title, fontSize: 17, letterSpacing: 2.4, color: colors.gold },
  tabs: { flexDirection: 'row', gap: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(216,182,107,0.2)', marginBottom: 4 },
  tab: { paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabOn: { borderBottomColor: colors.gold },
  tabT: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.6, color: colors.muted },
  rec: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  recDot: { width: 14, height: 14, borderRadius: 7, marginHorizontal: 7, backgroundColor: VIOLET },
  recName: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text, flexShrink: 1 },
  recN: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: VIOLET2 },
  legend: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, borderColor: '#6d6c85' },
  legendT: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center' },
  dream: { flexDirection: 'row', gap: 12, padding: 10, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' },
  thumb: { width: 84, height: 84, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  dDate: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.4, color: colors.muted },
  dTitle: { fontFamily: fonts.title, fontSize: 21, color: colors.text },
  dMotifs: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  dExcerpt: { fontFamily: fonts.titleItalic, fontSize: 15, lineHeight: 20, color: '#cfc8b4' },
  ghost: { alignSelf: 'flex-start', marginTop: 4, paddingVertical: 10, paddingHorizontal: 26, borderRadius: 6, borderWidth: 1, borderColor: colors.gold },
  ghostT: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 2.2, color: GOLD2 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, paddingHorizontal: 22, borderRadius: radius.pill, backgroundColor: '#dcc285', borderWidth: 1, borderColor: GOLD2, shadowColor: colors.gold, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
  ctaT: { fontFamily: fonts.title, fontSize: 21, color: '#241a0c' },
  ctaS: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.8, color: '#4a3a1c' },
  ctaArrow: { fontFamily: fonts.bodyBold, fontSize: 28, color: '#241a0c' },
  search: { minHeight: 50, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: '#0d1124', color: colors.text, fontFamily: fonts.body, fontSize: 16, paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 12, paddingHorizontal: space.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  rowTitle: { fontFamily: fonts.title, fontSize: 18, color: colors.text },
  rowEmo: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  quote: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: space.md },
  quoteLine: { flex: 1, height: 1, backgroundColor: colors.gold, opacity: 0.45 },
  quoteT: { flexShrink: 1, maxWidth: 240, fontFamily: fonts.titleItalic, fontSize: 17, lineHeight: 23, color: colors.text, textAlign: 'center' },
  foot: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textAlign: 'center' },
});
