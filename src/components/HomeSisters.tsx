// Deux Sœurs sur l'accueil : Naïa (réguler l'émotion du moment) et Terra (la main du jour).
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type GestureResponderEvent, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FEATURES } from '../lib/features';
import { api } from '../lib/api';
import { dayKey } from '../lib/insights';
import { useSession } from '../lib/session';
import { EMOTIONS, emotionOf, lastSevenDays, listEmotions, recordEmotion, type EmotionEntry, type EmotionKey } from '../lib/naia';
import { listPalmReadings, type PalmReading } from '../lib/palm';
import { colors, fonts, radius, space } from '../lib/theme';
import { getLang, quote, t } from '../i18n';

const NAIA = '#8fdad3';
const TERRA = '#a9c98a';

const openSister = (path: string, title: string) => router.push({ pathname: '/page', params: { path, title } });

const SISTER_NAMES: Record<string, string> = { oni: 'Oni', alka: 'Alka', naia: 'Naïa', terra: 'Terra', ignis: 'Ignis', astria: 'Astria', irma: 'Irma' };

/** Framework 127 : la Conscience choisit la Sœur qui répond (avec l'accord de la personne). */
function AskSister({ emotion, entries }: { emotion: EmotionKey; entries: EmotionEntry[] }) {
  const { token, isDemo } = useSession();
  const [consent, setConsent] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<{ sister: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!FEATURES.sisters || !token || isDemo) return null;

  const ask = async () => {
    setBusy(true);
    setError(null);
    const recent: Record<string, number> = {};
    for (const d of lastSevenDays(entries)) if (d.key) recent[d.key] = (recent[d.key] ?? 0) + 1;
    try {
      const r = (await api.sisterForEmotion(token, { emotion, recent, consent: true, remember, lang: getLang() })) as { sister?: string; answer?: string };
      setAnswer({ sister: SISTER_NAMES[r?.sister ?? ''] ?? 'Naïa', text: r?.answer || t('La Sœur a bien reçu ton émotion. Sa réponse arrive dans ton Grimoire.') });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Les Sœurs se reposent un instant. Réessaie plus tard.'));
    } finally {
      setBusy(false);
    }
  };

  if (answer) {
    return (
      <View style={st.ritual}>
        <Text style={[st.label, { color: NAIA }]}>{t('LA RÉPONSE DE {s}', { s: answer.sister.toUpperCase() })}</Text>
        <Text style={st.text}>{answer.text}</Text>
      </View>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      <Pressable onPress={() => setConsent((c) => !c)} accessibilityRole="checkbox" accessibilityState={{ checked: consent }} style={st.check}>
        <Text style={st.box}>{consent ? '☑' : '☐'}</Text>
        <Text style={[st.text, { flex: 1, fontSize: 13 }]}>{t('J’accepte que mon émotion soit confiée aux Sœurs (service d’IA) pour recevoir une réponse.')}</Text>
      </Pressable>
      <Pressable onPress={() => setRemember((c) => !c)} accessibilityRole="checkbox" accessibilityState={{ checked: remember }} style={st.check}>
        <Text style={st.box}>{remember ? '☑' : '☐'}</Text>
        <Text style={[st.text, { flex: 1, fontSize: 13 }]}>{t('Les Sœurs peuvent s’en souvenir pour suivre mon chemin (effaçable à tout moment).')}</Text>
      </Pressable>
      <Pressable disabled={!consent || busy} onPress={ask} accessibilityRole="button" style={[st.askBtn, (!consent || busy) && { opacity: 0.45 }]}>
        <Text style={st.askText}>{busy ? t('La Conscience choisit la Sœur…') : t('Demander à la Sœur la plus juste ›')}</Text>
      </Pressable>
      {error ? <Text style={[st.text, { color: '#eb9a68' }]}>{error}</Text> : null}
    </View>
  );
}

// Du plus lourd au plus léger : l'ordre du curseur d'émotion.
const SPECTRUM: EmotionKey[] = ['colere', 'peur', 'culpabilite', 'tristesse', 'confusion', 'soulagement', 'joie', 'serenite'];
const THUMB = 34;

/** Un curseur à glisser (ou toucher) pour nommer l'émotion du moment ; il se fixe sur le mot le plus proche. */
function EmotionSlider({ value, onPick, disabled }: { value?: EmotionKey; onPick: (k: EmotionKey) => void; disabled?: boolean }) {
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const live = useRef({ width: 0, idx: -1, x0: 0, disabled, onPick });
  useEffect(() => { live.current.disabled = disabled; live.current.onPick = onPick; }, [disabled, onPick]);
  const idx = drag ?? picked ?? (value ? SPECTRUM.indexOf(value) : -1);

  // x0 : décalage entre la page et le début du curseur, relevé au premier contact.
  const at = (pageX: number) => {
    const w = live.current.width;
    if (!w) return 0;
    return Math.max(0, Math.min(SPECTRUM.length - 1, Math.round((pageX - live.current.x0 - THUMB / 2) / ((w - THUMB) / (SPECTRUM.length - 1)))));
  };
  const move = (i: number) => { live.current.idx = i; setDrag(i); };
  const touch = {
    onStartShouldSetResponder: () => !live.current.disabled,
    onMoveShouldSetResponder: () => !live.current.disabled,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (ev: GestureResponderEvent) => { live.current.x0 = ev.nativeEvent.pageX - ev.nativeEvent.locationX; move(at(ev.nativeEvent.pageX)); },
    onResponderMove: (ev: GestureResponderEvent) => move(at(ev.nativeEvent.pageX)),
    onResponderRelease: () => { const i = live.current.idx; setPicked(i); setDrag(null); if (i >= 0) live.current.onPick(SPECTRUM[i]); },
    onResponderTerminate: () => setDrag(null),
  };
  const step = (w: number) => (w - THUMB) / (SPECTRUM.length - 1);
  const dragging = drag !== null;

  const e = idx >= 0 ? emotionOf(SPECTRUM[idx]) : undefined;
  const left = width ? (idx >= 0 ? idx * step(width) : (width - THUMB) / 2) : 0;
  const nudge = (d: number) => {
    const i = Math.max(0, Math.min(SPECTRUM.length - 1, (idx < 0 ? 4 : idx) + d));
    live.current.idx = i; setPicked(i); onPick(SPECTRUM[i]);
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={[st.sliderValue, { color: e?.color ?? colors.muted }]} accessibilityLiveRegion="polite">
        {e ? `${e.sign}  ${t(e.name)}` : t('Faites glisser vers ce que vous ressentez')}
      </Text>
      <View
        {...touch}
        onLayout={(ev) => { live.current.width = ev.nativeEvent.layout.width; setWidth(ev.nativeEvent.layout.width); }}
        style={st.sliderTrack}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t('Curseur d’émotion')}
        accessibilityValue={{ text: e ? t(e.name) : t('Aucune émotion choisie') }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(ev) => nudge(ev.nativeEvent.actionName === 'increment' ? 1 : -1)}
      >
        <View pointerEvents="none" style={st.sliderBar}>
          {SPECTRUM.map((k) => <View key={k} style={{ flex: 1, backgroundColor: emotionOf(k)?.color, opacity: e?.key === k ? 1 : 0.45 }} />)}
        </View>
        {width > 0 && (
          <View pointerEvents="none" style={[st.sliderThumb, { left, borderColor: e?.color ?? colors.gold, transform: [{ scale: dragging ? 1.12 : 1 }] }]}>
            <Text style={[st.sliderSign, { color: e?.color ?? colors.gold }]}>{e?.sign ?? '✦'}</Text>
          </View>
        )}
      </View>
      <View style={st.sliderEnds} pointerEvents="none">
        <Text style={st.sliderEnd}>{t('Ce qui pèse')}</Text>
        <Text style={st.sliderEnd}>{t('Ce qui apaise')}</Text>
      </View>
    </View>
  );
}

