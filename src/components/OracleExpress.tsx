import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '../i18n';
import { todaysDraw, recordTodaysDraw } from '../lib/oracle/daily';
import { drawFrom, type Draw } from '../lib/oracle/engine';
import { LAME_IMAGES } from '../lib/oracle/images';
import { lameText } from '../lib/oracle/localize';
import { recordGesture } from '../lib/rituel';
import { useSession } from '../lib/session';
import { colors, fonts, radius, space, textSize } from '../lib/theme';
import { mirrorForSister } from '../lib/echos';
import { sistersOfMask } from '../lib/oracle/engine';

/** Découvrir la carte sans inscription ; l'Oracle garde la même carte pendant la journée. */
export function OracleExpress({ onDraw }: { onDraw: () => void }) {
  const { user, isDemo } = useSession();
  const [draw, setDraw] = useState<Draw | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    todaysDraw().then((d) => { if (active) setDraw(d ?? null); }, () => { if (active) setError(true); });
    return () => { active = false; };
    // Le tirage est stocké par propriétaire : le relire si le compte change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isDemo]));

  const reveal = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(false);
    try {
      const existing = await todaysDraw();
      const next = existing ?? drawFrom('jour', undefined, '');
      if (!existing) await recordTodaysDraw(next);
      setDraw(next);
      await recordGesture('carte');
      onDraw();
    } catch {
      setError(true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const card = draw?.cards[0];
  const words = card ? lameText(card) : null;
  const lead = card ? sistersOfMask(card.mask)[0] : undefined;
  const mirror = mirrorForSister(lead?.name);
  return (
    <View style={st.card}>
      <Text style={st.kicker}>{t('Carte du jour').toUpperCase()} · {t('ORACLE EXPRESS · SANS INSCRIPTION')}</Text>
      <Text style={st.title}>{t('Pas de souvenir cette nuit ?')}</Text>
      <Text style={st.text}>{t('Découvre une carte pour éclairer ta journée.')}</Text>
      {card && words ? (
        <>
          <View style={st.reveal}>
            <Image source={LAME_IMAGES[card.n]} style={st.image} resizeMode="cover" accessibilityLabel={words.name} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={st.title}>{words.name}</Text>
              <Text style={st.text}>{words.definition}</Text>
            </View>
          </View>
          {mirror && <View style={{ gap: space.xs }}><Text style={st.kicker}>{t('MIROIR SYMBOLIQUE')} · {t(mirror.name)}</Text><Text style={st.text}>{t(mirror.question)}</Text></View>}
          <Pressable onPress={() => router.navigate('/oracle')} accessibilityRole="button" style={st.button}>
            <Text style={st.buttonText}>{t('Voir le conseil et garder mon tirage ›')}</Text>
          </Pressable>
          <Text style={st.note}>{t('Le tirage gardé dans ton Grimoire reste sur cet appareil.')}</Text>
          {!user && !isDemo && <Pressable onPress={() => router.push({ pathname: '/connexion', params: { mode: 'register' } })} accessibilityRole="link"><Text style={st.link}>{t('Créer un compte gratuit ›')}</Text></Pressable>}
        </>
      ) : (
        <Pressable onPress={() => void reveal()} disabled={busy} accessibilityRole="button" accessibilityState={{ disabled: busy }} style={st.button}>
          <Text style={st.buttonText}>{t('Découvrir ma carte du jour ›')}</Text>
        </Pressable>
      )}
      {error && <Text accessibilityRole="alert" style={st.text}>{t('Impossible de préparer le tirage. Réessaie.')}</Text>}
    </View>
  );
}

const st = StyleSheet.create({
  card: { padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 10 },
  kicker: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: textSize.xs, letterSpacing: 1.5 },
  title: { color: colors.text, fontFamily: fonts.title, fontSize: 24 },
  text: { color: colors.text, fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
  note: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  reveal: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  image: { width: 90, height: 145, borderRadius: 8 },
  button: { borderWidth: 1, borderColor: colors.gold, borderRadius: radius.md, padding: space.ms, alignItems: 'center' },
  buttonText: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 14, textAlign: 'center' },
  link: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 14 },
});
