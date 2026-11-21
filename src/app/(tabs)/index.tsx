import { router, useFocusEffect } from 'expo-router';
import { type ComponentProps, type ComponentRef, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type LayoutChangeEvent, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CheminCard } from '../../components/Chemin';
import { NaiaCard, TerraCard } from '../../components/HomeSisters';
import { MoonPhase } from '../../components/MoonPhase';
import { RituelDuJour } from '../../components/RituelDuJour';
import { GoldButton, LinkRow, Notice, Screen, SiteFooter } from '../../components/ui';
import { OracleExpress } from '../../components/OracleExpress';
import { GRAND_LABYRINTHE } from '../../lib/content';
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
  sisters: require('../../../assets/images/dreamer-icons/sept-soeurs.png'),
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
  const [showDaily, setShowDaily] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [ritualTick, setRitualTick] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const dailyY = useRef(0);
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
    local.getJson<string[]>(KEYS.presenceDays, []).then((days) => {
      const next = addPresence(days);
      if (next.length !== days.length) local.setJson(KEYS.presenceDays, next).catch(() => undefined);
    }, () => undefined);
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
      </View>

      <View style={st.hero}>
        <ImageBackground source={require('../../../assets/images/home-moon.webp')} style={st.heroImage} imageStyle={st.heroImageFill} resizeMode="cover">
          <Text style={st.heroText} accessibilityRole="header">{t('Comprendre vos rêves, à votre rythme.')}</Text>
        </ImageBackground>
        <View style={st.dreamEntry}>
          <GoldButton label={t('Raconter un rêve')} disabled={!opening.ready} loading={openingBusy} onPress={() => void startDream()} />
          <Pressable onPress={() => setShowOpening((visible) => !visible)} accessibilityRole="button" accessibilityState={{ expanded: showOpening }} aria-expanded={showOpening} style={st.draftToggle}>
            <Text style={st.draftToggleText}>{opening.text.trim() ? t('Brouillon en cours · écrire ici') : t('Écrire quelques mots ici')}</Text>
            <Text style={st.draftToggleText}>{showOpening ? '⌃' : '⌄'}</Text>
          </Pressable>
          {showOpening && <TextInput accessibilityLabel={t('Premières lignes de mon rêve')} value={opening.text} onChangeText={opening.set} editable={opening.ready && !openingBusy} placeholder={t('Quelques mots de mon rêve…')} placeholderTextColor={colors.muted} multiline maxLength={20000} style={st.dreamInput} />}
          <Pressable style={st.nightButton} onPress={() => router.push('/nuit-noire')} accessibilityRole="link" accessibilityLabel={t('Nuit noire · Après un cauchemar')}>
            <MaterialCommunityIcons name="weather-night" size={15} color={colors.muted} />
            <Text style={st.nightButtonText}>{t('Nuit noire · Après un cauchemar')}</Text>
          </Pressable>
          {opening.error && <Notice tone="error" text={t('Le brouillon n’a pas pu être enregistré sur cet appareil.')} />}
          {openingError && <Notice tone="error" text={t('Impossible de préparer votre rêve. Réessayez.')} />}
        </View>
      </View>

      <Pressable style={st.homeGrimoire} onPress={() => router.navigate('/grimoire')} accessibilityRole="link" accessibilityLabel={t('Mon Grimoire')}>
        <Image source={DREAMER_ICONS.grimoire} style={st.homeGrimoireIcon} resizeMode="contain" accessible={false} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={st.cardTitle}>{t('Mon Grimoire')}</Text>
          <Text style={st.cardSub}>{t('Mes rêves conservés et reliés')}</Text>
        </View>
        <Text style={st.chevron}>›</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/parcours')} accessibilityRole="link" accessibilityLabel={t('Mon parcours onirique')} accessibilityHint={progress} style={st.journeyBanner}>
        <ImageBackground source={require('../../../assets/images/home-parcours-forest.webp')} style={st.journeyBannerImage} imageStyle={st.journeyBannerFill} resizeMode="cover">
          <Image source={DREAMER_ICONS.sisters} style={st.journeyBannerIcon} resizeMode="contain" accessible={false} />
          <View style={st.journeyBannerText}>
            <Text style={st.journeyBannerKicker}>{t('Mon parcours onirique').toUpperCase()}</Text>
            <Text style={st.journeyBannerTitle}>{progress}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right-circle-outline" size={29} color={colors.gold} />
        </ImageBackground>
      </Pressable>

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

      {/* Mes lectures : rêve et main */}
      <Pressable style={st.card} onPress={() => router.push('/mes-lectures')} accessibilityRole="link" accessibilityLabel={t('Mes lectures : mes rêves et ma main')}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={st.kickerMuted}>{t('ONI ET TERRA')}</Text>
          <Text style={st.cardTitle}>{t('Mes lectures')}</Text>
          <Text style={st.cardSub}>{t('Mes rêves avec Oni · Ma main avec Terra')}</Text>
        </View>
        <Text style={st.chevron}>›</Text>
      </Pressable>

      <HomeSection title={t('Aujourd’hui')} onContentLayout={(event) => { dailyY.current = event.nativeEvent.layout.y; }} icon="moon-waning-crescent" expanded={showDaily} onPress={() => setShowDaily((value) => !value)}>
        <NaiaCard onRecorded={() => setRitualTick((n) => n + 1)} />
        <TerraCard />

        {/* Pensée du jour */}
        <View style={st.thought} accessibilityLabel={t('Pensée du jour : {v0}', { v0: thought })}>
          <Text style={st.kicker}>{t('✦ PENSÉE DU JOUR')}</Text>
          <Text style={st.thoughtText}>{quote(thought)}</Text>
        </View>

        <OracleExpress onDraw={() => setRitualTick((n) => n + 1)} />

        {/* Rituel du jour : carte, émotion, main */}
        <RituelDuJour refreshKey={ritualTick} onEmotion={() => scrollRef.current?.scrollTo({ y: Math.max(0, dailyY.current - 12), animated: true })} />

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
      </HomeSection>

      <HomeSection title={t('Explorer autrement')} icon="compass-outline" expanded={showExplore} onPress={() => setShowExplore((value) => !value)}>
        {/* Chaque Sœur ouvre une partie du chemin, après le rêve avec Oni. */}
        <CheminCard chemin={chemin} />

        <Pressable style={st.card} onPress={() => router.push('/soeurs')} accessibilityRole="link">
          <Image source={DREAMER_ICONS.sisters} style={st.homeGrimoireIcon} resizeMode="contain" accessible={false} />
          <Text style={st.cardTitle}>{t('Les Sept Sœurs')}</Text>
        </Pressable>
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

        <LinkRow
          icon={GRAND_LABYRINTHE.icon}
          title={t(GRAND_LABYRINTHE.title)}
          subtitle={t(GRAND_LABYRINTHE.subtitle)}
          onPress={() => router.push({ pathname: '/page', params: { path: GRAND_LABYRINTHE.path, title: t(GRAND_LABYRINTHE.title) } })}
        />

        {/* Le reste, rangé sur une page dédiée */}
        <Pressable style={st.card} onPress={() => router.push('/explorer')} accessibilityRole="link" accessibilityLabel={t('Apprendre et explorer')}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={st.cardTitle}>{t('Apprendre et explorer')}</Text>
            <Text style={st.cardSub}>{t('Rêve lucide · Laboratoire · Carnet vocal · Labyrinthe · 127 portes')}</Text>
          </View>
          <Text style={st.chevron}>›</Text>
        </Pressable>
      </HomeSection>

      <SiteFooter />
    </Screen>
  );
}

