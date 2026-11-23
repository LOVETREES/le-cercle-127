import { router, useFocusEffect } from 'expo-router';
import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CheminCard } from '../../components/Chemin';
import { NaiaCard, TerraCard } from '../../components/HomeSisters';
import { MoonPhase } from '../../components/MoonPhase';
import { RituelDuJour } from '../../components/RituelDuJour';
import { GoldButton, Notice, Screen, SiteFooter } from '../../components/ui';
import { OracleExpress } from '../../components/OracleExpress';
import { appendTranscript } from '../../lib/dictation';
import { draftKey } from '../../lib/local-draft';
import { palmOwnerFor } from '../../lib/palm';
import { useLocalDraft } from '../../lib/use-local-draft';
import { computeChemin, loadChemin, type Chemin } from '../../lib/chemin';
import { addPresence, allRecurringMotifs, dailyThought, greetingKey, journey } from '../../lib/insights';
import { useSession } from '../../lib/session';
import { KEYS, local } from '../../lib/storage';
import { colors, fonts, radius, space } from '../../lib/theme';
import { locale, quote, t } from '../../i18n';
import { moonAt } from '../../lib/moon';

const DREAMER_ICONS = {
  grimoire: require('../../../assets/images/dreamer-icons/grimoire.png'),
  motifs: require('../../../assets/images/dreamer-icons/motifs.png'),
  sisters: require('../../../assets/images/dreamer-icons/sept-soeurs.png'),
  journey: require('../../../assets/images/dreamer-icons/parcours.png'),
  hand: require('../../../assets/images/dreamer-icons/main.webp'),
  grounding: require('../../../assets/images/dreamer-icons/ancrage.webp'),
  symbols: require('../../../assets/images/dreamer-icons/symboles.webp'),
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale(), { day: 'numeric', month: 'long' });
}

