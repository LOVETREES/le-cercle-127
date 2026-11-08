import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Eyebrow, GoldButton, OutlineButton, Screen, Title } from '../components/ui';
import { readingSummary } from '../lib/model';
import { deletePalmEverywhere, formatPalmSummary, listPalmReadings, syncPalmReadings, type PalmReading } from '../lib/palm';
import { useSession } from '../lib/session';
import { colors, fonts, radius, space } from '../lib/theme';
import { locale, t } from '../i18n';

const TERRA = { path: '/terra-gardienne-de-lancrage/', title: 'Terra' };

function longDate(iso: string) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) : new Date(iso);
  return d.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
}

// « Mes lectures » : la lecture de ses rêves (Oni) et de sa main (Terra), au même endroit.
export default function MesLectures() {
  const { dreams, token } = useSession();
  const [synced, setSynced] = useState<'ok' | 'local' | 'error'>('local');
  const [tab, setTab] = useState<'reves' | 'main'>('reves');
  const [palms, setPalms] = useState<PalmReading[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const read = useMemo(() => dreams.filter((d) => d.oniReading).sort((a, b) => b.dreamDate.localeCompare(a.dreamDate)), [dreams]);

  useFocusEffect(
    useCallback(() => {
      listPalmReadings().then(setPalms, () => undefined);
      if (token) {
        syncPalmReadings(token).then(
          (list) => {
            setPalms(list);
            setSynced('ok');
          },
          () => setSynced('error'),
        );
      }
    }, [token]),
  );

  const remove = (p: PalmReading) => {
    const go = () => deletePalmEverywhere(p.id, token).then(setPalms, () => undefined);
    if (Platform.OS === 'web') go();
    else Alert.alert(t('Retirer cette lecture ?'), t('Elle sera supprimée de ce téléphone et de votre compte.'), [{ text: 'Annuler', style: 'cancel' }, { text: 'Retirer', style: 'destructive', onPress: go }]);
  };

  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <Eyebrow>{t('Ma promesse d’individuation')}</Eyebrow>
        <Title size={34}>{t('Mes lectures')}</Title>
        <Body muted>
          {t('Vos rêves et votre main sont deux miroirs. Les relire, c’est revenir à vous-même et devenir, pas à pas, pleinement qui vous êtes.')}
        </Body>
      </View>

      <View style={st.switch} accessibilityRole="tablist">
        {(
          [
            ['reves', t('Mes rêves · {n}', { n: read.length })],
            ['main', t('Ma main · {n}', { n: palms.length })],
          ] as const
        ).map(([k, label]) => (
          <Pressable key={k} style={[st.switchBtn, tab === k && st.switchOn]} onPress={() => setTab(k)} accessibilityRole="tab" accessibilityState={{ selected: tab === k }}>
            <Text style={[st.switchText, tab === k && st.switchTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'reves' ? (
        read.length === 0 ? (
          <Card>
            <Eyebrow>Oni</Eyebrow>
            <Body>{t('Les lectures de vos rêves par Oni, relues par une personne du Cercle, apparaîtront ici.')}</Body>
            <OutlineButton label={t('Ouvrir mon Grimoire')} onPress={() => router.navigate('/grimoire')} />
          </Card>
        ) : (
          read.map((d) => (
            <Pressable key={d.id} style={st.item} onPress={() => router.push({ pathname: '/reve/[id]', params: { id: d.id } })} accessibilityRole="link" accessibilityLabel={t('Lecture d’Oni : {v0}', { v0: d.title })}>
              <Text style={st.date}>{longDate(d.dreamDate)}</Text>
              <Text style={st.title}>{d.title}</Text>
              <Text style={st.reading} numberOfLines={4}>
                {readingSummary(d.oniReading, d.title)}
              </Text>
              <Text style={st.more}>{t('Lire la lecture complète ›')}</Text>
            </Pressable>
          ))
        )
      ) : (
        <>
          <GoldButton label={t('Lire ma main avec Terra')} onPress={() => router.push({ pathname: '/page', params: TERRA })} />
          <Body muted style={{ fontSize: 12, textAlign: 'center' }}>
            {synced === 'ok'
              ? t('Gardées dans votre compte : vous les retrouvez sur tous vos téléphones.')
              : synced === 'error'
                ? t('Gardées sur ce téléphone. La sauvegarde dans votre compte reprendra plus tard.')
                : t('Gardées sur ce téléphone. Connectez-vous pour les retrouver partout.')}
          </Body>
          {palms.length === 0 ? (
            <Card>
              <Eyebrow>Terra</Eyebrow>
              <Body>{t('Photographiez votre paume avec Terra. Quand elle vous donne sa parole, la lecture de votre main est gardée ici.')}</Body>
            </Card>
          ) : (
            palms.map((p) => {
              const expanded = open === p.id;
              return (
                <Card key={p.id}>
                  <Text style={st.date}>{longDate(p.at)}</Text>
                  {p.title ? <Text style={st.title}>{p.title}</Text> : null}
                  <Text style={st.reading}>{t('«')} {p.word} {t('»')}</Text>
                  {p.mantra ? (
                    <View style={st.line}>
                      <Text style={st.lineLabel}>MANTRA</Text>
                      <Text style={st.lineText}>{p.mantra}</Text>
                    </View>
                  ) : null}
                  {p.mudra ? (
                    <View style={st.line}>
                      <Text style={st.lineLabel}>GESTE</Text>
                      <Text style={st.lineText}>
                        {p.mudra}
                        {p.mudraCopy ? ` · ${p.mudraCopy}` : ''}
                      </Text>
                    </View>
                  ) : null}
                  {p.question ? (
                    <View style={st.line}>
                      <Text style={st.lineLabel}>{t('QUESTION POUR LE GRIMOIRE')}</Text>
                      <Text style={st.lineText}>{p.question}</Text>
                    </View>
                  ) : null}
                  {p.summary ? (
                    <Pressable onPress={() => setOpen(expanded ? null : p.id)} accessibilityRole="button">
                      <Text style={st.more}>{expanded ? t('Masquer les observations de ma main') : t('Voir les observations de ma main ›')}</Text>
                    </Pressable>
                  ) : null}
                  {expanded && p.summary ? <Text style={st.lineText}>{formatPalmSummary(p.summary)}</Text> : null}
                  <Pressable onPress={() => remove(p)} accessibilityRole="button">
                    <Text style={st.remove}>{t('Retirer cette lecture')}</Text>
                  </Pressable>
                </Card>
              );
            })
          )}
        </>
      )}

      <Body muted style={{ fontSize: 12, textAlign: 'center' }}>
        {t('Des pistes de réflexion symboliques, jamais un diagnostic ni une prédiction.')}
      </Body>
      <OutlineButton label={t('Retour à l’accueil')} onPress={() => router.navigate('/')} />
    </Screen>
  );
}

const st = StyleSheet.create({
  switch: { flexDirection: 'row', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, padding: 4 },
  switchBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  switchOn: { backgroundColor: colors.gold },
  switchText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  switchTextOn: { color: '#23182d' },
  item: { padding: space.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 6 },
  date: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1.2, color: colors.gold, textTransform: 'uppercase' },
  title: { fontFamily: fonts.title, fontSize: 21, color: colors.text },
  reading: { fontFamily: fonts.titleItalic, fontSize: 18, lineHeight: 25, color: colors.text },
  more: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.gold, marginTop: 4 },
  line: { gap: 2 },
  lineLabel: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.5, color: colors.muted },
  lineText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.text },
  remove: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: space.sm },
});
