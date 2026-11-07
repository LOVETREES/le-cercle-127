import { router, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Card, Field, GoldButton, Notice, OutlineButton, Screen, Title } from '../components/ui';
import { loadRealityChecks, makeRealityCheck, REALITY_STATES, saveRealityChecks, type RealityCheck } from '../lib/reality-journal';
import { useSession } from '../lib/session';
import { colors, fonts, space } from '../lib/theme';

export default function Journal() {
  const { user, isDemo } = useSession();
  const [entries, setEntries] = useState<RealityCheck[]>([]);
  const [context, setContext] = useState('');
  const [observation, setObservation] = useState('');
  const [state, setState] = useState<RealityCheck['state']>('awake');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    loadRealityChecks(isDemo).then((list) => { if (active) setEntries(list); });
    return () => { active = false; };
  }, [isDemo]));
  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = [makeRealityCheck(context, observation, state), ...entries];
      await saveRealityChecks(next, isDemo);
      setEntries(next); setContext(''); setObservation('');
      setMessage({ text: 'Vérification gardée sur cet appareil.', error: false });
    } catch (error) { setMessage({ text: error instanceof Error ? error.message : 'Enregistrement impossible. Réessayez.', error: true }); }
    finally { setBusy(false); }
  };
  return <Screen>
    <Title>Mon journal de vérification</Title>
    <Body>Prenez un instant pour observer ce qui vous entoure et noter votre ressenti.</Body>
    <Body muted>Ce journal fonctionne sans inscription. Ses notes restent sur cet appareil, séparément du journal du site.</Body>
    {isDemo && <Notice text="Démonstration : ces notes sont séparées de votre journal personnel." />}
    {!user && <Card>
      <Body>Vous pouvez aussi créer votre compte pour le Grimoire de rêves.</Body>
      <GoldButton label="Créer mon compte" onPress={() => router.push({ pathname: '/connexion', params: { mode: 'register' } })} />
      <OutlineButton label="J’ai déjà un compte" onPress={() => router.push('/connexion')} />
    </Card>}
    <Card>
      <Title size={25}>Une nouvelle vérification</Title>
      <Field label="Où suis-je, que fais-je ?" value={context} onChangeText={setContext} maxLength={500} />
      <Field label="Ce que j’observe" value={observation} onChangeText={setObservation} multiline maxLength={4000} />
      <View style={{ gap: space.sm }}>
        {REALITY_STATES.map((choice) => <Pressable key={choice.value} accessibilityRole="radio" accessibilityState={{ checked: state === choice.value }} onPress={() => setState(choice.value)} style={{ padding: space.md, borderRadius: 14, borderWidth: 1, borderColor: state === choice.value ? colors.gold : colors.border }}>
          <Text style={{ color: colors.text, fontFamily: fonts.body }}>{choice.label}</Text>
        </Pressable>)}
      </View>
      {message && <Notice tone={message.error ? 'error' : 'success'} text={message.text} />}
      <GoldButton label="Garder ma vérification" loading={busy} onPress={save} />
    </Card>
    <Title size={26}>Mes vérifications</Title>
    {entries.length === 0 && <Body muted>Aucune vérification gardée pour l’instant.</Body>}
    {entries.map((entry) => <Card key={entry.id}>
      <Body muted>{new Date(entry.createdAt).toLocaleString('fr-FR')} · {REALITY_STATES.find((choice) => choice.value === entry.state)?.label}</Body>
      {entry.context ? <Body>{entry.context}</Body> : null}
      {entry.observation ? <Body>{entry.observation}</Body> : null}
      <OutlineButton label="Supprimer cette vérification" danger disabled={busy} onPress={async () => {
        setBusy(true);
        try { const next = entries.filter((item) => item.id !== entry.id); await saveRealityChecks(next, isDemo); setEntries(next); }
        catch { setMessage({ text: 'Suppression impossible. Réessayez.', error: true }); }
        finally { setBusy(false); }
      }} />
    </Card>)}
    <OutlineButton label="Retrouver mon ancien journal sur le site" onPress={() => { void WebBrowser.openBrowserAsync('https://lecercle127.com/verification-des-reves/').catch(() => setMessage({ text: 'Le site n’a pas pu être ouvert.', error: true })); }} />
    <Body muted>Le journal du site utilise sa propre connexion. Ses anciennes entrées ne sont pas importées automatiquement ici.</Body>
  </Screen>;
}