// Accueil centré sur la personne : où elle en est, ce qui évolue, et l'essentiel en un geste.
export default function Home() {
  const { dreams, user, isDemo } = useSession();
  const opening = useLocalDraft(draftKey(palmOwnerFor(isDemo, user?.id), 'home'));
  const [openingBusy, setOpeningBusy] = useState(false);
  const [showOpening, setShowOpening] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [openingError, setOpeningError] = useState(false);
  const openingLock = useRef(false);
  const startDream = async () => {
    if (openingLock.current) return;
    openingLock.current = true;
    setOpeningBusy(true);
    setOpeningError(false);
    try {
      if (opening.text.trim()) {
        const key = isDemo ? KEYS.demoPendingTranscript : KEYS.pendingTranscript;
        const previous = await local.getJson<string>(key, '');
        await local.setJson(key, appendTranscript(previous, opening.text).slice(0, 20000));
        await opening.clear();
      }
      router.navigate('/reve');
    } catch {
      setOpeningError(true);
    } finally {
      openingLock.current = false;
      setOpeningBusy(false);
    }
  };
  const [presence, setPresence] = useState(1);
  const [ritualTick, setRitualTick] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const naiaY = useRef(0);
  // L'heure est relue à chaque retour sur l'accueil : l'onglet reste ouvert des heures.
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(useCallback(() => setNow(new Date()), []));
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') setNow(new Date()); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  const moon = useMemo(() => moonAt(now), [now]);
  const thought = useMemo(() => t(dailyThought(now)), [now]);
  const j = useMemo(() => journey(dreams, now), [dreams, now]);
  const last = useMemo(() => [...dreams].sort((a, b) => b.dreamDate.localeCompare(a.dreamDate))[0], [dreams]);
  const firstName = user?.name?.split(/\s+/)[0];
  // Mon chemin : recalculé à chaque retour sur l'accueil (un geste fait ailleurs fait grandir sa Sœur).
  const recurringAll = useMemo(() => allRecurringMotifs(dreams), [dreams]);
  const [chemin, setChemin] = useState<Chemin>(() => computeChemin({ dreams: [], motifs: 0, motifDreams: [], emotions: [], palms: [], gestes: [], bilans: [], draws: [] }));
  useFocusEffect(useCallback(() => {
    let active = true;
    loadChemin(dreams, recurringAll).then((c) => { if (active) setChemin(c); }, () => undefined);
    return () => { active = false; };
  }, [dreams, recurringAll, ritualTick]));
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
    <Screen scrollRef={scrollRef}>
      {/* Salut personnel */}
      <View style={st.welcome}>
        <Text style={st.date}>{now.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}</Text>
        <Text style={st.hello}>
          {t(greetingKey(now))}
          {firstName ? `, ${firstName}` : ''}
        </Text>
        <Text style={st.progress}>{progress}</Text>
      </View>

      {/* Une scène onirique distincte de la phase lunaire calculée plus bas. */}
      <View style={st.hero}>
        <ImageBackground source={require('../../../assets/images/home-moon.webp')} style={st.heroImage} imageStyle={st.heroImageFill} resizeMode="cover">
          <View style={st.heroCaption}>
            <Text style={st.heroEyebrow}>{t('Rêver · Comprendre · Avancer').toUpperCase()}</Text>
            <Text style={st.heroText} accessibilityRole="header">{t('Comprendre vos rêves, à votre rythme.')}</Text>
          </View>
        </ImageBackground>
      </View>

      <View style={st.dreamEntry}>
        <Text style={st.kicker}>{t('LE RÊVE, PREMIÈRE PORTE')}</Text>
        <GoldButton label={t('Raconter un rêve  ›')} disabled={!opening.ready} loading={openingBusy} onPress={() => void startDream()} />
        <Pressable onPress={() => setShowOpening((visible) => !visible)} accessibilityRole="button" accessibilityState={{ expanded: showOpening }} aria-expanded={showOpening} style={st.draftToggle}>
          <Text style={st.draftToggleText}>{opening.text.trim() ? t('Brouillon en cours · écrire ici') : t('Écrire quelques mots ici')}</Text>
          <Text style={st.draftToggleText}>{showOpening ? '⌃' : '⌄'}</Text>
        </Pressable>
        {showOpening && <TextInput accessibilityLabel={t('Premières lignes de mon rêve')} value={opening.text} onChangeText={opening.set} editable={opening.ready && !openingBusy} placeholder={t('Quelques mots de mon rêve…')} placeholderTextColor={colors.muted} multiline maxLength={20000} style={st.dreamInput} />}
        <Pressable style={st.nightButton} onPress={() => router.push('/nuit-noire')} accessibilityRole="link" accessibilityLabel={t('Nuit noire · Après un cauchemar')}>
          <MaterialCommunityIcons name="weather-night" size={15} color={colors.muted} />
          <Text style={st.nightButtonText}>{t('Nuit noire · Après un cauchemar')} ›</Text>
        </Pressable>
        {opening.error && <Notice tone="error" text={t('Le brouillon n’a pas pu être enregistré sur cet appareil.')} />}
        {openingError && <Notice tone="error" text={t('Impossible de préparer votre rêve. Réessayez.')} />}
      </View>

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

      {/* Chaque Sœur ouvre une partie du chemin, après le rêve avec Oni. */}
      <CheminCard chemin={chemin} />

      {/* Rituel du jour : carte, émotion, main */}
      <RituelDuJour refreshKey={ritualTick} onEmotion={() => scrollRef.current?.scrollTo({ y: Math.max(0, naiaY.current - 12), animated: true })} />

      <OracleExpress onDraw={() => setRitualTick((n) => n + 1)} />

      {/* Naïa : l'émotion du moment ; Terra : la main du jour */}
      <View onLayout={(e) => { naiaY.current = e.nativeEvent.layout.y; }}>
        <NaiaCard onRecorded={() => setRitualTick((n) => n + 1)} />
      </View>
      <TerraCard />

      {/* Pensée du jour */}
      <View style={st.thought} accessibilityLabel={t('Pensée du jour : {v0}', { v0: thought })}>
        <Text style={st.kicker}>{t('✦ PENSÉE DU JOUR')}</Text>
        <Text style={st.thoughtText}>{quote(thought)}</Text>
      </View>

      {/* Le reste de l'accueil, replié : comme sur le site (« Découvrir le Cercle »). */}
      <Pressable onPress={() => setShowMore((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: showMore }} aria-expanded={showMore} style={st.moreToggle}>
        <Text style={st.moreToggleText}>{showMore ? t('Replier') : t('Découvrir le Cercle')} {showMore ? '▴' : '▾'}</Text>
      </Pressable>
      {showMore && (
        <>
      <Pressable onPress={() => router.push('/parcours')} accessibilityRole="link" accessibilityLabel={t('Mon parcours onirique : ce qui se dessine')} style={st.journeyBanner}>
        <ImageBackground source={require('../../../assets/images/home-parcours-forest.webp')} style={st.journeyBannerImage} imageStyle={st.journeyBannerFill} resizeMode="cover">
          <Image source={DREAMER_ICONS.sisters} style={st.journeyBannerIcon} resizeMode="contain" accessible={false} />
          <View style={st.journeyBannerText}>
            <Text style={st.journeyBannerKicker}>{t('Mon parcours onirique').toUpperCase()}</Text>
            <Text style={st.journeyBannerTitle}>{t('Ce qui se dessine…')}</Text>
            <Text style={st.journeyBannerSub}>{t('Évolutions · Récurrences · Transformations')}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right-circle-outline" size={29} color={colors.gold} />
        </ImageBackground>
      </Pressable>

      {/* La phase est calculée pour l'instant présent, sans localisation. */}
      <Pressable style={st.moonBanner} onPress={() => router.navigate({ pathname: '/symboles', params: { recherche: 'lune' } })} accessibilityRole="link" accessibilityLabel={t('La Lune : {phase}, {percent} % éclairée. Découvrir le symbole.', { phase: t(moon.label), percent: moon.illuminated })}>
        <View style={st.moonBannerContent}>
          <MoonPhase fraction={moon.fraction} waxing={moon.waxing} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={st.kicker}>{t('LA LUNE AUJOURD’HUI')}</Text>
            <Text style={st.cardTitle}>{t(moon.label)}</Text>
            <Text style={st.moonPhase}>{t('{n} % éclairée', { n: moon.illuminated })}</Text>
            <Text style={st.moonHint}>{t('Un repère pour observer vos nuits, sans prédiction.')}</Text>
          </View>
          <Text style={st.chevron}>›</Text>
        </View>
      </Pressable>

      {/* Mesures */}
      <Text style={st.sectionHeading} accessibilityRole="header">{t('Mon parcours onirique')}</Text>
      <View style={st.stats}>
        {[
          { icon: 'weather-night-partly-cloudy' as const, value: j.total, label: 'Rêves dans\nmon Grimoire', go: () => router.navigate('/grimoire') },
          { icon: 'vector-square' as const, value: j.recurringCount, label: 'Motifs\nrécurrents', go: () => router.push('/parcours') },
          { icon: 'fire' as const, value: presence, label: 'Jours\nde présence', go: () => router.push('/parcours') },
        ].map((x) => (
          <Pressable key={x.label} style={st.stat} onPress={x.go} accessibilityRole="button" accessibilityLabel={`${x.value} ${t(x.label).replace('\n', ' ')}`}>
            <View style={st.statTop}>
              <MaterialCommunityIcons name={x.icon} size={23} color={colors.gold} />
              <Text style={st.statValue}>{x.value}</Text>
            </View>
            <Text style={st.statLabel}>{t(x.label)}</Text>
          </Pressable>
        ))}
      </View>

      {/* Quatre accès aux espaces existants, comme dans la référence. */}
      <View style={st.tiles}>
        {[
          { label: 'Mon Grimoire', sub: 'Mes rêves conservés et relus', icon: DREAMER_ICONS.grimoire, go: () => router.navigate('/grimoire') },
          { label: 'Mes motifs', sub: 'Ce qui revient dans mes rêves', icon: DREAMER_ICONS.motifs, go: () => router.navigate({ pathname: '/grimoire', params: { section: 'recurrences' } }) },
          { label: 'Les Sept Sœurs', sub: 'Des regards complémentaires', icon: DREAMER_ICONS.sisters, go: () => router.push('/soeurs') },
          { label: 'Mon parcours', sub: 'Évolutions et prochaines étapes', icon: DREAMER_ICONS.journey, go: () => router.push('/parcours') },
        ].map((tile) => (
          <Pressable key={tile.label} style={st.tile} onPress={tile.go} accessibilityRole="link" accessibilityLabel={t(tile.label)}>
            <View style={st.tileIcon}><Image source={tile.icon} style={st.dreamerIcon} resizeMode="contain" accessible={false} /></View>
            <View style={st.tileFoot}>
              <Text style={st.tileLabel}>{t(tile.label)}</Text>
              <Text style={st.tileSub}>{t(tile.sub)}</Text>
            </View>
            <Text style={st.tileArrow}>›</Text>
          </Pressable>
        ))}
      </View>

      <Text style={st.exploreHeading} accessibilityRole="header">{t('Explorer autrement')}</Text>
      <View style={st.exploreTiles}>
        {[
          { label: 'Lecture de la main', icon: DREAMER_ICONS.hand, go: () => router.push('/lecture-main') },
          { label: 'Rituels & ancrage', icon: DREAMER_ICONS.grounding, go: () => router.push({ pathname: '/page', params: { path: '/terra-gardienne-de-lancrage/', title: 'Terra' } }) },
          { label: 'Dictionnaire des symboles', icon: DREAMER_ICONS.symbols, go: () => router.navigate('/symboles') },
        ].map((item) => <Pressable key={item.label} style={st.exploreTile} onPress={item.go} accessibilityRole="link" accessibilityLabel={t(item.label)}>
          <Image source={item.icon} style={st.exploreIcon} resizeMode="contain" accessible={false} />
          <Text style={st.exploreTileText}>{t(item.label)}</Text>
        </Pressable>)}
      </View>

      {/* Mes lectures : rêve et main */}
      <Pressable style={st.card} onPress={() => router.push('/mes-lectures')} accessibilityRole="link" accessibilityLabel={t('Mes lectures : mes rêves et ma main')}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={st.kickerMuted}>{t('ONI ET TERRA')}</Text>
          <Text style={st.cardTitle}>{t('Mes lectures')}</Text>
          <Text style={st.cardSub}>{t('Mes rêves avec Oni · Ma main avec Terra')}</Text>
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

        </>
      )}

      <SiteFooter />
    </Screen>
  );
}

