import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Eyebrow, GoldButton, LinkRow, Screen, SiteFooter, Title } from '../../components/ui';
import { EXPLORE, IMAGES, LEARN, SISTERS } from '../../lib/content';
import { addPresence, dailyThought, recurringMotifs } from '../../lib/insights';
import { useSession } from '../../lib/session';
import { KEYS, local } from '../../lib/storage';
import { colors, fonts, radius, space } from '../../lib/theme';

// Couleurs des Sœurs, reprises du site (--sister-accent).
const SISTER_COLORS = ['#d9cdfb', '#a9c2f7', '#8fdad3', '#a9c98a', '#eb9a68', '#f2dea8', '#f3f1fb'];

const openPage = (path: string, title: string) => router.push({ pathname: '/page', params: { path, title } });

export default function Home() {
  const { dreams } = useSession();
  const [presence, setPresence] = useState(1);
  const motifs = useMemo(() => recurringMotifs(dreams, 99).length, [dreams]);
  const thought = useMemo(() => dailyThought(), []);

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

  return (
    <Screen>
      {/* Bandeau « Le Cercle 127 · Rêver · Comprendre · Avancer » */}
      <View style={st.kicker}>
        <Text style={st.moon}>☾</Text>
        <View>
          <Text style={st.kickerText}>LE CERCLE 127</Text>
          <Text style={st.kickerText}>RÊVER · COMPRENDRE · AVANCER</Text>
        </View>
      </View>

      {/* Pensée du jour */}
      <View style={st.thought} accessibilityLabel={`Pensée du jour : ${thought}`}>
        <Text style={st.thoughtKicker}>✦ PENSÉE DU JOUR</Text>
        <Text style={st.thoughtText}>« {thought} »</Text>
      </View>

      {/* Mesures */}
      <View style={st.stats}>
        {[
          { icon: '📖', value: dreams.length, label: 'Rêves dans\nmon Grimoire', go: () => router.navigate('/grimoire') },
          { icon: '∞', value: motifs, label: 'Motifs\nrécurrents', go: () => router.push('/parcours') },
          { icon: '☾', value: presence, label: 'Jours\nde présence', go: () => router.push('/parcours') },
        ].map((x) => (
          <Pressable key={x.label} style={st.stat} onPress={x.go} accessibilityRole="button" accessibilityLabel={`${x.value} ${x.label.replace('\n', ' ')}`}>
            <View style={st.statTop}>
              <Text style={st.statIcon}>{x.icon}</Text>
              <Text style={st.statValue}>{x.value}</Text>
            </View>
            <Text style={st.statLabel}>{x.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Mon parcours onirique */}
      <Pressable style={st.journey} onPress={() => router.push('/parcours')} accessibilityRole="link" accessibilityLabel="Mon parcours onirique : ce qui se dessine">
        <Text style={st.journeyMoon}>◐</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={st.journeyKicker}>MON PARCOURS ONIRIQUE</Text>
          <Text style={st.journeyTitle}>Ce qui se dessine…</Text>
          <Text style={st.journeySub}>Évolutions · Récurrences · Transformations</Text>
        </View>
        <View style={st.circleArrow}>
          <Text style={{ color: colors.gold, fontSize: 18 }}>›</Text>
        </View>
      </Pressable>

      {/* Hero */}
      <ImageBackground source={IMAGES.hero} style={st.hero} imageStyle={st.heroImg} accessibilityRole="header">
        <View style={st.heroText}>
          <Text style={st.heroTitle}>Comprendre vos rêves.{'\n'}Repérer ce qui revient.{'\n'}Avancer concrètement.</Text>
          <View style={st.heroRule} />
        </View>
      </ImageBackground>
      <GoldButton label="Raconter un rêve  ›" onPress={() => router.navigate('/reve')} />

      {/* Trois raccourcis illustrés */}
      <View style={st.tiles}>
        {[
          { label: 'Mon Grimoire', sub: 'Mes rêves conservés et reliés', img: IMAGES.grimoire, go: () => router.navigate('/grimoire') },
          { label: 'Oracle 127', sub: 'Une carte, un éclairage', img: IMAGES.oracle, go: () => router.navigate('/oracle') },
          { label: 'Symboles', sub: 'Le dictionnaire des rêves', img: IMAGES.symboles, go: () => router.navigate('/symboles') },
        ].map((t) => (
          <Pressable key={t.label} style={st.tile} onPress={t.go} accessibilityRole="link" accessibilityLabel={t.label}>
            <Image source={t.img} style={st.tileImg} resizeMode="cover" />
            <View style={st.tileFoot}>
              <Text style={st.tileLabel}>{t.label}</Text>
              <Text style={st.tileSub}>{t.sub}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Les Sept Sœurs */}
      <Pressable style={st.sistersBanner} onPress={() => router.push('/soeurs')} accessibilityRole="link" accessibilityLabel="Les Sept Sœurs : sept regards pour éclairer ton chemin">
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={st.sistersTitle}>Les Sept Sœurs</Text>
          <Text style={st.journeySub}>Sept regards pour éclairer ton chemin.</Text>
          <View style={st.dots}>
            {SISTERS.map((sis, i) => (
              <View key={sis.slug} style={st.dotItem}>
                <View style={[st.dot, { backgroundColor: SISTER_COLORS[i] }]} />
                <Text style={[st.dotName, { color: SISTER_COLORS[i] }]}>{sis.name}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={st.circleArrow}>
          <Text style={{ color: colors.gold, fontSize: 18 }}>›</Text>
        </View>
      </Pressable>

      {/* Carte Oni */}
      <Pressable onPress={() => openPage('/oni-gardienne-des-reves/', 'Oni')} accessibilityRole="link" accessibilityLabel="Oni, votre guide onirique">
        <ImageBackground source={IMAGES.oni} style={st.oni} imageStyle={st.oniImg}>
          <View style={st.oniText}>
            <Text style={st.oniName}>Oni</Text>
            <Text style={st.oniTag}>Votre guide onirique</Text>
            <Text style={st.oniBody}>Un espace pour explorer, comprendre et avancer.</Text>
          </View>
          <View style={st.oniArrow}>
            <Text style={{ color: colors.text, fontSize: 18 }}>›</Text>
          </View>
        </ImageBackground>
      </Pressable>

      {/* Fonctionnalités */}
      <Card style={{ gap: space.lg }}>
        <View style={{ gap: 6 }}>
          <Eyebrow>Les fonctionnalités</Eyebrow>
          <Title>Le Cercle 127</Title>
          <Text style={st.muted}>Tout ce qui vous accompagne, rangé en trois espaces.</Text>
        </View>

        <Eyebrow>Apprendre</Eyebrow>
        <View style={st.grid}>
          {LEARN.map((l) => (
            <Pressable key={l.path} style={st.feature} onPress={() => openPage(l.path, l.title)} accessibilityRole="link" accessibilityLabel={l.title}>
              <View style={st.featureIcon}>
                <Text style={{ color: colors.text }}>{l.icon}</Text>
              </View>
              <Text style={st.featureTitle}>{l.title}</Text>
              <Text style={st.featureSub}>{l.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 6 }}>
          <Eyebrow>Les Sœurs</Eyebrow>
          <Text style={st.muted}>Oni lit les rêves. Les six autres Sœurs vous accompagnent selon votre besoin.</Text>
        </View>
        <View style={st.sisters}>
          {SISTERS.map((sis) => (
            <Pressable key={sis.slug} style={st.sister} onPress={() => openPage(sis.path, sis.name)} accessibilityRole="link" accessibilityLabel={`${sis.name} : ${sis.role}`}>
              <Image source={sis.image} style={st.avatar} />
              <Text style={st.sisterName}>{sis.name}</Text>
              <Text style={st.sisterVerb}>{sis.verb.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>

        <Eyebrow>Explorer</Eyebrow>
        <View style={{ gap: space.sm }}>
          {EXPLORE.map((e) => (
            <LinkRow key={e.path} icon={e.icon} title={e.title} subtitle={e.subtitle} onPress={() => openPage(e.path, e.title)} />
          ))}
        </View>
      </Card>

      {/* Oracle */}
      <Pressable style={st.oracle} onPress={() => router.navigate('/oracle')} accessibilityRole="link" accessibilityLabel="Oracle 127 : tirer une carte">
        <View style={{ flex: 1 }}>
          <Text style={st.oracleKicker}>ORACLE 127</Text>
          <Text style={st.oracleTitle}>Tirer une carte</Text>
          <Text style={st.muted}>Une question, une carte, un point de vue.</Text>
        </View>
        <Text style={{ color: colors.text, fontSize: 22 }}>›</Text>
      </Pressable>

      <Text style={st.quote}>Chaque rêve est une porte vers une version plus vraie de vous.</Text>
      <SiteFooter />
    </Screen>
  );
}

const st = StyleSheet.create({
  kicker: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.xs },
  moon: { fontSize: 40, color: colors.gold },
  kickerText: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2.5, color: '#c9c3e8', lineHeight: 20 },
  hero: { aspectRatio: 735 / 378, justifyContent: 'center', overflow: 'hidden', borderRadius: radius.lg },
  heroImg: { borderRadius: radius.lg, width: '100%', height: '100%' },
  heroText: { marginLeft: '42%', paddingRight: space.md },
  heroTitle: { fontFamily: fonts.title, fontSize: 18, lineHeight: 24, color: colors.text },
  heroRule: { width: 52, height: 1, backgroundColor: colors.gold, marginTop: space.md },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: colors.surface },
  tileImg: { width: '100%', height: 88 },
  tileFoot: { padding: 10, gap: 2 },
  tileSub: { fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: colors.muted },
  thought: { padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(216,182,107,0.06)', gap: 6 },
  thoughtKicker: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 2, color: colors.gold },
  thoughtText: { fontFamily: fonts.titleItalic, fontSize: 19, lineHeight: 26, color: colors.text },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, gap: 4, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: colors.surface },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statIcon: { fontSize: 20, color: colors.gold },
  statValue: { fontFamily: fonts.title, fontSize: 26, lineHeight: 30, color: colors.gold },
  statLabel: { fontFamily: fonts.body, fontSize: 11, lineHeight: 14, color: colors.text },
  journey: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: colors.surface },
  journeyMoon: { fontSize: 40, color: colors.gold },
  journeyKicker: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2, color: colors.muted },
  journeyTitle: { fontFamily: fonts.title, fontSize: 22, color: colors.text },
  journeySub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  circleArrow: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  sistersBanner: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: colors.surface },
  sistersTitle: { fontFamily: fonts.title, fontSize: 28, color: colors.text },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  dotItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dotName: { fontFamily: fonts.bodyMedium, fontSize: 12 },
  tileLabel: { fontFamily: fonts.title, fontSize: 15, color: colors.text, flexShrink: 1 },
  oni: { aspectRatio: 720 / 446, borderRadius: radius.md, overflow: 'hidden', padding: space.md, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  oniImg: { borderRadius: radius.md, width: '100%', height: '100%' },
  oniText: { maxWidth: '62%', gap: 2 },
  oniName: { fontFamily: fonts.title, fontSize: 28, color: colors.text },
  oniTag: { fontFamily: fonts.titleItalic, fontSize: 16, color: '#c9c3e8' },
  oniBody: { fontFamily: fonts.body, fontSize: 14, color: colors.text, marginTop: 4 },
  oniArrow: { position: 'absolute', right: space.md, top: '45%', width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  muted: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  feature: { width: '48.5%', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: space.md, gap: 6, backgroundColor: '#0f1428' },
  featureIcon: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  featureTitle: { fontFamily: fonts.title, fontSize: 18, color: colors.text },
  featureSub: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.muted },
  sisters: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.md },
  sister: { width: '25%', alignItems: 'center', gap: 4 },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(216,182,107,0.5)' },
  sisterName: { fontFamily: fonts.title, fontSize: 17, color: colors.text },
  sisterVerb: { fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 0.8, color: colors.gold },
  oracle: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: space.lg, backgroundColor: colors.surface },
  oracleKicker: { fontFamily: fonts.bodyMedium, fontSize: 12, letterSpacing: 2.5, color: colors.text },
  oracleTitle: { fontFamily: fonts.title, fontSize: 22, color: colors.text, marginVertical: 4 },
  quote: { fontFamily: fonts.titleItalic, fontSize: 16, color: colors.muted, textAlign: 'center' },
});
