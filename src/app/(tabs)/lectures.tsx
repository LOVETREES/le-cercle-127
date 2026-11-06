import { router } from 'expo-router';
import { useMemo } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Body, Card, Eyebrow, GoldButton, Notice, OutlineButton, Title } from '../../components/ui';
import { readingSummary } from '../../lib/model';
import { useSession } from '../../lib/session';
import { colors, fonts, radius, space } from '../../lib/theme';

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Toutes les lectures d'Oni au même endroit, et où elles arrivent.
export default function Lectures() {
  const { user, dreams, oniEnabled, oniRequested, syncing, refresh } = useSession();
  const read = useMemo(() => dreams.filter((d) => d.oniReading), [dreams]);
  const waiting = useMemo(() => dreams.filter((d) => !d.oniReading && !d.pending), [dreams]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.night }} edges={['top']}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={{ padding: space.md, paddingBottom: 120, gap: space.lg }}
        refreshControl={<RefreshControl refreshing={syncing} onRefresh={refresh} tintColor={colors.gold} />}
      >
        <View style={{ gap: space.sm, alignItems: 'center' }}>
          <Image source={require('../../../assets/images/oni.webp')} style={st.oni} />
          <Eyebrow>Oni lit vos rêves</Eyebrow>
          <Title size={36}>Lectures d’Oni</Title>
          <Body muted style={{ textAlign: 'center' }}>
            Chaque lecture d’Oni arrive ici, et dans le rêve concerné de votre Grimoire.
          </Body>
        </View>

        {!user && (
          <Card>
            <Body>Connectez-vous pour retrouver les lectures liées à vos rêves.</Body>
            <GoldButton label="Entrer dans mon Grimoire" onPress={() => router.push('/connexion')} />
          </Card>
        )}

        {user && read.length === 0 && (
          <Card>
            <Eyebrow>Comment ça marche</Eyebrow>
            <Text style={st.step}>1. Confiez un rêve dans l’onglet Rêve.</Text>
            <Text style={st.step}>2. Il rejoint votre Grimoire.</Text>
            <Text style={st.step}>
              3. {oniEnabled ? 'Ouvrez-le et touchez « Demander une lecture à Oni ».' : 'Quand Oni l’aura lu, sa lecture apparaîtra ici.'}
            </Text>
            <Text style={st.step}>4. La lecture est relue par une personne du Cercle, puis elle arrive ici.
            </Text>
            {!oniEnabled && (
              <Notice text="Les lectures d’Oni dans l’application ouvrent très bientôt. Vos rêves sont déjà gardés : ils seront prêts à être lus." />
            )}
            <OutlineButton label="Confier un rêve" onPress={() => router.navigate('/reve')} />
          </Card>
        )}

        {read.map((d) => (
          <Pressable
            key={d.id}
            style={({ pressed }) => [st.item, pressed && { opacity: 0.7 }]}
            onPress={() => router.push({ pathname: '/reve/[id]', params: { id: d.id } })}
            accessibilityRole="link"
            accessibilityLabel={`Lecture d’Oni : ${d.title}`}
          >
            <Text style={st.date}>{formatDate(d.dreamDate)}</Text>
            <Text style={st.title}>{d.title}</Text>
            <Text style={st.reading} numberOfLines={4}>
              {readingSummary(d.oniReading, d.title)}
            </Text>
            <Text style={st.more}>Lire la lecture complète ›</Text>
          </Pressable>
        ))}

        {user && waiting.length > 0 && (
          <Card>
            <Eyebrow>En attente de lecture · {waiting.length}</Eyebrow>
            {waiting.slice(0, 5).map((d) => (
              <Pressable
                key={d.id}
                onPress={() => router.push({ pathname: '/reve/[id]', params: { id: d.id } })}
                accessibilityRole="link"
              >
                <Text style={st.waiting}>
                  ☾ {d.title}
                  {oniRequested.includes(d.id) ? <Text style={st.preparing}>  · lecture en préparation</Text> : null}
                </Text>
              </Pressable>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  oni: { width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: colors.gold },
  step: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  item: { padding: space.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 6 },
  date: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1.2, color: colors.gold, textTransform: 'uppercase' },
  title: { fontFamily: fonts.title, fontSize: 21, color: colors.text },
  reading: { fontFamily: fonts.titleItalic, fontSize: 17, lineHeight: 24, color: colors.text },
  more: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.gold, marginTop: 4 },
  waiting: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, paddingVertical: 4 },
  preparing: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gold },
});
