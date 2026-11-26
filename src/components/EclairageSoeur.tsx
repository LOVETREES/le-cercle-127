import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getLang, t } from '../i18n';
import { api } from '../lib/api';
import { explicitCrisis } from '../lib/renouveau';
import { useSession } from '../lib/session';
import { colors, fonts, radius, space, textSize } from '../lib/theme';
import { Notice, OutlineButton } from './ui';

const NAMES: Record<string, string> = { oni: 'Oni', alka: 'Alka', naia: 'Naïa', terra: 'Terra', irma: 'Irma', astria: 'Astria', ignis: 'Ignis' };

export function EclairageSoeur({ sister, text }: { sister: string; text: string }) {
  const { token, isDemo } = useSession();
  const [open, setOpen] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<{ sister?: string; text: string } | null>(null);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const lock = useRef(false);

  useEffect(() => () => { sequence.current += 1; }, []);

  const ask = async () => {
    if (!token || isDemo || !consent || !excerpt.trim() || explicitCrisis(excerpt) || lock.current) return;
    lock.current = true;
    const requestId = ++sequence.current;
    setBusy(true); setError(''); setAnswer(null); setConsent(false);
    try {
      const result = await api.sisterForChapter(token, { sister, excerpt: excerpt.trim(), consent: true, lang: getLang() });
      if (sequence.current !== requestId) return;
      if (!result?.ok || !result.answer?.trim()) throw new Error(t('Aucun éclairage n’a pu être obtenu. Réessaie plus tard.'));
      setAnswer({ sister: result.sister ? NAMES[result.sister.toLowerCase()] : undefined, text: result.answer.trim() });
    } catch (e) {
      if (sequence.current === requestId) setError(e instanceof Error ? e.message : t('Aucun éclairage n’a pu être obtenu. Réessaie plus tard.'));
    } finally {
      lock.current = false;
      if (sequence.current === requestId) setBusy(false);
    }
  };

  return <View style={{ gap: 10 }}>
    {!open ? <OutlineButton label={t('Demander un éclairage à {s} sur ce que je viens d’écrire', { s: NAMES[sister] ?? sister })} disabled={!text.trim()} onPress={() => { setExcerpt(text.slice(0, 1200)); setOpen(true); }} /> : <>
      {!token || isDemo ? <>
        <Text style={st.muted}>{t('Connecte-toi pour demander un éclairage. Ton texte ne sera pas envoyé lors de la connexion.')}</Text>
        <Pressable accessibilityRole="link" onPress={() => router.push('/connexion')}><Text style={st.link}>{t('Se connecter ›')}</Text></Pressable>
      </> : <>
        <Text style={st.muted}>{t('Seul l’extrait ci-dessous sera envoyé au site et à son service d’IA pour cette réponse. Tu peux le modifier ou annuler. Les autres pages du journal ne sont pas envoyées.')}</Text>
        <TextInput accessibilityLabel={t('Extrait à partager')} value={excerpt} onChangeText={(v) => { sequence.current += 1; setBusy(false); setExcerpt(v); setConsent(false); setAnswer(null); setError(''); }} maxLength={1200} multiline style={st.input} />
        {text.length > 1200 && <Text style={st.muted}>{t('Les 1 200 premiers caractères sont proposés ; choisis ce que tu souhaites partager.')}</Text>}
        {explicitCrisis(excerpt) ? <Notice tone="error" text={t('Si tu traverses une crise, contacte une personne de confiance ou un professionnel. En France, le 3114 répond 24 h/24 ; en danger immédiat, appelle le 15 ou le 112.')} /> : <>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} onPress={() => setConsent(!consent)} style={st.check}>
            <Text style={st.link}>{consent ? '☑' : '☐'}</Text><Text style={st.muted}>{t('J’accepte cet envoi pour recevoir un éclairage par IA.')}</Text>
          </Pressable>
          <OutlineButton label={t(busy ? 'Demande en cours…' : 'Envoyer cet extrait')} disabled={!consent || busy || !excerpt.trim()} onPress={() => void ask()} />
        </>}
        {answer && <View style={{ gap: 6 }}><Text style={st.link}>{answer.sister ? t('Éclairage de {s}', { s: answer.sister }) : t('Éclairage reçu')}</Text><Text style={st.answer}>{answer.text}</Text><Text style={st.muted}>{t('Cette réponse n’est pas enregistrée dans le journal.')}</Text></View>}
        {error ? <Notice text={error} tone="error" /> : null}
      </>}
      <Pressable accessibilityRole="button" onPress={() => { sequence.current += 1; setOpen(false); setConsent(false); setAnswer(null); setError(''); setBusy(false); }}><Text style={st.link}>{t('Annuler')}</Text></Pressable>
    </>}
  </View>;
}

const st = StyleSheet.create({
  muted: { color: colors.muted, fontFamily: fonts.body, fontSize: textSize.sm, lineHeight: 20, flexShrink: 1 },
  answer: { color: colors.text, fontFamily: fonts.body, fontSize: textSize.md, lineHeight: 23 },
  link: { color: colors.gold, fontFamily: fonts.bodyBold, fontSize: 14 },
  check: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  input: { minHeight: 100, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, fontFamily: fonts.body, fontSize: textSize.md, padding: space.ms, textAlignVertical: 'top' },
});
