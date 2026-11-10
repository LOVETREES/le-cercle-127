// Le Labyrinthe vivant : ce que le ciel de naissance met en avant (ACQUIS, lecture symbolique)
// face à ce que la personne pratique et en dit (VÉCU). Tout est calculé et gardé sur le téléphone.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Animated, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { Screen } from '../components/ui';
import { allRecurringMotifs } from '../lib/insights';
import { listEntries } from '../lib/journal-intime';
import { acquis, acquisLevels, birthAngles, ORDER, type Birth, type Placement } from '../lib/labyrinthe/acquis';
import { searchVilles, villeByName } from '../lib/labyrinthe/villes';
import { listBilans, listGestes, readBirth, saveBilan, saveBirth, type Bilan } from '../lib/labyrinthe/store';
import { doorOf, isoWeek, maskOf, QUESTIONS, readMeeting, SOURCES, vecuLevels, type Counts, type Levels } from '../lib/labyrinthe/vecu';
import { listEmotions } from '../lib/naia';
import { listDraws } from '../lib/oracle/history';
import { LAME_IMAGES } from '../lib/oracle/images';
import { lameText } from '../lib/oracle/localize';
import { listPalmReadings } from '../lib/palm';
import { useSession } from '../lib/session';
import { colors, fonts, radius, space } from '../lib/theme';
import { t } from '../i18n';

const GOLD2 = '#f3dca0';
const CARD = '#11122a';
const VIOLET = '#a99cf0';
const SIZE = 320;
const C = SIZE / 2;
const R = 112;
const DAY = 86400000;

