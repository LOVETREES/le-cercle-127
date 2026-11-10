// Deux Sœurs sur l'accueil : Naïa (réguler l'émotion du moment) et Terra (la main du jour).
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

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

      <Pressable onPress={() => openSister('/naia-gardienne-des-emotions/', 'Naïa')} accessibilityRole="link">
        <Text style={[st.link, { color: NAIA }]}>{t('Aller plus loin avec Naïa ›')}</Text>
      </Pressable>
    </View>
  );
}

// Une vraie main (photo de la démo de Terra) avec ses lignes détectées.
const HAND_PHOTO = require('../../assets/images/terra-main.webp');
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
      style={[st.card, st.row, { borderColor: 'rgba(169,201,138,0.35)' }]}
      onPress={() => (doneToday ? router.push({ pathname: '/mes-lectures', params: { tab: 'main' } }) : openSister('/terra-gardienne-de-lancrage/', 'Terra'))}
      accessibilityRole="link"
      accessibilityLabel={doneToday ? t('Terra : revoir la lecture de ma main du jour') : t('Terra : lire les lignes de ma main')}
    >
      <View style={st.handFrame} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Image source={HAND_PHOTO} style={st.handPhoto} resizeMode="cover" />
      </View>
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
  link: { fontFamily: fonts.bodyBold, fontSize: 14 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { fontFamily: fonts.bodyMedium, fontSize: 12.5 },
  handFrame: { width: 76, height: 92, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(214,182,108,0.55)' },
  handPhoto: { width: '100%', height: '100%' },
  chevron: { color: colors.gold, fontSize: 24 },
  check: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  box: { fontSize: 18, color: NAIA, lineHeight: 20 },
  askBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: NAIA, alignSelf: 'flex-start' },
  askText: { fontFamily: fonts.bodyBold, fontSize: 14, color: NAIA },
});
