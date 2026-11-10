// L'Oracle 127, version native (essai) : un seul écran autour du cercle vivant.
// Les 7 points sont les Sœurs ; on garde le doigt sur le cercle pour ouvrir le tirage ;
// la lame apparaît en grand et ses Sœurs s'allument sur le cercle. Même moteur que le site.
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Defs, G, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { Screen } from '../components/ui';
import { dayCard, drawFrom, makeSeal, sealLabel, sistersOfMask, SISTERS, type Draw, type Lame, type Mode } from '../lib/oracle/engine';
import { colors, fonts, radius, space } from '../lib/theme';
import { t } from '../i18n';

const GOLD2 = '#f3dca0';
const CARD = '#11122a';
const HOLD_MS = 1200;
const SIZE = 300;
const R = 112; // rayon des sept Sœurs
const RING = 64; // anneau de maintien
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const crypto = {
  randomBytes: (n: number) => Crypto.getRandomBytes(n),
  sha256Hex: (s: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, s),
};

const MODES: { key: Mode; label: string }[] = [
  { key: 'jour', label: 'Carte du jour' },
  { key: 'trois', label: 'Trois portes' },
  { key: 'sept', label: 'Sept regards' },
];

const pos = (i: number) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 7;
  return { x: SIZE / 2 + R * Math.cos(a), y: SIZE / 2 + R * Math.sin(a) };
};