const axis = (i: number, r: number) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 7;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
};
/** Courbe fermée douce (Catmull-Rom) passant par les sept points. */
function blob(l: Levels, min = 0.08): string {
  const pts = ORDER.map((s, i) => axis(i, R * Math.max(min, Math.min(1, l[s] ?? 0))));
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d} Z`;
}
const ring = (r: number) => ORDER.map((_, i) => axis(i, r)).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + ' Z';

function Heptagon({ a, v, trail }: { a?: Levels; v: Levels; trail: Levels[] }) {
  return (
    <Svg width="100%" height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} accessibilityLabel={t('Ce que tu portes et ce que tu vis, Sœur par Sœur')}>
      <Defs>
        <RadialGradient id="vg" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={GOLD2} stopOpacity={0.55} />
          <Stop offset="1" stopColor={VIOLET} stopOpacity={0.22} />
        </RadialGradient>
      </Defs>
      {[0.33, 0.66, 1].map((k) => (
        <Path key={k} d={ring(R * k)} fill="none" stroke={colors.gold} strokeOpacity={k === 1 ? 0.35 : 0.12} />
      ))}
      {ORDER.map((s, i) => {
        const [x, y] = axis(i, R);
        const [lx, ly] = axis(i, R + 22);
        return (
          <G key={s}>
            <Line x1={C} y1={C} x2={x} y2={y} stroke={colors.gold} strokeOpacity={0.1} />
            <SvgText x={lx} y={ly + 4} fontSize={11} fill={colors.muted} textAnchor="middle">{s}</SvgText>
          </G>
        );
      })}
      {trail.map((l, i) => (
        <Path key={i} d={blob(l)} fill="none" stroke={VIOLET} strokeOpacity={0.12 + 0.05 * (trail.length - i)} strokeWidth={1} />
      ))}
      <Path d={blob(v)} fill="url(#vg)" stroke={GOLD2} strokeOpacity={0.8} strokeWidth={1.5} />
      {a ? <Path d={blob(a, 0.15)} fill="none" stroke={colors.gold} strokeWidth={2} strokeDasharray="5 5" /> : null}
      <Circle cx={C} cy={C} r={3} fill={GOLD2} />
    </Svg>
  );
}

function Door({ label, mask }: { label: string; mask: number }) {
  const lame = doorOf(Object.fromEntries(ORDER.map((s, i) => [s, (mask >> i) & 1 ? 1 : 0])) as Levels);
  const txt = lameText(lame);
  return (
    <View style={st.door}>
      <Text style={st.doorK}>{label}</Text>
      <View style={st.doorImg}>
        <Image source={LAME_IMAGES[lame.n]} style={{ width: 128, height: 219, marginLeft: -8, marginTop: -38 }} resizeMode="stretch" />
      </View>
      <Text style={st.doorName}>{txt.name}</Text>
      <Text style={st.doorSis}>{ORDER.filter((_, i) => (mask >> i) & 1).join(' · ')}</Text>
    </View>
  );
}

export default function Labyrinthe() {
  const { dreams } = useSession();
  const [birth, setBirth] = useState<Birth | undefined>();
  const [form, setForm] = useState<Birth>({ date: '', time: '', place: '' });
  const [placeQ, setPlaceQ] = useState('');
  const [editBirth, setEditBirth] = useState(false);
  const [counts, setCounts] = useState<Counts>({ Oni: 0, Alka: 0, Naïa: 0, Terra: 0, Ignis: 0, Astria: 0, Irma: 0 });
  const [bilans, setBilans] = useState<Bilan[]>([]);
  const [answers, setAnswers] = useState<number[]>(Array(7).fill(-1));
  const [editBilan, setEditBilan] = useState(false);
  const [fade] = useState(() => new Animated.Value(0));

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const since = Date.now() - 30 * DAY;
      const recent = (iso?: string) => !!iso && new Date(iso).getTime() >= since;
      Promise.all([readBirth(), listEmotions(), listPalmReadings(), listDraws(), listEntries(), listGestes(), listBilans()]).then(
        ([b, emotions, palms, draws, journal, gestes, bl]) => {
          if (!alive) return;
          setBirth(b);
          if (b) { setForm({ date: b.date, time: b.time ?? '', place: b.place ?? '' }); setPlaceQ(b.place ?? ''); }
          const dreams30 = dreams.filter((d) => recent(d.dreamDate ? `${d.dreamDate.slice(0, 10)}T12:00:00` : d.createdAt));
          setCounts({
            Oni: dreams30.length,
            Alka: allRecurringMotifs(dreams30).length,
            Naïa: emotions.filter((e) => recent(e.at ?? `${e.day}T12:00:00`)).length,
            Terra: palms.filter((p) => new Date(p.at).getTime() >= since).length,
            Ignis: gestes.filter(recent).length,
            Astria: journal.filter((j) => recent(j.at)).length,
            Irma: draws.filter((d) => recent(d.at)).length,
          });
          setBilans(bl);
          fade.setValue(0);
          Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
        },
        () => undefined,
      );
      return () => {
        alive = false;
      };
    }, [dreams, fade]),
  );

  const placements: Placement[] | undefined = useMemo(() => (birth ? acquis(birth) : undefined), [birth]);
  const angs = useMemo(() => (birth ? birthAngles(birth) : undefined), [birth]);
  const suggestions = placeQ && !villeByName(placeQ) ? searchVilles(placeQ) : [];
  const a = placements ? acquisLevels(placements) : undefined;
  const week = isoWeek();
  const thisWeek = bilans.find((b) => b.week === week);
  const v = vecuLevels(counts, thisWeek?.answers);
  const reading = a ? readMeeting(a, v) : undefined;
  const trail = bilans.filter((b) => b.week !== week && b.levels).slice(0, 7).map((b) => b.levels as Levels);
  const vMask = maskOf(v);
  const aMask = a ? maskOf(a) : 0;

  const saveSky = async () => {
    const b: Birth = { date: form.date.trim(), time: form.time?.trim() || undefined, place: villeByName(form.place) ? form.place : undefined };
    if (!acquis(b)) return;
    await saveBirth(b);
    setBirth(b);
    setEditBirth(false);
  };
  const ready = answers.every((x) => x >= 0);
  const saveWeek = async () => {
    if (!ready) return;
    setBilans(await saveBilan(answers, vecuLevels(counts, answers)));
    setEditBilan(false);
  };
  const skyValid = !!acquis({ date: form.date.trim(), time: form.time?.trim() || undefined });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={st.kicker}>{t('LE LABYRINTHE VIVANT')}</Text>
          <Text style={st.title}>{t('Ce que tu portes, ce que tu vis')}</Text>
        </View>

        <Animated.View style={[st.card, { opacity: fade }]}>
          <Heptagon a={a} v={v} trail={trail} />
          <View style={st.legend}>
            <Text style={[st.legendT, { color: colors.gold }]}>{a ? t('┄ Ton ciel (l’acquis)') : t('┄ Ton ciel : à renseigner')}</Text>
            <Text style={[st.legendT, { color: GOLD2 }]}>{t('◉ Ton vécu (30 jours)')}</Text>
            {trail.length ? <Text style={[st.legendT, { color: VIOLET }]}>{t('◌ Semaines passées')}</Text> : null}
          </View>
          {reading ? reading.text.map((p, i) => <Text key={i} style={i ? st.read : st.readLead}>{t(p.k, p.v)}</Text>) : null}
        </Animated.View>

        {a ? (
          <View style={st.doors}>
            <Door label={t('PORTE DE NAISSANCE')} mask={aMask} />
            <Text style={st.arrow}>→</Text>
            <Door label={t('PORTE DU MOMENT')} mask={vMask} />
          </View>
        ) : null}
        {a && aMask !== vMask ? (
          <Text style={st.path}>
            {t('Le chemin entre les deux portes : ')}
            {ORDER.filter((_, i) => (aMask >> i) & 1 && !((vMask >> i) & 1)).map((s) => `+ ${s}`).join(', ') || t('rien à ajouter')}
            {ORDER.some((_, i) => (vMask >> i) & 1 && !((aMask >> i) & 1)) ? ` · ${t('déjà conquis')} : ${ORDER.filter((_, i) => (vMask >> i) & 1 && !((aMask >> i) & 1)).join(', ')}` : ''}
          </Text>
        ) : null}

        {/* Le bilan de la semaine : la mesure d'introspection */}
        <View style={st.card}>
          <Text style={st.h}>{t('BILAN DE LA SEMAINE')}</Text>
          {thisWeek && !editBilan ? (
            <>
              <Text style={st.read}>{t('Fait cette semaine. Il compte pour moitié dans ton vécu ; le reste vient de ce que tu pratiques.')}</Text>
              <Pressable onPress={() => { setAnswers(thisWeek.answers); setEditBilan(true); }} accessibilityRole="button" hitSlop={8}>
                <Text style={st.link}>{t('Revoir mes réponses ›')}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={st.small}>{t('Sept questions, une par Sœur. 0 = pas du tout, 4 = pleinement.')}</Text>
              {ORDER.map((s, i) => (
                <View key={s} style={st.q}>
                  <Text style={st.qT}><Text style={st.qS}>{s} · </Text>{t(QUESTIONS[s])}</Text>
                  <View style={st.scale}>
                    {[0, 1, 2, 3, 4].map((n) => {
                      const on = answers[i] === n;
                      return (
                        <Pressable key={n} onPress={() => setAnswers((l) => l.map((x, j) => (j === i ? n : x)))} style={[st.dot, on && st.dotOn]} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${s} ${n}`}>
                          <Text style={[st.dotT, on && st.dotTOn]}>{n}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
              <Pressable onPress={() => void saveWeek()} disabled={!ready} style={[st.cta, !ready && { opacity: 0.45 }]} accessibilityRole="button">
                <Text style={st.ctaT}>{t('Garder mon bilan')}</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Le vécu, Sœur par Sœur */}
        <View style={st.card}>
          <Text style={st.h}>{t('TON VÉCU, SŒUR PAR SŒUR')}</Text>
          {ORDER.map((s) => (
            <View key={s} style={st.row}>
              <Text style={st.rowS}>{s}</Text>
              <View style={st.track}>
                <View style={[st.fill, { width: `${Math.round(v[s] * 100)}%` }]} />
                {a ? <View style={[st.tick, { left: `${Math.round(a[s] * 100)}%` }]} /> : null}
              </View>
              <Text style={st.rowN}>{counts[s]}</Text>
            </View>
          ))}
          <Text style={st.small}>
            {ORDER.map((s) => `${s} : ${t(SOURCES[s].what)}`).join(' · ')}. {a ? t('Le trait doré marque ton ciel.') : ''}
          </Text>
          <Pressable onPress={() => router.push('/oracle-natif')} accessibilityRole="link" hitSlop={6}>
            <Text style={st.link}>{t('Ignis grandit avec les gestes accomplis après un tirage de l’Oracle ›')}</Text>
          </Pressable>
        </View>

        {/* Le ciel de naissance */}
        <View style={st.card}>
          <Text style={st.h}>{t('TON CIEL DE NAISSANCE')}</Text>
          {placements && !editBirth ? (
            <>
              {placements.map((p) => (
                <Text key={p.sister} style={st.place}>
                  <Text style={st.qS}>{p.sister}</Text> · {t(p.astre)} {t('en')} {t(p.sign)} {p.degree}°{p.reasons.length ? ` · ${p.reasons.map((r) => t(r)).join(', ')}` : ''}
                </Text>
              ))}
              {angs ? (
                <Text style={st.place}>
                  <Text style={st.qS}>{t('Ascendant')}</Text> {t('en')} {t(angs.ascSign)} {Math.floor(angs.asc % 30)}° · <Text style={st.qS}>{t('Milieu du ciel')}</Text> {t('en')} {t(angs.mcSign)} {Math.floor(angs.mc % 30)}°
                </Text>
              ) : (
                <Text style={st.small}>{t('Ajoute l’heure et le lieu de naissance pour l’ascendant et le milieu du ciel.')}</Text>
              )}
              {birth?.place ? <Text style={st.small}>{t('Né·e à {p}', { p: birth.place })}{birth.time ? ` · ${birth.time}` : ''}</Text> : null}
              <Pressable onPress={() => setEditBirth(true)} accessibilityRole="button" hitSlop={8}>
                <Text style={st.link}>{t('Modifier ma date de naissance ›')}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={st.small}>{t('Ta date de naissance, et si tu les connais l’heure et le lieu. Le calcul se fait sur ton téléphone : rien n’est envoyé.')}</Text>
              <TextInput value={form.date} onChangeText={(d) => setForm((f) => ({ ...f, date: d.slice(0, 10) }))} placeholder="AAAA-MM-JJ" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" style={st.input} accessibilityLabel={t('Date de naissance')} />
              <TextInput value={form.time} onChangeText={(h) => setForm((f) => ({ ...f, time: h.slice(0, 5) }))} placeholder={t('HH:MM (facultatif)')} placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" style={st.input} accessibilityLabel={t('Heure de naissance')} />
              <TextInput
                value={placeQ}
                onChangeText={(q) => { setPlaceQ(q); setForm((f) => ({ ...f, place: villeByName(q) ? q : '' })); }}
                placeholder={t('Lieu de naissance (facultatif)')}
                placeholderTextColor={colors.muted}
                style={st.input}
                accessibilityLabel={t('Lieu de naissance')}
              />
              {suggestions.length ? (
                <View style={st.sugg}>
                  {suggestions.map((v) => (
                    <Pressable key={v.name} onPress={() => { setPlaceQ(v.name); setForm((f) => ({ ...f, place: v.name })); }} style={st.suggI} accessibilityRole="button">
                      <Text style={st.suggT}>{v.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : placeQ && !villeByName(placeQ) && placeQ.length >= 2 ? (
                <Text style={st.small}>{t('Ville absente de la liste : choisis la grande ville la plus proche.')}</Text>
              ) : null}
              <Pressable onPress={() => void saveSky()} disabled={!skyValid} style={[st.cta, !skyValid && { opacity: 0.45 }]} accessibilityRole="button">
                <Text style={st.ctaT}>{t('Lire mon ciel')}</Text>
              </Pressable>
            </>
          )}
          <Text style={st.small}>{t('Lecture symbolique : les correspondances astrales inspirent la réflexion, elles ne décrivent ni ne prédisent qui tu es. Ce qui compte ici, c’est ce que tu en fais.')}</Text>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  kicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.8, color: colors.gold, textAlign: 'center' },
  title: { fontFamily: fonts.title, fontSize: 28, lineHeight: 32, color: colors.text, textAlign: 'center' },
  card: { backgroundColor: CARD, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.md, gap: space.sm },
  h: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.8, color: colors.gold },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  legendT: { fontFamily: fonts.bodyMedium, fontSize: 12 },
  readLead: { fontFamily: fonts.titleItalic, fontSize: 19, lineHeight: 26, color: colors.text },
  read: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  doors: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  door: { flex: 1, alignItems: 'center', gap: 4 },
  doorK: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.4, color: colors.muted, textAlign: 'center' },
  doorImg: { width: 112, height: 106, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(240,214,140,0.55)', backgroundColor: '#0b0d1e' },
  doorName: { fontFamily: fonts.title, fontSize: 18, color: colors.text, textAlign: 'center' },
  doorSis: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textAlign: 'center' },
  arrow: { fontFamily: fonts.title, fontSize: 26, color: colors.gold },
  path: { fontFamily: fonts.bodyMedium, fontSize: 13.5, lineHeight: 19, color: GOLD2, textAlign: 'center' },
  small: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.muted },
  link: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.gold },
  q: { gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(216,182,107,0.15)' },
  qT: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 20, color: colors.text },
  qS: { fontFamily: fonts.bodyBold, color: colors.gold },
  scale: { flexDirection: 'row', gap: 8 },
  dot: { width: 40, height: 36, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dotOn: { backgroundColor: '#e8cf8f', borderColor: '#e8cf8f' },
  dotT: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  dotTOn: { color: '#1b1730' },
  cta: { backgroundColor: '#e8cf8f', borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  ctaT: { fontFamily: fonts.title, fontSize: 19, color: '#1b1730' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowS: { width: 52, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)' },
  fill: { height: 8, borderRadius: 4, backgroundColor: GOLD2, opacity: 0.85 },
  tick: { position: 'absolute', top: -3, width: 2, height: 14, marginLeft: -1, backgroundColor: colors.gold },
  rowN: { width: 22, textAlign: 'right', fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  place: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.text },
  sugg: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' },
  suggI: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(216,182,107,0.12)' },
  suggT: { fontFamily: fonts.body, fontSize: 15, color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontFamily: fonts.body, fontSize: 16 },
});
