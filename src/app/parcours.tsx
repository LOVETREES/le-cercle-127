import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Stop } from 'react-native-svg';

import { Body, Eyebrow, GoldButton, OutlineButton, Screen, Title } from '../components/ui';
import { iconKey, SYMBOL_HINT, SymbolIcon } from '../components/SymbolIcon';
import { journey } from '../lib/insights';
import { EMOTIONS, type Dream } from '../lib/model';
import { useSession } from '../lib/session';
import { colors, fonts, radius, space } from '../lib/theme';
import { locale, t } from '../i18n';

// « Mon parcours onirique » : ce qui se dessine au fil des nuits, lu dans VOS rêves. Tout est calculé sur l'appareil.

const GOLD2 = '#f3dca0';
const CARD = '#11122a';
const EMO_COLOR: Record<string, string> = {
  joie: '#f0c96a', serenite: '#8fdad3', emerveillement: '#c9b6ff', soulagement: '#a9c98a', surprise: '#f2a97e',
  confusion: '#a9a4b8', culpabilite: '#b58fb0', tristesse: '#7f9fd6', colere: '#e07a6a', peur: '#9b7fd0', autre: '#d8b66b',
};
const CALM = new Set(['joie', 'serenite', 'emerveillement', 'soulagement']);
const emoLabel = (v?: string) => t(EMOTIONS.find((e) => e.value === v)?.label ?? v ?? '');
const pad = (n: number) => String(n).padStart(2, '0');
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hintFor = (s: string) => t(SYMBOL_HINT[iconKey(s)]);

type Night = { day: Date; dream: boolean; emotion?: string };

/** Les 30 dernières nuits : rêve noté ou non, et son émotion. */
function lastNights(dreams: Dream[], today = new Date()): Night[] {
  const by = new Map<string, Dream>();
  for (const d of dreams) if (!by.has(d.dreamDate.slice(0, 10))) by.set(d.dreamDate.slice(0, 10), d);
  return Array.from({ length: 30 }, (_, i) => {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29 + i);
    const d = by.get(isoDay(day));
    return { day, dream: !!d, emotion: d?.emotion };
  });
}

/* ---------- Constellation : une étoile par nuit rêvée, reliées quand les rêves se suivent ---------- */
function Constellation({ nights }: { nights: Night[] }) {
  const W = 320, H = 140;
  const pts = nights.map((n, i) => ({
    ...n,
    x: 14 + (i / 29) * (W - 28),
    y: 90 - Math.sin((i / 29) * Math.PI) * 52 + (i % 3 === 0 ? -9 : i % 3 === 1 ? 7 : 0),
  }));
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} accessibilityLabel={t('{n} nuits rêvées sur les 30 dernières', { n: nights.filter((n) => n.dream).length })}>
      <Defs>
        <RadialGradient id="st" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={GOLD2} stopOpacity={0.9} />
          <Stop offset="1" stopColor={colors.gold} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Path d={`M14 ${H - 12} Q${W / 2} ${H - 34} ${W - 14} ${H - 12}`} stroke={colors.gold} strokeOpacity={0.25} fill="none" />
      {pts.map((p, i) =>
        i > 0 && p.dream && pts[i - 1].dream ? (
          <Line key={`l${i}`} x1={pts[i - 1].x} y1={pts[i - 1].y} x2={p.x} y2={p.y} stroke={GOLD2} strokeOpacity={0.55} strokeWidth={1} />
        ) : null,
      )}
      {pts.map((p, i) =>
        p.dream ? (
          <G key={`s${i}`}>
            <Circle cx={p.x} cy={p.y} r={9} fill="url(#st)" />
            <Circle cx={p.x} cy={p.y} r={3.4} fill={EMO_COLOR[p.emotion ?? ''] ?? GOLD2} />
          </G>
        ) : (
          <Circle key={`s${i}`} cx={p.x} cy={p.y} r={1.3} fill={colors.muted} opacity={0.45} />
        ),
      )}
    </Svg>
  );
}

/* ---------- Une lune par mois : plus elle est pleine, plus vous avez rêvé ---------- */
function Moon({ fill, size = 34 }: { fill: number; size?: number }) {
  const r = size / 2 - 2, c = size / 2;
  const f = Math.min(1, Math.max(0, fill));
  // Le terminateur : une demi-ellipse dont la largeur suit le remplissage (0 = nouvelle lune, 1 = pleine).
  const k = Math.cos(Math.PI * f);
  const lit = f <= 0.02
    ? ''
    : f >= 0.98
      ? `M${c} ${c - r}a${r} ${r} 0 1 1 0 ${2 * r}a${r} ${r} 0 1 1 0 ${-2 * r}`
      : `M${c} ${c - r}a${r} ${r} 0 0 1 0 ${2 * r}a${Math.max(0.01, Math.abs(k * r))} ${r} 0 0 ${k > 0 ? 0 : 1} 0 ${-2 * r}`;
  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={r} fill="#1b1d3a" stroke={colors.gold} strokeOpacity={0.35} />
      {lit ? <Path d={lit} fill={GOLD2} opacity={0.92} /> : null}
    </Svg>
  );
}

