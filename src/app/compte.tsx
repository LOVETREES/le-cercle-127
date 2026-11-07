import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Body, Card, Eyebrow, Notice, OutlineButton, SiteFooter, Title } from '../components/ui';
import { clearLastError, clearWebError, readLastError, readWebError, type LastError, type WebError } from '../lib/crash';
import { DEFAULT_REMINDER, loadReminder, saveReminder, type Reminder } from '../lib/reminders';
import { useSession } from '../lib/session';
import { colors, fonts, radius, space } from '../lib/theme';

const HOURS = [6, 7, 8, 9];

function confirm(title: string, message: string, action: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
      { text: action, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

export default function Compte() {
  const { user, signOut, deleteAccount, isDemo, clearLocalData } = useSession();
  const [busy, setBusy] = useState(false);
  const [reminder, setReminder] = useState<Reminder>(DEFAULT_REMINDER);
  const [notice, setNotice] = useState<{ text: string; tone: 'error' | 'success' } | null>(null);
  const [lastError, setLastError] = useState<LastError | null>(null);
  const [webError, setWebError] = useState<WebError | null>(null);

  useEffect(() => {
    loadReminder().then((value) => setReminder(Platform.OS === 'web' ? { ...value, enabled: false } : value));
    readLastError().then(setLastError);
    readWebError().then(setWebError);
  }, []);

  const updateReminder = async (next: Reminder) => {
    setReminder(next);
    const ok = await saveReminder(next);
    if (!ok) {
      setReminder({ ...next, enabled: false });
      setNotice({ tone: 'error', text: 'Les notifications sont refusées. Autorisez-les dans les réglages du téléphone.' });
    } else setNotice(null);
  };

  const runAccountAction = async (action: () => Promise<void>, message: string) => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try { await action(); setNotice({ tone: 'success', text: message }); }
    catch (e) { setNotice({ tone: 'error', text: e instanceof Error ? e.message : 'L’opération a échoué. Réessayez.' }); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.night }} contentContainerStyle={st.content}>
      {user ? (
        <View style={{ gap: space.sm }}>
          <Eyebrow>Connecté·e</Eyebrow>
          <Title>{user.name}</Title>
          {user.email ? <Body muted>{user.email}</Body> : null}
        </View>
      ) : (
        <OutlineButton label="Se connecter" onPress={() => router.replace('/connexion')} />
      )}

      <Card>
        <Eyebrow>Rappel du matin</Eyebrow>
        <View style={st.switchRow}>
          <Body style={{ flex: 1 }}>Me rappeler de noter mes rêves au réveil</Body>
          <Switch
            disabled={Platform.OS === 'web'}
            value={reminder.enabled}
            onValueChange={(v) => updateReminder({ ...reminder, enabled: v })}
            trackColor={{ true: colors.goldDeep, false: '#333652' }}
            thumbColor={reminder.enabled ? colors.gold : '#ccc'}
            accessibilityLabel="Rappel du matin"
          />
        </View>
        {reminder.enabled && (
          <View style={st.hours}>
            {HOURS.map((h) => {
              const on = reminder.hour === h;
              return (
                <Pressable
                  key={h}
                  style={[st.hour, on && st.hourOn]}
                  onPress={() => updateReminder({ ...reminder, hour: h, minute: 30 })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                >
                  <Text style={[st.hourText, on && { color: colors.night }]}>{h} h 30</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <Body muted style={{ fontSize: 13 }}>{Platform.OS === 'web' ? 'Le rappel est disponible dans l’application iPhone et Android.' : 'Le rappel est programmé sur votre téléphone : aucune donnée n’est envoyée.'}</Body>
      </Card>

      {notice && <Notice tone={notice.tone} text={notice.text} />}
      {isDemo && <Notice text="Démonstration locale : exemples fictifs et données séparées. Aucun compte serveur ni envoi à l’IA." />}

      {user && (
        <Card>
          <Eyebrow>Mes données</Eyebrow>
          <OutlineButton
            label={isDemo ? 'Quitter et effacer la démo' : 'Me déconnecter'}
            disabled={busy}
            onPress={async () => {
              await runAccountAction(signOut, isDemo ? 'Démonstration effacée. Vos données personnelles sont conservées.' : 'Vous êtes déconnecté·e.');
            }}
          />
          <OutlineButton
            danger
            label={isDemo ? 'Effacer la démonstration' : 'Supprimer mon compte'}
            disabled={busy}
            onPress={async () => {
              const ok = await confirm(
                isDemo ? 'Effacer la démonstration ?' : 'Supprimer mon compte ?',
                isDemo ? 'Les exemples de démonstration seront effacés. Vos données personnelles ne seront pas modifiées.' : 'Cette demande supprime votre compte et vos rêves sur le serveur, puis efface les données locales et les audios de cet appareil. Les sauvegardes techniques peuvent suivre les délais de la politique de confidentialité.',
                'Supprimer',
              );
              if (!ok) return;
              await runAccountAction(deleteAccount, isDemo ? 'Démonstration effacée.' : 'Votre compte a été supprimé.');
            }}
          />
          <Body muted style={{ fontSize: 13 }}>
            Vous pouvez aussi écrire à contact@lecercle127.com pour exercer vos droits (accès, rectification, export).
          </Body>
        </Card>
      )}

      <Card>
        <Eyebrow>Sur cet appareil</Eyebrow>
        <Body muted>Efface les brouillons, le journal de vérification, les textes temporaires, le cache et les enregistrements locaux. Les rêves déjà synchronisés restent sur le serveur jusqu’à leur suppression depuis le Grimoire ou le compte.</Body>
        <OutlineButton danger disabled={busy} label="Effacer les données de cet appareil" onPress={async () => {
          if (await confirm('Effacer les données locales ?', isDemo ? 'Seules les données de démonstration seront effacées.' : 'Les brouillons non synchronisés et les enregistrements vocaux seront perdus. Les rêves du serveur sont conservés.', 'Effacer')) {
            await runAccountAction(clearLocalData, 'Données locales effacées.');
          }
        }} />
        <OutlineButton label="Confidentialité et services utilisés" onPress={() => router.push('/confidentialite')} />
      </Card>

      {lastError && (
        <Card>
          <Eyebrow>Dernière erreur (diagnostic)</Eyebrow>
          <Text selectable style={st.diag}>
            {lastError.at} · {lastError.fatal ? 'fatale' : 'non fatale'}
            {'\n'}
            {lastError.message}
            {'\n'}
            {lastError.stack.split('\n').slice(0, 6).join('\n')}
          </Text>
          <OutlineButton
            label="Effacer"
            onPress={async () => {
              await clearLastError();
              setLastError(null);
            }}
          />
        </Card>
      )}

      {webError && (
        <Card>
          <Eyebrow>Dernière erreur d’une page du site</Eyebrow>
          <Text selectable style={st.diag}>
            {webError.at} · {webError.page}
            {'\n'}
            {webError.message}
            {'\n'}
            {webError.source}
            {webError.line ? `:${webError.line}` : ''}
          </Text>
          <OutlineButton
            label="Effacer"
            onPress={async () => {
              await clearWebError();
              setWebError(null);
            }}
          />
        </Card>
      )}

      <Text style={st.version}>Le Cercle 127 · version {Constants.expoConfig?.version ?? '1.0.1'} · build {Constants.platform?.ios?.buildNumber ?? Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode ?? 'développement'}</Text>
      <SiteFooter />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  content: { padding: space.md, gap: space.lg, paddingBottom: 60 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  hours: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  hour: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 8 },
  hourOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  hourText: { fontFamily: fonts.bodyMedium, color: colors.text },
  diag: { fontFamily: fonts.body, fontSize: 11, lineHeight: 16, color: colors.muted },
  version: { fontFamily: fonts.body, color: colors.muted, textAlign: 'center', fontSize: 12 },
});
