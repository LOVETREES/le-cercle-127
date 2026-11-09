// Deux Sœurs sur l'accueil : Naïa (réguler l'émotion du moment) et Terra (la main du jour).
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { FEATURES } from '../lib/features';
import { api } from '../lib/api';
import { dayKey } from '../lib/insights';
import { useSession } from '../lib/session';
import { EMOTIONS, emotionOf, lastSevenDays, listEmotions, recordEmotion, type EmotionEntry, type EmotionKey } from '../lib/naia';
import { listPalmReadings, type PalmReading } from '../lib/palm';
import { colors, fonts, radius, space } from '../lib/theme';
import { getLang, locale, quote, t } from '../i18n';

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

export function NaiaCard({ onRecorded }: { onRecorded?: () => void } = {}) {
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
  const week = lastSevenDays(entries);

  const choose = (key: EmotionKey) => {
    setOpen(key);
    recordEmotion(key).then((l) => { setEntries(l); onRecorded?.(); }, () => undefined);
  };

  return (
    <View style={[st.card, { borderColor: 'rgba(143,218,211,0.35)' }]}>
      <Text style={[st.kicker, { color: NAIA }]}>{t('NAÏA · RÉGULER MES ÉMOTIONS')}</Text>
      <Text style={st.title}>{t('Qu’est-ce qui vous traverse en ce moment ?')}</Text>
      <View style={st.chips} accessibilityRole="radiogroup">
        {EMOTIONS.map((e) => {
          const on = (open ?? todays) === e.key;
          return (
            <Pressable
              key={e.key}
              onPress={() => choose(e.key)}
              style={[st.chip, on && { borderColor: e.color, backgroundColor: 'rgba(255,255,255,0.06)' }]}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
            >
              <Text style={[st.chipText, { color: on ? e.color : colors.text }]}>
                {e.sign} {t(e.name)}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
          <AskSister emotion={shown.key} entries={entries} />
        </View>
      )}

      <View style={st.weekRow}>
        <Text style={st.weekLabel}>{t('Vos 7 derniers jours')}</Text>
        <View style={st.week} accessibilityLabel={t('Émotions des 7 derniers jours')}>
          {week.map((d) => {
            const e = emotionOf(d.key);
            const label = new Date(`${d.day}T12:00:00`).toLocaleDateString(locale(), { weekday: 'narrow' });
            return (
              <View key={d.day} style={st.dayCol}>
                <View style={[st.dayDot, e ? { backgroundColor: e.color, borderColor: e.color } : null]}>
                  {e ? <Text style={st.daySign}>{e.sign}</Text> : null}
                </View>
                <Text style={st.dayLetter}>{label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <Pressable onPress={() => openSister('/naia-gardienne-des-emotions/', 'Naïa')} accessibilityRole="link">
        <Text style={[st.link, { color: NAIA }]}>{t('Aller plus loin avec Naïa ›')}</Text>
      </Pressable>
    </View>
  );
}

// Schéma de la main (même dessin que sur la page de Terra) et ses quatre lignes.
const HAND =
  'M330 1400C300 1280 210 1180 190 1040C172 920 120 800 100 690C88 620 125 585 170 600C200 610 215 560 232 520C232 400 235 250 258 175C275 140 320 140 330 175C345 260 350 400 358 505C362 400 378 220 400 130C415 85 490 85 508 130C525 230 530 400 532 500C540 400 566 270 585 190C600 150 655 150 668 190C685 280 690 420 692 520C705 440 740 340 762 300C778 270 820 275 828 310C838 380 830 470 818 560C835 700 860 800 850 900C840 1050 740 1250 700 1400Z';
const LINES = [
  { name: 'Cœur', color: '#e8a3ae', d: 'M826 640 C720 600 600 590 500 610 C440 622 400 600 372 560' },
  { name: 'Tête', color: '#d6b66c', d: 'M236 650 C340 690 480 720 600 760 C680 786 740 820 790 860' },
  { name: 'Vie', color: '#69bd7d', d: 'M236 660 C300 760 330 860 320 980 C312 1080 330 1180 380 1290' },
  { name: 'Destin', color: '#8fc8e8', d: 'M560 1330 C556 1150 548 960 540 640' },
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
      style={[st.card, st.row, { borderColor: 'rgba(169,201,138,0.35)' }]}
      onPress={() => (doneToday ? router.push({ pathname: '/mes-lectures', params: { tab: 'main' } }) : openSister('/terra-gardienne-de-lancrage/', 'Terra'))}
      accessibilityRole="link"
      accessibilityLabel={doneToday ? t('Terra : revoir la lecture de ma main du jour') : t('Terra : lire les lignes de ma main')}
    >
      <Svg width={64} height={92} viewBox="60 60 860 1360" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Path d={HAND} fill="rgba(42,63,122,0.45)" stroke={colors.gold} strokeOpacity={0.7} strokeWidth={10} />
        {LINES.map((l) => (
          <Path key={l.name} d={l.d} stroke={l.color} strokeWidth={22} strokeLinecap="round" fill="none" />
        ))}
      </Svg>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[st.kicker, { color: TERRA }]}>{t('TERRA · VOTRE MAIN DU JOUR')}</Text>
        {doneToday ? (
          <>
            <Text style={st.title}>{t('Votre main a parlé aujourd’hui')}</Text>
            {last?.mantra ? <Text style={st.text} numberOfLines={2}>{last.mantra}</Text> : null}
            <Text style={[st.link, { color: TERRA }]}>{t('Revoir ma lecture ›')}</Text>
          </>
        ) : (
          <>
            <Text style={st.title}>{t('Lire les lignes de ma main')}</Text>
            <View style={st.legend}>
              {LINES.map((l) => (
                <Text key={l.name} style={[st.legendItem, { color: l.color }]}>
                  ● {t(l.name)}
                </Text>
              ))}
            </View>
            <Text style={st.text}>{t('Une lecture par jour : un geste, un mantra, une question.')}</Text>
          </>
        )}
        {FEATURES.palmDetailed ? (
          <Pressable onPress={() => router.push('/lecture-main')} accessibilityRole="link" hitSlop={6}>
            <Text style={[st.link, { color: TERRA }]}>{t('✦ Lecture détaillée sur photo ›')}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={st.chevron}>›</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
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
  weekRow: { gap: 6 },
  weekLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1.2, color: colors.muted },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4 },
  dayDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  daySign: { fontSize: 13, color: colors.night, fontWeight: '700' },
  dayLetter: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textTransform: 'uppercase' },
  link: { fontFamily: fonts.bodyBold, fontSize: 14 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { fontFamily: fonts.bodyMedium, fontSize: 12.5 },
  chevron: { color: colors.gold, fontSize: 24 },
  check: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  box: { fontSize: 18, color: NAIA, lineHeight: 20 },
  askBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: NAIA, alignSelf: 'flex-start' },
  askText: { fontFamily: fonts.bodyBold, fontSize: 14, color: NAIA },
});