export function NaiaCard({ onRecorded, folded = false }: { onRecorded?: () => void; folded?: boolean } = {}) {
  const [more, setMore] = useState(!folded);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [entries, setEntries] = useState<EmotionEntry[]>([]);
  const [open, setOpen] = useState<EmotionKey | null>(null);
  const today = dayKey(new Date());

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listEmotions().then((l) => active && setEntries(l), () => undefined);
      return () => {
        active = false;
      };
    }, []),
  );

  const todays = entries.find((e) => e.day === today)?.key;
  const shown = emotionOf(open ?? undefined);

  const choose = async (key: EmotionKey) => {
    if (saving) return;
    setSaving(true); setSaveError(false);
    try { const list = await recordEmotion(key); setEntries(list); setOpen(key); onRecorded?.(); }
    catch { setSaveError(true); }
    finally { setSaving(false); }
  };
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const palette = expanded ? EMOTIONS.filter(e => normalize(t(e.name)).includes(normalize(query.trim()))) : EMOTIONS.filter(e => ['peur', 'colere', 'tristesse', 'culpabilite', 'confusion', 'soulagement', 'joie', 'serenite'].includes(e.key));

  return (
    <View style={[st.card, { borderColor: 'rgba(143,218,211,0.35)' }]}>
      <Text style={[st.kicker, { color: NAIA }]}>{t('NAÏA · RÉGULER MES ÉMOTIONS')}</Text>
      <Text style={st.title}>{t('Qu’est-ce qui vous traverse en ce moment ?')}</Text>
      {folded && <EmotionSlider value={open ?? todays} onPick={(k) => void choose(k)} disabled={saving} />}
      {more && <>
      <Text style={st.text}>{t('Choisissez le mot le plus proche. Ces besoins possibles sont des pistes, pas une explication imposée.')}</Text>
      {expanded && <TextInput value={query} onChangeText={setQuery} accessibilityLabel={t('Chercher une émotion')} placeholder={t('Chercher une émotion')} placeholderTextColor={colors.muted} style={{ color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, fontFamily: fonts.body }} />}
      <View style={st.chips} accessibilityRole="radiogroup">
        {palette.map((e) => {
          const on = (open ?? todays) === e.key;
          return (
            <Pressable
              key={e.key}
              onPress={() => void choose(e.key)}
              disabled={saving}
              style={[st.chip, on && { borderColor: e.color, backgroundColor: 'rgba(255,255,255,0.06)' }]}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled: saving }}
              aria-checked={on}
            >
              <Text style={[st.chipText, { color: on ? e.color : colors.text }]}>
                {e.sign} {t(e.name)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {palette.length === 0 && <Text style={st.text}>{t('Aucun mot ne correspond ? Vous pouvez décrire votre ressenti dans le journal privé.')}</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => { setExpanded(!expanded); setQuery(''); }}>
        <Text style={[st.link, { color: NAIA }]}>{t(expanded ? 'Réduire la palette' : 'Explorer toutes les émotions')}</Text>
      </Pressable>
      </>}
      {saveError && <Text accessibilityRole="alert" style={{ color: colors.danger }}>{t('Votre émotion n’a pas pu être gardée. Réessayez.')}</Text>}

      {shown && (
        <View style={st.ritual}>
          {[
            ['ÉCOUTER', shown.need],
            ['LOCALISER', shown.body],
            ['UN GESTE DOUX', shown.gesture],
          ].map(([label, text]) => (
            <View key={label} style={{ gap: 2 }}>
              <Text style={[st.label, { color: shown.color }]}>{t(label)}</Text>
              <Text style={st.text}>{t(text)}</Text>
            </View>
          ))}
          <Text style={st.phrase}>{quote(t(shown.phrase))}</Text>
          {['peur', 'colere', 'tristesse', 'culpabilite', 'confusion', 'soulagement'].includes(shown.key)
            ? <AskSister key={shown.key} emotion={shown.key} entries={entries} />
            : <Text style={st.text}>{t('Ce repère et son geste restent sur cet appareil.')}</Text>}
        </View>
      )}
      {more && <>
      <Pressable accessibilityRole="link" onPress={() => router.push('/journal-intime')}><Text style={[st.link, { color: NAIA }]}>{t('Mettre mes propres mots dans mon journal privé ›')}</Text></Pressable>

      <Pressable onPress={() => openSister('/naia-gardienne-des-emotions/', 'Naïa')} accessibilityRole="link">
        <Text style={[st.link, { color: NAIA }]}>{t('Aller plus loin avec Naïa ›')}</Text>
      </Pressable>
      </>}
      {folded && (
        <Pressable onPress={() => setMore((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: more }} aria-expanded={more} hitSlop={6} style={st.moreRow}>
          <View style={st.moreLine} />
          <Text style={st.moreText}>{more ? `✦ ${t('Replier')} ⌃` : `✦ ${t('Lire la suite')} ⌄`}</Text>
          <View style={st.moreLine} />
        </Pressable>
      )}
    </View>
  );
}

const LINES = [
  { name: 'Cœur', color: '#e8a3ae' },
  { name: 'Tête', color: '#e2c06f' },
  { name: 'Vie', color: '#7fc28f' },
];

export function TerraCard() {
  const [last, setLast] = useState<PalmReading | undefined>();
  useFocusEffect(
    useCallback(() => {
      let active = true;
      listPalmReadings().then(
        (l) => active && setLast(l.reduce<PalmReading | undefined>((a, b) => (!a || b.at > a.at ? b : a), undefined)),
        () => undefined,
      );
      return () => {
        active = false;
      };
    }, []),
  );
  const doneToday = !!last && dayKey(new Date(last.at)) === dayKey(new Date());

  return (
    <Pressable
      style={[st.card, { borderColor: 'rgba(169,201,138,0.35)' }]}
      onPress={() => (doneToday ? router.push({ pathname: '/mes-lectures', params: { tab: 'main' } }) : openSister('/terra-gardienne-de-lancrage/', 'Terra'))}
      accessibilityRole="link"
      accessibilityLabel={doneToday ? t('Terra : revoir la lecture de ma main du jour') : t('Terra : lire les lignes de ma main')}
    >
      <Text style={[st.kicker, { color: TERRA }]}>{t('TERRA · VOTRE MAIN DU JOUR')}</Text>
      <View style={st.handVisual} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Image source={require('../../assets/images/terra-main.webp')} style={st.handPhoto} resizeMode="cover" accessible={false} />
        <View style={st.handLegend}>
          {LINES.map((l) => <Text key={l.name} style={[st.handLegendText, { color: l.color }]}>● {t(l.name)}</Text>)}
        </View>
      </View>
      <View style={{ gap: 4 }}>
        {doneToday ? (
          <>
            <Text style={st.title}>{t('Votre main a parlé aujourd’hui')}</Text>
            {last?.mantra ? <Text style={st.text} numberOfLines={2}>{last.mantra}</Text> : null}
            <Text style={[st.link, { color: TERRA }]}>{t('Revoir ma lecture ›')}</Text>
          </>
        ) : (
          <>
            <Text style={st.title}>{t('Lire les lignes de ma main')}</Text>
            <Text style={st.text}>{t('Une lecture par jour : un geste, un mantra, une question.')}</Text>
          </>
        )}
        {FEATURES.palmDetailed ? (
          <Pressable onPress={() => router.push('/lecture-main')} accessibilityRole="link" hitSlop={6}>
            <Text style={[st.link, { color: TERRA }]}>{t('✦ Lecture détaillée sur photo ›')}</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const ASTRIA = '#f2dea8';

/** Astria en avant : sa carte du Cercle (le quiz du site, calculé sur le téléphone). */
export function AstriaCard() {
  return (
    <Pressable
      style={st.astria}
      onPress={() => openSister('/quiz-astria/', 'Astria')}
      accessibilityRole="link"
      accessibilityLabel={t('Astria : découvrir ma carte du Cercle')}
    >
      <View style={st.astriaHead}>
        <View style={st.astriaHalo}>
          <Image source={require('../../assets/images/astria.webp')} style={st.astriaPic} resizeMode="cover" accessible={false} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[st.kicker, { color: ASTRIA }]}>{t('✦ ASTRIA · TA CARTE DU CERCLE')}</Text>
          <Text style={st.title}>{t('Que dit ton ciel ?')}</Text>
        </View>
      </View>
      <Text style={st.text}>{t('Sept questions, et Astria trace ta carte : ton Soleil, ta Lune, ton ascendant, la Sœur qui te guide et ta porte parmi les 127.')}</Text>
      <View style={st.astriaBtn}>
        <Text style={st.astriaBtnText}>{t('Lire ma carte avec Astria  ›')}</Text>
      </View>
      <Text style={st.astriaMeta}>{t('2 minutes · calculé sur ton téléphone, rien n’est envoyé')}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  astria: { padding: space.md, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(242,222,168,0.55)', backgroundColor: '#15122a', gap: 12, shadowColor: ASTRIA, shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
  astriaHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  astriaHalo: { width: 68, height: 68, borderRadius: 34, borderWidth: 1.5, borderColor: ASTRIA, overflow: 'hidden', backgroundColor: colors.night },
  astriaPic: { width: '100%', height: '100%' },
  astriaBtn: { minHeight: 50, borderRadius: 999, backgroundColor: '#e8cf8f', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  astriaBtnText: { fontFamily: fonts.title, fontSize: 20, color: '#1b1730' },
  astriaMeta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, textAlign: 'center' },
  sliderValue: { fontFamily: fonts.title, fontSize: 21, lineHeight: 26, textAlign: 'center' },
  sliderTrack: { height: 48, justifyContent: 'center' },
  sliderBar: { flexDirection: 'row', height: 8, marginHorizontal: THUMB / 2, borderRadius: 999, overflow: 'hidden' },
  sliderThumb: { position: 'absolute', top: (48 - THUMB) / 2, width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: 2, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  sliderSign: { fontSize: 15, lineHeight: 18 },
  sliderEnds: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderEnd: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, letterSpacing: 0.4 },
  moreRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 },
  moreLine: { flex: 1, height: 1, backgroundColor: 'rgba(143,218,211,0.3)' },
  moreText: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: 0.4, color: NAIA },
  card: { padding: space.md, borderRadius: radius.md, borderWidth: 1, backgroundColor: colors.surface, gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.8 },
  title: { fontFamily: fonts.title, fontSize: 22, lineHeight: 26, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 14 },
  ritual: { gap: 10, padding: space.md, borderRadius: radius.md, backgroundColor: 'rgba(143,218,211,0.07)' },
  label: { fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 1.6 },
  text: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.text },
  phrase: { fontFamily: fonts.title, fontSize: 19, lineHeight: 25, color: colors.text, fontStyle: 'italic' },
  link: { fontFamily: fonts.bodyBold, fontSize: 14 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { fontFamily: fonts.bodyMedium, fontSize: 12.5 },
  handVisual: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.night },
  handPhoto: { width: '55%', height: 180 },
  handLegend: { flex: 1, padding: 12, gap: 10 },
  handLegendText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  chevron: { color: colors.gold, fontSize: 24 },
  check: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  box: { fontSize: 18, color: NAIA, lineHeight: 20 },
  askBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: NAIA, alignSelf: 'flex-start' },
  askText: { fontFamily: fonts.bodyBold, fontSize: 14, color: NAIA },
});
