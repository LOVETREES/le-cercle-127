import { router } from 'expo-router';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Eyebrow, GoldButton, LinkRow, Screen, SiteFooter, Title } from '../../components/ui';
import { EXPLORE, IMAGES, LEARN, SISTERS } from '../../lib/content';
import { colors, fonts, radius, space } from '../../lib/theme';

const openPage = (path: string, title: string) => router.push({ pathname: '/page', params: { path, title } });

export default function Home() {
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
          { label: 'Mon Grimoire', img: IMAGES.grimoire, go: () => router.navigate('/grimoire') },
          { label: 'Oracle 127', img: IMAGES.oracle, go: () => router.navigate('/oracle') },
          { label: 'Symboles', img: IMAGES.symboles, go: () => router.navigate('/symboles') },
        ].map((t) => (
          <Pressable key={t.label} style={st.tile} onPress={t.go} accessibilityRole="link" accessibilityLabel={t.label}>
            <Image source={t.img} style={st.tileImg} resizeMode="cover" />
            <View style={st.tileFoot}>
              <Text style={st.tileLabel}>{t.label}</Text>
              <Text style={st.tileChevron}>›</Text>
            </View>
          </Pressable>
        ))}
      </View>

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
  heroImg: { borderRadius: radius.lg },
  heroText: { marginLeft: '42%', paddingRight: space.md },
  heroTitle: { fontFamily: fonts.title, fontSize: 18, lineHeight: 24, color: colors.text },
  heroRule: { width: 52, height: 1, backgroundColor: colors.gold, marginTop: space.md },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: colors.surface },
  tileImg: { width: '100%', height: 88 },
  tileFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 },
  tileLabel: { fontFamily: fonts.title, fontSize: 15, color: colors.text, flexShrink: 1 },
  tileChevron: { color: colors.text },
  oni: { aspectRatio: 720 / 446, borderRadius: radius.md, overflow: 'hidden', padding: space.md, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  oniImg: { borderRadius: radius.md },
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
