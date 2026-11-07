import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { GoldButton, Screen, SiteFooter } from '../../components/ui';
import { IMAGES, SISTERS } from '../../lib/content';
import { addPresence, dailyThought, journey } from '../../lib/insights';
import { useSession } from '../../lib/session';
import { KEYS, local } from '../../lib/storage';
import { colors, fonts, radius, space } from '../../lib/theme';
import { locale, quote, t } from '../../i18n';

// Couleurs des Sœurs, reprises du site (--sister-accent).
const SISTER_COLORS = ['#d9cdfb', '#a9c2f7', '#8fdad3', '#a9c98a', '#eb9a68', '#f2dea8', '#f3f1fb'];

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 5 || h >= 21) return t('Bonne nuit');
  if (h < 12) return t('Bonjour');
  if (h < 18) return t('Bon après-midi');
  return t('Bonsoir');
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale(), { day: 'numeric', month: 'long' });
}

// Accueil centré sur la personne : où elle en est, ce qui évolue, et l'essentiel en un geste.
export default function Home() {
  const { dreams, user } = useSession();
  const [presence, setPresence] = useState(1);
  const now = useMemo(() => new Date(), []);
  const thought = useMemo(() => t(dailyThought(now)), [now]);
  const j = useMemo(() => journey(dreams, now), [dreams, now]);
  const last = useMemo(() => [...dreams].sort((a, b) => b.dreamDate.localeCompare(a.dreamDate))[0], [dreams]);
  const firstName = user?.name?.split(/\s+/)[0];
  const thisMonth = j.months[5]?.count ?? 0;
  const lastMonth = j.months[4]?.count ?? 0;

  useEffect(() => {
    let active = true;
    local.getJson<string[]>(KEYS.presenceDays, []).then((days) => {
      const next = addPresence(days);
      if (active) setPresence(next.length);
      if (next.length !== days.length) local.setJson(KEYS.presenceDays, next).catch(() => undefined);
    }, () => undefined);
    return () => {
      active = false;
    };
  }, []);

  // Une phrase d'évolution simple et encourageante.
  const progress =
    j.total === 0
      ? t('Votre premier rêve ouvrira votre parcours.')
      : j.currentStreak >= 2
        ? t('{n} jours d’affilée : votre mémoire des rêves se muscle.', { n: j.currentStreak })
        : thisMonth > lastMonth
          ? t(thisMonth > 1 ? '{n} rêves ce mois-ci, plus que le mois dernier.' : '{n} rêve ce mois-ci, plus que le mois dernier.', { n: thisMonth })
          : j.recurring[0]
            ? t('« {s} » revient {n} fois dans vos nuits.', { s: j.recurring[0][0], n: j.recurring[0][1] })
            : t(j.total > 1 ? '{n} rêves gardés dans votre Grimoire.' : '{n} rêve gardé dans votre Grimoire.', { n: j.total });

  return (
    <Screen>
      {/* Salut personnel */}
      <View style={{ gap: 4 }}>
        <Text style={st.date}>{now.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}</Text>
        <Text style={st.hello}>
          {greeting(now)}
          {firstName ? `, ${firstName}` : ''}
        </Text>
        <Text style={st.progress}>{progress}</Text>
      </View>

      {/* Pensée du jour */}
      <View style={st.thought} accessibilityLabel={t('Pensée du jour : {v0}', { v0: thought })}>
        <Text style={st.kicker}>{t('✦ PENSÉE DU JOUR')}</Text>
        <Text style={st.thoughtText}>{quote(thought)}</Text>
      </View>

      {/* Mesures */}
      <View style={st.stats}>
        {[
          { icon: '📖', value: j.total, label: 'Rêves dans\nmon Grimoire', go: () => router.navigate('/grimoire') },
          { icon: '∞', value: j.recurring.length, label: 'Motifs\nrécurrents', go: () => router.push('/parcours') },
          { icon: '☾', value: presence, label: 'Jours\nde présence', go: () => router.push('/parcours') },
        ].map((x) => (
          <Pressable key={x.label} style={st.stat} onPress={x.go} accessibilityRole="button" accessibilityLabel={`${x.value} ${t(x.label).replace('\n', ' ')}`}>
            <View style={st.statTop}>
              <Text style={st.statIcon}>{x.icon}</Text>
              <Text style={st.statValue}>{x.value}</Text>
            </View>
            <Text style={st.statLabel}>{t(x.label)}</Text>
          </Pressable>
        ))}
      </View>

      {/* Mon parcours onirique, avec un mini-graphique des 6 derniers mois */}
      <Pressable style={st.card} onPress={() => router.push('/parcours')} accessibilityRole="link" accessibilityLabel={t('Mon parcours onirique : ce qui se dessine')}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={st.kickerMuted}>{t('MON PARCOURS ONIRIQUE')}</Text>
          <Text style={st.cardTitle}>{t('Ce qui se dessine…')}</Text>
          <Text style={st.cardSub}>{t('Évolutions · Récurrences · Transformations')}</Text>
        </View>
        <View style={st.spark} accessibilityElementsHidden>
          {j.months.map((m) => (
            <View key={m.key} style={[st.sparkBar, { height: 6 + (m.count / Math.max(1, ...j.months.map((x) => x.count))) * 38 }]} />
          ))}
        </View>
        <Text style={st.chevron}>›</Text>
      </Pressable>

      {/* Mes lectures : rêve et main */}
      <Pressable style={st.card} onPress={() => router.push('/mes-lectures')} accessibilityRole="link" accessibilityLabel={t('Mes lectures : mes rêves et ma main')}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={st.kickerMuted}>{t('MA PROMESSE D’INDIVIDUATION')}</Text>
          <Text style={st.cardTitle}>{t('Mes lectures')}</Text>
          <Text style={st.cardSub}>{t('Mes rêves avec Oni · Ma main avec Terra')}</Text>
        </View>
        <Text style={st.chevron}>›</Text>
      </Pressable>

      {/* Action principale */}
      <GoldButton label={t('Raconter un rêve  ›')} onPress={() => router.navigate('/reve')} />

      {/* Dernier rêve */}
      {last && (
        <Pressable style={st.card} onPress={() => router.push({ pathname: '/reve/[id]', params: { id: last.id } })} accessibilityRole="link" accessibilityLabel={t('Dernier rêve : {v0}', { v0: last.title })}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={st.kickerMuted}>{t('DERNIER RÊVE ·')} {formatDate(last.dreamDate).toUpperCase()}</Text>
            <Text style={st.cardTitle} numberOfLines={1}>
              {last.title}
            </Text>
            <Text style={st.cardSub} numberOfLines={1}>
              {last.oniReading ? t('Lecture d’Oni disponible') : t('Relire et voir ce qui revient')}
            </Text>
          </View>
          <Text style={st.chevron}>›</Text>
        </Pressable>
      )}

      {/* Trois raccourcis */}
      <View style={st.tiles}>
        {[
          { label: 'Mon Grimoire', sub: 'Mes rêves conservés et reliés', img: IMAGES.grimoire, go: () => router.navigate('/grimoire') },
          { label: 'Oracle 127', sub: 'Une carte, un éclairage', img: IMAGES.oracle, go: () => router.navigate('/oracle') },
          { label: 'Symboles', sub: 'Le dictionnaire des rêves', img: IMAGES.symboles, go: () => router.navigate('/symboles') },
        ].map((tile) => (
          <Pressable key={tile.label} style={st.tile} onPress={tile.go} accessibilityRole="link" accessibilityLabel={t(tile.label)}>
            <Image source={tile.img} style={st.tileImg} resizeMode="cover" />
            <View style={st.tileFoot}>
              <Text style={st.tileLabel}>{t(tile.label)}</Text>
              <Text style={st.tileSub}>{t(tile.sub)}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Les Sept Sœurs */}
      <Pressable style={st.card} onPress={() => router.push('/soeurs')} accessibilityRole="link" accessibilityLabel={t('Les Sept Sœurs : sept regards pour éclairer ton chemin')}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={st.sistersTitle}>{t('Les Sept Sœurs')}</Text>
          <Text style={st.cardSub}>{t('Sept regards pour éclairer ton chemin.')}</Text>
          <View style={st.dots}>
            {SISTERS.map((sis, i) => (
              <View key={sis.slug} style={st.dotItem}>
                <View style={[st.dot, { backgroundColor: SISTER_COLORS[i] }]} />
                <Text style={[st.dotName, { color: SISTER_COLORS[i] }]}>{sis.name}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={st.chevron}>›</Text>
      </Pressable>

      {/* Le reste, rangé sur une page dédiée */}
      <Pressable style={st.card} onPress={() => router.push('/explorer')} accessibilityRole="link" accessibilityLabel={t('Apprendre et explorer')}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={st.cardTitle}>{t('Apprendre et explorer')}</Text>
          <Text style={st.cardSub}>{t('Rêve lucide · Laboratoire · Carnet vocal · Labyrinthe · 127 portes')}</Text>
        </View>
        <Text style={st.chevron}>›</Text>
      </Pressable>

      <SiteFooter />
    </Screen>
  );
}

const card = { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: colors.surface } as const;

const st = StyleSheet.create({
  date: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2, color: colors.muted },
  hello: { fontFamily: fonts.title, fontSize: 34, color: colors.text },
  progress: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.gold },
  thought: { padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(216,182,107,0.06)', gap: 6 },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 2, color: colors.gold },
  kickerMuted: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1.8, color: colors.muted },
  thoughtText: { fontFamily: fonts.titleItalic, fontSize: 19, lineHeight: 26, color: colors.text },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, gap: 4, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: colors.surface },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statIcon: { fontSize: 20, color: colors.gold },
  statValue: { fontFamily: fonts.title, fontSize: 26, lineHeight: 30, color: colors.gold },
  statLabel: { fontFamily: fonts.body, fontSize: 11, lineHeight: 14, color: colors.text },
  card,
  cardTitle: { fontFamily: fonts.title, fontSize: 22, color: colors.text },
  cardSub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.muted },
  chevron: { color: colors.gold, fontSize: 24 },
  spark: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 46 },
  sparkBar: { width: 6, borderRadius: 3, backgroundColor: colors.gold },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: colors.surface },
  tileImg: { width: '100%', height: 88 },
  tileFoot: { padding: 10, gap: 2 },
  tileLabel: { fontFamily: fonts.title, fontSize: 15, color: colors.text },
  tileSub: { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: colors.muted },
  sistersTitle: { fontFamily: fonts.title, fontSize: 26, color: colors.text },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  dotItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dotName: { fontFamily: fonts.bodyMedium, fontSize: 12 },
});
