import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader, Body, Card, Eyebrow, GoldButton, Notice, OutlineButton, Title } from '../../components/ui';
import { EMOTIONS } from '../../lib/model';
import { useSession } from '../../lib/session';
import { colors, fonts, radius, space } from '../../lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const emotionLabel = (v?: string) => EMOTIONS.find((e) => e.value === v)?.label;

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Grimoire() {
  const { user, dreams, syncing, lastError, refresh } = useSession();

  // « Ce qui revient » : émotions les plus fréquentes.
  const recurring = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of dreams) if (d.emotion) counts.set(d.emotion, (counts.get(d.emotion) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [dreams]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.night }} edges={['top']}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={{ padding: space.md, paddingBottom: 120, gap: space.lg }}
        refreshControl={<RefreshControl refreshing={syncing} onRefresh={refresh} tintColor={colors.gold} />}
      >
        <View style={{ gap: space.sm, alignItems: 'center' }}>
          <Eyebrow>Votre espace privé</Eyebrow>
          <Title size={40}>Mon Grimoire</Title>
          <Body muted style={{ textAlign: 'center' }}>
            Vos rêves, même fragmentaires, dans un espace qui n’appartient qu’à vous.
          </Body>
        </View>

        {!user && (
          <Card>
            <Eyebrow>Un espace privé</Eyebrow>
            <Title size={28}>Votre Grimoire vous attend</Title>
            <Body muted>
              Connectez-vous pour conserver vos rêves, observer les symboles qui reviennent et les retrouver aussi sur
              lecercle127.com.
            </Body>
            <GoldButton label="Entrer dans mon Grimoire" onPress={() => router.push('/connexion')} />
            <OutlineButton label="Créer mon compte gratuit" onPress={() => router.push({ pathname: '/connexion', params: { mode: 'register' } })} />
          </Card>
        )}

        {lastError && <Notice tone="error" text={lastError} />}

        {recurring.length > 0 && (
          <Card>
            <Eyebrow>Ce qui revient</Eyebrow>
            <View style={st.recurring}>
              {recurring.map(([emo, n]) => (
                <View key={emo} style={st.badge}>
                  <Text style={st.badgeText}>
                    {emotionLabel(emo) ?? emo} · {n}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {dreams.length === 0 ? (
          <Card style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 34, color: colors.gold }}>☾</Text>
            <Body muted style={{ textAlign: 'center' }}>
              Aucun rêve pour l’instant. Le prochain réveil est une porte.
            </Body>
            <GoldButton label="Raconter un rêve" onPress={() => router.navigate('/reve')} />
          </Card>
        ) : (
          <View style={{ gap: space.sm }}>
            {dreams.map((d) => (
              <Pressable
                key={d.id}
                style={({ pressed }) => [st.dream, pressed && { opacity: 0.7 }]}
                onPress={() => router.push({ pathname: '/reve/[id]', params: { id: d.id } })}
                accessibilityRole="link"
                accessibilityLabel={`${d.title}, ${formatDate(d.dreamDate)}`}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={st.dreamDate}>
                    {formatDate(d.dreamDate)}
                    {d.pending ? ' · sur cet appareil' : ''}
                  </Text>
                  <Text style={st.dreamTitle} numberOfLines={1}>
                    {d.title}
                  </Text>
                  <Text style={st.dreamExcerpt} numberOfLines={2}>
                    {d.story}
                  </Text>
                </View>
                {d.emotion ? <Text style={st.emo}>{emotionLabel(d.emotion)}</Text> : null}
              </Pressable>
            ))}
          </View>
        )}

        {user && (
          <OutlineButton label={`Mon compte · ${user.name}`} onPress={() => router.push('/compte')} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  recurring: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  badge: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontFamily: fonts.bodyMedium, color: colors.gold, fontSize: 13 },
  dream: { flexDirection: 'row', gap: space.md, padding: space.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  dreamDate: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1.2, color: colors.gold, textTransform: 'uppercase' },
  dreamTitle: { fontFamily: fonts.title, fontSize: 21, color: colors.text },
  dreamExcerpt: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.muted },
  emo: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, alignSelf: 'flex-start' },
});