const card = { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: colors.surface } as const;

const st = StyleSheet.create({
  welcome: { gap: 3 },
  hero: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  heroImage: { height: 190, justifyContent: 'flex-end', alignItems: 'flex-start', padding: 14 },
  heroImageFill: { width: '100%', height: '100%' },
  heroCaption: { maxWidth: '100%', backgroundColor: 'rgba(8, 11, 23, 0.82)', borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, gap: 3 },
  heroEyebrow: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.2 },
  heroText: { color: colors.text, fontFamily: fonts.title, fontSize: 23, lineHeight: 27 },
  dreamEntry: { gap: 8 },
  moreToggle: { alignSelf: 'center', minHeight: 48, paddingHorizontal: 22, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: colors.gold },
  moreToggleText: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 15 },
  homeGrimoire: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 76, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  homeGrimoireIcon: { width: 48, height: 48 },
  nightButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 44 },
  nightButtonText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted },
  dreamInput: { minHeight: 48, maxHeight: 92, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, fontFamily: fonts.body, fontSize: 15, paddingHorizontal: 14, paddingVertical: 11, textAlignVertical: 'top' },
  draftToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 36 },
  draftToggleText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gold },
  date: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2, color: colors.muted },
  hello: { fontFamily: fonts.title, fontSize: 34, color: colors.text },
  progress: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.gold },
  thought: { padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(216,182,107,0.06)', gap: 6 },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 2, color: colors.gold },
  kickerMuted: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1.8, color: colors.muted },
  thoughtText: { fontFamily: fonts.titleItalic, fontSize: 19, lineHeight: 26, color: colors.text },
  sectionHeading: { fontFamily: fonts.title, fontSize: 25, lineHeight: 30, color: colors.text, marginBottom: -12 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, gap: 7, padding: 10, minHeight: 76, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: '#0c121e' },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moonPhase: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.text },
  statValue: { fontFamily: fonts.title, fontSize: 27, lineHeight: 31, color: '#e5d4b2' },
  statLabel: { fontFamily: fonts.body, fontSize: 11, lineHeight: 16, color: colors.muted },
  journeyBanner: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.surface },
  journeyBannerImage: { minHeight: 108, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  journeyBannerFill: { width: '100%', height: '100%', opacity: 0.28 },
  journeyBannerIcon: { width: 54, height: 54 },
  journeyBannerText: { flex: 1, alignItems: 'flex-start', gap: 2 },
  journeyBannerKicker: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.3, color: colors.gold },
  journeyBannerTitle: { fontFamily: fonts.title, fontSize: 23, lineHeight: 27, color: colors.text },
  journeyBannerSub: { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: colors.text },
  card,
  cardTitle: { fontFamily: fonts.title, fontSize: 22, color: colors.text },
  cardSub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.muted },
  chevron: { color: colors.gold, fontSize: 24 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: { flexBasis: '48%', flexGrow: 1, minHeight: 100, flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(216,182,107,0.22)', backgroundColor: colors.surface },
  tileIcon: { width: 52, minHeight: 100, alignItems: 'center', justifyContent: 'center' },
  dreamerIcon: { width: 52, height: 52 },
  tileFoot: { flex: 1, padding: 6, gap: 2 },
  tileLabel: { fontFamily: fonts.title, fontSize: 16, color: colors.text },
  tileSub: { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: colors.muted },
  tileArrow: { color: colors.gold, fontSize: 18, paddingRight: 5 },
  moonBanner: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  moonBannerContent: { minHeight: 108, padding: space.md, flexDirection: 'row', alignItems: 'center', gap: 14 },
  moonHint: { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: colors.muted },
  exploreHeading: { textAlign: 'center', color: colors.gold, fontFamily: fonts.title, fontSize: 23 },
  exploreTiles: { flexDirection: 'row', gap: space.sm },
  exploreTile: { flex: 1, minHeight: 92, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center', padding: 8, gap: 6 },
  exploreIcon: { width: 48, height: 48 },
  exploreTileText: { color: colors.text, fontFamily: fonts.title, fontSize: 15, textAlign: 'center' },
});
