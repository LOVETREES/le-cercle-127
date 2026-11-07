import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Body, Card, Eyebrow, GoldButton, OutlineButton, Screen, Title } from '../components/ui';
import { journey } from '../lib/insights';
import { useSession } from '../lib/session';
import { colors, fonts, radius, space } from '../lib/theme';

// « Mon parcours onirique » : ce qui se dessine au fil des nuits. Tout est calculé sur l'appareil.
export default function Parcours() {
  const { dreams } = useSession();
  const j = useMemo(() => journey(dreams), [dreams]);
  const maxMonth = Math.max(1, ...j.months.map((m) => m.count));
  const maxEmo = Math.max(1, ...j.emotions.map((e) => e.count));

  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <Eyebrow>Mon parcours onirique</Eyebrow>
        <Title size={34}>Ce qui se dessine…</Title>
        <Body muted>Évolutions, récurrences, transformations : un miroir de vos nuits, jamais un jugement.</Body>
      </View>

      {j.total === 0 ? (
        <Card>
          <Body>Votre parcours apparaîtra dès vos premiers rêves notés.</Body>
          <GoldButton label="Raconter un rêve" onPress={() => router.navigate('/reve')} />
        </Card>
      ) : (
        <>
          <View style={st.row}>
            <Stat value={j.total} label="Rêves notés" />
            <Stat value={j.currentStreak} label="Jours d’affilée" />
            <Stat value={j.longestStreak} label="Meilleure série" />
          </View>

          <Card>
            <Eyebrow>Évolution · 6 derniers mois</Eyebrow>
            <View style={st.chart}>
              {j.months.map((m) => (
                <View key={m.key} style={st.barCol} accessibilityLabel={`${m.label} : ${m.count} rêve${m.count > 1 ? 's' : ''}`}>
                  <Text style={st.barValue}>{m.count || ''}</Text>
                  <View style={[st.bar, { height: 6 + (m.count / maxMonth) * 110 }]} />
                  <Text style={st.barLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
            {j.months.some((m) => m.avgIntensity !== undefined) && (
              <Body muted style={{ fontSize: 13 }}>
                Intensité moyenne :{' '}
                {j.months.filter((m) => m.avgIntensity !== undefined).map((m) => `${m.label} ${String(m.avgIntensity).replace(".", ",")}/5`).join(' · ')}
              </Body>
            )}
          </Card>

          {j.calmShare && (
            <Card>
              <Eyebrow>Transformation</Eyebrow>
              <Text style={st.big}>
                {j.calmShare.before} % → {j.calmShare.after} %
              </Text>
              <Body muted>
                Part de rêves vécus dans la joie, la sérénité ou l’émerveillement, entre la première et la seconde moitié de votre Grimoire.
              </Body>
            </Card>
          )}

          <Card>
            <Eyebrow>Récurrences</Eyebrow>
            {j.recurring.length === 0 ? (
              <Body muted>Aucun symbole ne revient encore. Ils apparaîtront ici au fil des nuits.</Body>
            ) : (
              <View style={st.chips}>
                {j.recurring.map(([s, n]) => (
                  <Text key={s} style={st.chip}>
                    {s} · {n}
                  </Text>
                ))}
              </View>
            )}
          </Card>

          {j.emotions.length > 0 && (
            <Card>
              <Eyebrow>Climat émotionnel</Eyebrow>
              {j.emotions.slice(0, 6).map((e) => (
                <View key={e.label} style={st.emoRow}>
                  <Text style={st.emoLabel}>{e.label}</Text>
                  <View style={st.emoTrack}>
                    <View style={[st.emoFill, { width: `${(e.count / maxEmo) * 100}%` }]} />
                  </View>
                  <Text style={st.emoCount}>{e.count}</Text>
                </View>
              ))}
            </Card>
          )}
        </>
      )}
      <Body muted style={{ fontSize: 12, textAlign: 'center' }}>
        Ces mesures restent sur votre téléphone et ne remplacent pas un accompagnement thérapeutique.
      </Body>
      <OutlineButton label="Retour à l’accueil" onPress={() => router.navigate('/')} />
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={st.stat}>
      <Text style={st.statValue}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 2 },
  statValue: { fontFamily: fonts.title, fontSize: 30, color: colors.gold },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.text },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160, paddingTop: space.sm },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: 22, borderRadius: 6, backgroundColor: colors.gold },
  barValue: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.text },
  barLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  big: { fontFamily: fonts.title, fontSize: 30, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.gold, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  emoRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  emoLabel: { width: 110, fontFamily: fonts.body, fontSize: 13, color: colors.text },
  emoTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  emoFill: { height: 8, borderRadius: 4, backgroundColor: '#a798ee' },
  emoCount: { width: 24, textAlign: 'right', fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
});