/* ---------- Le cercle vivant ---------- */
function Cercle({ lit, progress, onIn, onOut, onA11y, opened }: { lit: number; progress: Animated.Value; onIn: () => void; onOut: () => void; onA11y: () => void; opened: boolean }) {
  const circ = 2 * Math.PI * RING;
  const dash = progress.interpolate({ inputRange: [0, 1], outputRange: [circ, 0] });
  return (
    <Pressable
      onPressIn={onIn}
      onPressOut={onOut}
      accessibilityRole="button"
      accessibilityLabel={opened ? t('Le cercle des Sept Sœurs') : t('Ouvrir le tirage')}
      accessibilityHint={t('Gardez le doigt sur le cercle pour ouvrir le tirage.')}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={onA11y}
      style={{ width: SIZE, height: SIZE, alignSelf: 'center' }}
    >
      <Svg width={SIZE} height={SIZE}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={GOLD2} stopOpacity={0.28} />
            <Stop offset="0.55" stopColor={colors.gold} stopOpacity={0.06} />
            <Stop offset="1" stopColor={colors.gold} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="lit" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={GOLD2} stopOpacity={0.9} />
            <Stop offset="1" stopColor={colors.gold} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 2} fill="url(#glow)" />
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={colors.gold} strokeOpacity={0.35} />
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R + 22} fill="none" stroke={colors.gold} strokeOpacity={0.12} />
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RING} fill="none" stroke={colors.gold} strokeOpacity={0.18} strokeWidth={3} />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RING}
          fill="none"
          stroke={GOLD2}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={dash}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
        {SISTERS.map((s, i) => {
          const p = pos(i);
          const on = (lit >> i) & 1;
          return (
            <G key={s.name}>
              {on ? <Circle cx={p.x} cy={p.y} r={20} fill="url(#lit)" /> : null}
              <Circle cx={p.x} cy={p.y} r={on ? 7 : 5} fill={on ? GOLD2 : '#2a2846'} stroke={colors.gold} strokeOpacity={on ? 1 : 0.6} />
              <SvgText x={p.x} y={p.y + (p.y > SIZE / 2 ? 26 : -14)} fontSize={11} fill={on ? GOLD2 : colors.muted} textAnchor="middle" fontWeight={on ? '700' : '400'}>
                {s.name}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      <Image source={require('../../assets/images/header-logo.png')} style={st.logo} accessibilityIgnoresInvertColors />
    </Pressable>
  );
}

/* ---------- Une lame : l'illustration seule, en grand ---------- */
function LameView({ card, position, onZoom }: { card: Lame; position: string; onZoom: () => void }) {
  const [w, setW] = useState(0);
  const edition = /edition-127\/card-/.test(card.image);
  return (
    <View style={st.lame}>
      <Text style={st.kicker}>{t(position).toUpperCase()}</Text>
      <Pressable onPress={onZoom} accessibilityRole="imagebutton" accessibilityLabel={t('Voir la lame entière : {n}', { n: card.name })} style={st.artBox} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w ? (
          edition ? (
            // La lame d'édition porte un cadre chargé : on ne garde que son illustration.
            <View style={{ width: w * 1.136, height: w * 1.136 * (12 / 7), marginLeft: -w * 0.068, marginTop: -w * 0.33 }}>
              <Image source={{ uri: card.image }} style={{ width: '100%', height: '100%' }} resizeMode="stretch" />
            </View>
          ) : (
            <Image source={{ uri: card.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          )
        ) : null}
      </Pressable>
      <Text style={st.num}>{t('Lame {n}', { n: String(card.n).padStart(3, '0') })}</Text>
      <Text style={st.name}>{card.name}</Text>
      <Text style={st.def}>{card.definition}</Text>
      <Text style={st.sisters}>{sistersOfMask(card.mask).map((s) => s.name).join(' · ')}</Text>
    </View>
  );
}

export default function OracleNatif() {
  const [mode, setMode] = useState<Mode>('jour');
  const [askOpen, setAskOpen] = useState(false);
  const [intent, setIntent] = useState('');
  const [draw, setDraw] = useState<Draw | null>(null);
  const [more, setMore] = useState(false);
  const [zoom, setZoom] = useState<Lame | null>(null);
  const [progress] = useState(() => new Animated.Value(0));
  const [reveal] = useState(() => new Animated.Value(0));
  const started = useRef(0);
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  const today = useMemo(() => dayCard(), []);
  const lit = draw ? draw.cards.reduce((m, c) => m | c.mask, 0) : 0;

  useEffect(() => {
    reveal.setValue(0);
    if (draw) Animated.timing(reveal, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [draw, reveal]);

  const open = async (holdMs: number) => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    if (mode === 'jour') {
      setDraw(drawFrom('jour', undefined, ''));
    } else {
      const { seal, source } = await makeSeal(crypto, intent, holdMs);
      setDraw(drawFrom(mode, seal, source));
    }
    setMore(false);
    AccessibilityInfo.announceForAccessibility?.(t('Le tirage est ouvert.'));
  };

  const pressIn = () => {
    if (draw) return;
    started.current = Date.now();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    anim.current = Animated.timing(progress, { toValue: 1, duration: HOLD_MS, easing: Easing.linear, useNativeDriver: false });
    anim.current.start(({ finished }) => {
      if (finished) void open(Date.now() - started.current);
    });
  };
  const pressOut = () => {
    if (draw) return;
    anim.current?.stop();
    Animated.timing(progress, { toValue: 0, duration: 250, useNativeDriver: false }).start();
  };
  const again = () => {
    setDraw(null);
    progress.setValue(0);
  };

  const sisters = draw ? sistersOfMask(lit) : [];
  const lead = sisters[0];

  return (
    <Screen>
      <View style={st.head}>
        <Text style={st.kicker}>{t('ORACLE 127 · ESSAI')}</Text>
        <Text style={st.title}>{draw ? t('Le cercle a parlé') : t('Gardez le doigt sur le cercle')}</Text>
      </View>

      <Cercle lit={lit} progress={progress} onIn={pressIn} onOut={pressOut} onA11y={() => void open(HOLD_MS)} opened={!!draw} />

      {!draw ? (
        <>
          <View style={st.modes} accessibilityRole="radiogroup">
            {MODES.map((m) => {
              const on = mode === m.key;
              return (
                <Pressable key={m.key} onPress={() => setMode(m.key)} style={[st.mode, on && st.modeOn]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                  <Text style={[st.modeT, on && st.modeTOn]}>{t(m.label)}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={st.hint}>
            {mode === 'jour'
              ? t('Aujourd’hui, la même lame pour tout le Cercle.')
              : mode === 'trois'
                ? t('Trois lames : ce qui s’en va, ce qui est là, ce qui s’ouvre.')
                : t('Une lame, et le regard de chacune des Sept Sœurs.')}
          </Text>
          {mode !== 'jour' ? (
            askOpen ? (
              <TextInput value={intent} onChangeText={(v) => setIntent(v.slice(0, 280))} placeholder={t('Quelle question souhaitez-vous éclairer ?')} placeholderTextColor={colors.muted} multiline style={st.input} />
            ) : (
              <Pressable onPress={() => setAskOpen(true)} accessibilityRole="button" style={{ alignSelf: 'center' }} hitSlop={8}>
                <Text style={st.link}>{t('+ Poser une question (facultatif)')}</Text>
              </Pressable>
            )
          ) : null}
          <View style={st.peek}>
            <Text style={st.peekT}>{t('Carte du jour : {n}', { n: today.name })}</Text>
          </View>
        </>
      ) : (
        <Animated.View style={{ opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }], gap: space.md }}>
          {draw.cards.map((c, i) => (
            <LameView key={c.n} card={c} position={draw.positions[i] ?? draw.positions[0]} onZoom={() => setZoom(c)} />
          ))}

          <View style={st.card}>
            {draw.mode === 'sept' ? (
              <>
                <Text style={st.kicker}>{t('LES SEPT REGARDS')}</Text>
                {SISTERS.map((s, i) => {
                  const on = (lit >> i) & 1;
                  return (
                    <View key={s.name} style={[st.regard, !on && { opacity: 0.45 }]}>
                      <Text style={st.regardName}>{s.glyph} {s.name}</Text>
                      <Text style={st.text}>{on ? s.light : t('Reste en retrait pour cette lame.')}</Text>
                    </View>
                  );
                })}
              </>
            ) : (
              <>
                <Text style={st.kicker}>{t('TON GESTE')}</Text>
                {lead ? <Text style={st.text}>{lead.gesture}</Text> : null}
                {more ? (
                  sisters.map((s) => (
                    <View key={s.name} style={st.regard}>
                      <Text style={st.regardName}>{s.glyph} {s.name} · {s.verb}</Text>
                      <Text style={st.text}>{t('Ce qui s’éclaire :')} {s.light}</Text>
                      <Text style={st.text}>{t('Ce qui freine :')} {s.shadow}</Text>
                    </View>
                  ))
                ) : (
                  <Pressable onPress={() => setMore(true)} accessibilityRole="button" hitSlop={6}>
                    <Text style={st.link}>{t('Lire la suite ›')}</Text>
                  </Pressable>
                )}
                {lead ? <Text style={st.question}>{lead.question}</Text> : null}
              </>
            )}
          </View>

          <Pressable onPress={again} style={st.cta} accessibilityRole="button">
            <Text style={st.ctaT}>{t('Nouveau tirage')}</Text>
          </Pressable>
          <Text style={st.source}>
            {t('Source du tirage : {s}', { s: draw.source })}
            {draw.seal ? `\n${t('Sceau')} ${sealLabel(draw)}` : ''}
          </Text>
        </Animated.View>
      )}

      <Text style={st.veil}>{t('L’Oracle n’annonce pas ce qui va arriver. Il éclaire ce qui cherche à être vécu.')}</Text>

      <Modal visible={!!zoom} transparent animationType="fade" onRequestClose={() => setZoom(null)}>
        <Pressable style={st.zoomBg} onPress={() => setZoom(null)} accessibilityRole="button" accessibilityLabel={t('Fermer')}>
          {zoom ? <Image source={{ uri: zoom.image }} style={st.zoomImg} resizeMode="contain" accessibilityLabel={zoom.name} /> : null}
          <Text style={st.zoomClose}>×</Text>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const st = StyleSheet.create({
  head: { alignItems: 'center', gap: 4 },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.8, color: colors.gold, textAlign: 'center' },
  title: { fontFamily: fonts.title, fontSize: 28, color: colors.text, textAlign: 'center' },
  logo: { position: 'absolute', width: 92, height: 92, left: SIZE / 2 - 46, top: SIZE / 2 - 46, borderRadius: 46 },
  modes: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  mode: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10 },
  modeOn: { backgroundColor: '#e8cf8f', borderColor: '#e8cf8f' },
  modeT: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  modeTOn: { color: '#1b1730', fontFamily: fonts.bodyBold },
  hint: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center' },
  link: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.gold, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, minHeight: 80, color: colors.text, fontFamily: fonts.body, fontSize: 15, textAlignVertical: 'top' },
  peek: { alignSelf: 'center', borderTopWidth: 1, borderTopColor: 'rgba(216,182,107,0.2)', paddingTop: space.sm },
  peekT: { fontFamily: fonts.titleItalic, fontSize: 17, color: GOLD2, textAlign: 'center' },
  lame: { alignItems: 'center', gap: 6 },
  artBox: { position: 'relative', width: '86%', aspectRatio: 17 / 16, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#0b0d1e', borderWidth: 1, borderColor: 'rgba(240,214,140,0.55)' },
  num: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.6, color: colors.muted, marginTop: 4 },
  name: { fontFamily: fonts.title, fontSize: 30, color: colors.text, textAlign: 'center' },
  def: { fontFamily: fonts.titleItalic, fontSize: 18, lineHeight: 25, color: GOLD2, textAlign: 'center', paddingHorizontal: space.md },
  sisters: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted, textAlign: 'center' },
  card: { backgroundColor: CARD, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.md, gap: space.sm },
  text: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  regard: { gap: 2, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: 'rgba(216,182,107,0.15)' },
  regardName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.gold },
  question: { fontFamily: fonts.titleItalic, fontSize: 18, lineHeight: 24, color: GOLD2, marginTop: space.xs },
  cta: { backgroundColor: '#e8cf8f', borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center' },
  ctaT: { fontFamily: fonts.title, fontSize: 20, color: '#1b1730' },
  source: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.muted, textAlign: 'center' },
  veil: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center', opacity: 0.8 },
  zoomBg: { flex: 1, backgroundColor: 'rgba(5,4,12,0.94)', alignItems: 'center', justifyContent: 'center', padding: space.md },
  zoomImg: { width: '92%', height: '82%' },
  zoomClose: { position: 'absolute', top: 54, right: 22, color: colors.gold, fontSize: 34 },
});