function HomeSection({ title, icon, expanded, onPress, onContentLayout, children }: {
  title: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  expanded: boolean;
  onPress: () => void;
  onContentLayout?: (event: LayoutChangeEvent) => void;
  children: ReactNode;
}) {
  const [opened, setOpened] = useState(false);
  const toggle = () => {
    setOpened(true);
    onPress();
  };

  return (
    <>
      <Pressable style={st.card} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded }} aria-expanded={expanded} onPress={toggle}>
        <MaterialCommunityIcons name={icon} size={23} color={colors.gold} />
        <Text style={[st.cardTitle, st.sectionTitle]}>{title}</Text>
        <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={22} color={colors.gold} />
      </Pressable>
      {(expanded || opened) && (
        <View onLayout={onContentLayout} style={expanded ? st.sectionContent : st.sectionHidden}>
          {children}
        </View>
      )}
    </>
  );
}

const card = { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: colors.surface } as const;

const st = StyleSheet.create({
  welcome: { gap: 3 },
  hero: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  heroImage: { minHeight: 146, justifyContent: 'flex-end', alignItems: 'flex-start', padding: 16 },
  heroImageFill: { width: '100%', height: '100%', opacity: 0.54 },
  heroText: { color: colors.text, fontFamily: fonts.title, fontSize: 29, lineHeight: 33, maxWidth: 320 },
  dreamEntry: { gap: 2, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 2 },
  homeGrimoire: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 76, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  homeGrimoireIcon: { width: 48, height: 48 },
  nightButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 44 },
  nightButtonText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted },
  dreamInput: { minHeight: 48, maxHeight: 92, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, fontFamily: fonts.body, fontSize: 15, paddingHorizontal: 14, paddingVertical: 11, textAlignVertical: 'top' },
  draftToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44 },
  draftToggleText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gold },
  date: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2, color: colors.muted },
  hello: { fontFamily: fonts.title, fontSize: 34, color: colors.text },
  thought: { padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(216,182,107,0.06)', gap: 6 },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 2, color: colors.gold },
  kickerMuted: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1.8, color: colors.muted },
  thoughtText: { fontFamily: fonts.titleItalic, fontSize: 19, lineHeight: 26, color: colors.text },
  moonPhase: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.text },
  journeyBanner: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.surface },
  journeyBannerImage: { minHeight: 108, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  journeyBannerFill: { width: '100%', height: '100%', opacity: 0.28 },
  journeyBannerIcon: { width: 54, height: 54 },
  journeyBannerText: { flex: 1, alignItems: 'flex-start', gap: 2 },
  journeyBannerKicker: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.3, color: colors.gold },
  journeyBannerTitle: { fontFamily: fonts.title, fontSize: 23, lineHeight: 27, color: colors.text },
  card,
  sectionTitle: { flex: 1 },
  sectionContent: { gap: space.md },
  sectionHidden: { display: 'none' },
  cardTitle: { fontFamily: fonts.title, fontSize: 22, color: colors.text },
  cardSub: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.muted },
  chevron: { color: colors.gold, fontSize: 24 },
  moonBanner: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  moonBannerContent: { minHeight: 108, padding: space.md, flexDirection: 'row', alignItems: 'center', gap: 14 },
  moonHint: { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: colors.muted },
  exploreTiles: { flexDirection: 'row', gap: space.sm },
  exploreTile: { flex: 1, minHeight: 92, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center', padding: 8, gap: 6 },
  exploreIcon: { width: 48, height: 48 },
  exploreTileText: { color: colors.text, fontFamily: fonts.title, fontSize: 15, textAlign: 'center' },
});