export default function Parcours() {
  const { dreams } = useSession();
  const j = useMemo(() => journey(dreams), [dreams]);
  const nights = useMemo(() => lastNights(dreams), [dreams]);
  const maxMonth = Math.max(1, ...j.months.map((m) => m.count));
  const maxEmo = Math.max(1, ...j.emotions.map((e) => e.count));
  const dreamt30 = nights.filter((n) => n.dream).length;

  // La lecture : quelques phrases tirées de VOS données, pas un texte type.
  const reading = useMemo(() => {
    if (!j.total) return [];
    const out: string[] = [];
    const first = [...dreams].sort((a, b) => a.dreamDate.localeCompare(b.dreamDate))[0];
    const since = first ? new Date(`${first.dreamDate.slice(0, 10)}T12:00:00`) : undefined;
    const s = j.total > 1 ? 's' : '';
    out.push(
      since && !Number.isNaN(since.getTime())
        ? t('Depuis le {d}, vous avez confié {n} rêve{s} à votre Grimoire.', { d: since.toLocaleDateString(locale(), { day: 'numeric', month: 'long' }), n: j.total, s })
        : t('Vous avez confié {n} rêve{s} à votre Grimoire.', { n: j.total, s }),
    );
    const top = j.recurring[0];
    if (top) out.push(`${t('Votre fil rouge : « {s} », revenu {n} fois.', { s: top[0], n: top[1] })} ${hintFor(top[0])}`);
    const counts = new Map<string, number>();
    for (const d of dreams) if (d.emotion && d.emotion !== 'aucune' && d.emotion !== 'autre') counts.set(d.emotion, (counts.get(d.emotion) ?? 0) + 1);
    const dom = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (dom) {
      const e = emoLabel(dom).toLowerCase();
      out.push(CALM.has(dom) ? t('Vos nuits penchent vers la lumière : « {e} » y domine.', { e }) : t('Vos nuits traversent surtout « {e} » : elle a quelque chose à vous dire.', { e }));
    }
    if (j.calmShare) {
      const { before, after } = j.calmShare;
      out.push(
        after > before
          ? t('Quelque chose s’apaise : vos rêves lumineux passent de {a} % à {b} %.', { a: before, b: after })
          : after < before
            ? t('Une traversée est en cours : vos rêves lumineux passent de {a} % à {b} %. C’est souvent là que l’on grandit.', { a: before, b: after })
            : t('Votre climat intérieur reste stable : {a} % de rêves lumineux.', { a: after }),
      );
    }
    return out;
  }, [dreams, j]);

  return (
    <Screen>
      <View style={st.hero}>
        <Eyebrow>{t('Mon parcours onirique')}</Eyebrow>
        <Title size={36}>{t('Ce qui se dessine…')}</Title>
        <Body muted style={{ textAlign: 'center' }}>{t('Un miroir de vos nuits, jamais un jugement.')}</Body>
      </View>

      {j.total === 0 ? (
        <View style={st.card}>
          <Constellation nights={nights} />
          <Body style={{ textAlign: 'center' }}>{t('Votre ciel est encore vierge : chaque rêve noté y allume une étoile.')}</Body>
          <GoldButton label={t('Raconter un rêve')} onPress={() => router.navigate('/reve')} />
        </View>
      ) : (
        <>
          <View style={st.card}>
            <Text style={st.kicker}>{t('VOTRE CIEL · 30 DERNIÈRES NUITS')}</Text>
            <Constellation nights={nights} />
            <View style={st.skyRow}>
              <SkyStat value={dreamt30} label={t('nuits rêvées')} />
              <SkyStat value={j.currentStreak} label={t('d’affilée')} />
              <SkyStat value={j.longestStreak} label={t('meilleure série')} />
            </View>
          </View>

          <View style={[st.card, st.readingCard]}>
            <Text style={st.kicker}>{t('LA LECTURE DE VOTRE PARCOURS')}</Text>
            {reading.map((r, i) => (
              <Text key={i} style={i === 0 ? st.readLead : st.readLine}>{r}</Text>
            ))}
            <View style={st.orn}>
              <View style={st.ornLine} />
              <Text style={st.ornStar}>✦</Text>
              <View style={st.ornLine} />
            </View>
          </View>

          <View style={st.card}>
            <Text style={st.kicker}>{t('VOS SYMBOLES FIL ROUGE')}</Text>
            {j.recurring.length === 0 ? (
              <Body muted>{t('Aucun symbole ne revient encore. Ils apparaîtront ici au fil des nuits.')}</Body>
            ) : (
              j.recurring.slice(0, 4).map(([s, n]) => (
                <View key={s} style={st.symRow}>
                  <View style={st.symIcon}>
                    <SymbolIcon name={iconKey(s)} size={26} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={st.symName}>
                      {s} <Text style={st.symCount}>· {t('{n} fois', { n })}</Text>
                    </Text>
                    <Text style={st.hint}>{hintFor(s)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={st.card}>
            <Text style={st.kicker}>{t('VOS LUNES · 6 DERNIERS MOIS')}</Text>
            <View style={st.moons}>
              {j.months.map((m) => (
                <View key={m.key} style={st.moonCol} accessibilityLabel={t('{v0} : {v1} rêve{v2}', { v0: m.label, v1: m.count, v2: m.count > 1 ? 's' : '' })}>
                  <Moon fill={m.count / maxMonth} />
                  <Text style={st.moonCount}>{m.count}</Text>
                  <Text style={st.moonLabel}>{t(m.label)}</Text>
                </View>
              ))}
            </View>
            <Text style={st.hint}>{t('Plus la lune est pleine, plus le mois a été riche en rêves.')}</Text>
          </View>

          {j.emotions.length > 0 && (
            <View style={st.card}>
              <Text style={st.kicker}>{t('VOTRE CLIMAT ÉMOTIONNEL')}</Text>
              {j.emotions.slice(0, 5).map((e) => {
                const c = EMO_COLOR[EMOTIONS.find((x) => x.label === e.label)?.value ?? 'autre'] ?? colors.gold;
                return (
                  <View key={e.label} style={st.emoRow}>
                    <View style={[st.emoDot, { backgroundColor: c }]} />
                    <Text style={st.emoLabel}>{t(e.label)}</Text>
                    <View style={st.emoTrack}>
                      <View style={[st.emoFill, { width: `${(e.count / maxEmo) * 100}%`, backgroundColor: c }]} />
                    </View>
                    <Text style={st.emoCount}>{e.count}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <GoldButton label={t('Ajouter une étoile : raconter un rêve')} onPress={() => router.navigate('/reve')} />
        </>
      )}

      <View style={st.quote}>
        <View style={st.ornLine} />
        <Text style={st.quoteT}>{t('Ce qui revient la nuit cherche un chemin vers le jour.')}</Text>
        <View style={st.ornLine} />
      </View>
      <Body muted style={{ fontSize: 12, textAlign: 'center' }}>
        {t('Ces mesures restent sur votre téléphone et ne remplacent pas un accompagnement thérapeutique.')}
      </Body>
      <OutlineButton label={t('Retour à l’accueil')} onPress={() => router.navigate('/')} />
    </Screen>
  );
}

function SkyStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={st.skyStat}>
      <Text style={st.skyValue}>{value}</Text>
      <Text style={st.skyLabel}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  hero: { alignItems: 'center', gap: space.xs, paddingTop: space.sm },
  card: { backgroundColor: CARD, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.md, gap: space.sm },
  readingCard: { borderColor: 'rgba(216,182,107,0.5)', backgroundColor: '#14132b' },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.8, color: colors.gold },
  skyRow: { flexDirection: 'row', justifyContent: 'space-around' },
  skyStat: { alignItems: 'center' },
  skyValue: { fontFamily: fonts.title, fontSize: 30, color: GOLD2 },
  skyLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  readLead: { fontFamily: fonts.titleItalic, fontSize: 21, lineHeight: 28, color: colors.text },
  readLine: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  orn: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: space.xs },
  ornLine: { flex: 1, height: 1, backgroundColor: colors.gold, opacity: 0.45 },
  ornStar: { color: colors.gold, fontSize: 14 },
  symRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 6 },
  symIcon: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(216,182,107,0.06)' },
  symName: { fontFamily: fonts.title, fontSize: 20, color: colors.text },
  symCount: { fontFamily: fonts.body, fontSize: 13, color: colors.gold },
  hint: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.muted },
  moons: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.xs },
  moonCol: { alignItems: 'center', gap: 4, flex: 1 },
  moonCount: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text },
  moonLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  emoRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  emoDot: { width: 8, height: 8, borderRadius: 4 },
  emoLabel: { width: 104, fontFamily: fonts.body, fontSize: 13, color: colors.text },
  emoTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  emoFill: { height: 6, borderRadius: 3, opacity: 0.85 },
  emoCount: { width: 24, textAlign: 'right', fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
  quote: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: space.sm },
  quoteT: { flexShrink: 1, maxWidth: 240, fontFamily: fonts.titleItalic, fontSize: 17, lineHeight: 23, color: colors.text, textAlign: 'center' },
});
