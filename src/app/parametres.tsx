import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen, Title } from '../components/ui';
import { LANGUAGES, t } from '../i18n';
import { useLanguage } from '../i18n/provider';
import { readWebError } from '../lib/crash';
import { useSession } from '../lib/session';
import { colors, fonts, radius, space } from '../lib/theme';

function Row({ icon, tint, title, subtitle, danger, onPress }: { icon: string; tint: string; title: string; subtitle?: string; danger?: boolean; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [st.row, pressed && { opacity: 0.7 }]} onPress={onPress} accessibilityRole="button" accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}>
      <View style={[st.icon, { backgroundColor: tint }]}>
        <Text style={st.iconText}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[st.title, danger && { color: colors.danger }]}>{title}</Text>
        {subtitle ? <Text style={st.subtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={st.chevron}>›</Text>
    </Pressable>
  );
}

// Paramètres : langue, compte et informations, au style du Cercle 127.
export default function Parametres() {
  const { user } = useSession();
  const { lang, setLang } = useLanguage();
  const [choosing, setChoosing] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  const version = Constants.expoConfig?.version ?? '';

  const report = async () => {
    const err = await readWebError().catch(() => undefined);
    const body = `${t('Décrivez le problème ici :')}\n\n\n— Le Cercle 127 ${version}${err ? `\n${err.message} (${err.page})` : ''}`;
    Linking.openURL(`mailto:contact@lecercle127.com?subject=${encodeURIComponent(t('Signaler un problème'))}&body=${encodeURIComponent(body)}`).catch(() => undefined);
  };
  const open = (path: string, title: string) => router.push({ pathname: '/page', params: { path, title } });

  return (
    <Screen>
      <Title>{t('Paramètres')}</Title>

      <Text style={st.section}>{t('Préférences')}</Text>
      <View style={st.group}>
        <Row icon={current.flag} tint="rgba(255,255,255,0.08)" title={current.label} subtitle={t('Langue')} onPress={() => setChoosing((v) => !v)} />
        {choosing &&
          LANGUAGES.map((l) => (
            <Pressable key={l.code} style={st.lang} onPress={() => setLang(l.code)} accessibilityRole="radio" accessibilityState={{ checked: l.code === lang }} accessibilityLabel={l.label}>
              <Text style={st.langFlag}>{l.flag}</Text>
              <Text style={[st.title, { flex: 1 }]}>{l.label}</Text>
              {l.code === lang ? <Text style={{ color: colors.gold, fontSize: 18 }}>✓</Text> : null}
            </Pressable>
          ))}
        <Row icon="☾" tint="#a9c2f7" title={t('Rappel du matin')} subtitle={t('Une notification douce au réveil')} onPress={() => router.push('/compte')} />
      </View>

      <Text style={st.section}>{t('Compte')}</Text>
      <View style={st.group}>
        {user ? (
          <Row icon="◐" tint="#f2dea8" title={t('Mon compte')} subtitle={user.name} onPress={() => router.push('/compte')} />
        ) : (
          <Row icon="◐" tint="#f2dea8" title={t('Se connecter')} subtitle={t('Retrouver mon Grimoire partout')} onPress={() => router.push('/connexion')} />
        )}
        {user ? <Row icon="✕" tint="#e48a8a" title={t('Supprimer mon compte')} danger onPress={() => router.push('/compte')} /> : null}
      </View>

      <Text style={st.section}>{t('À propos')}</Text>
      <View style={st.group}>
        <Row icon="?" tint="#d9cdfb" title={t('Comment ça marche')} subtitle={t('Noter, relire, voir ce qui revient')} onPress={() => router.push('/explorer')} />
        <Row icon="✉" tint="#eb9a68" title={t('Signaler un problème')} onPress={report} />
        <Row icon="◎" tint="#8fdad3" title="lecercle127.com" onPress={() => WebBrowser.openBrowserAsync('https://lecercle127.com/').catch(() => undefined)} />
        <Row icon="⚿" tint="#a9c98a" title={t('Confidentialité')} onPress={() => router.push('/confidentialite')} />
        <Row icon="§" tint="#f3f1fb" title={t('Mentions légales')} onPress={() => open('/mentions-legales/', t('Mentions légales'))} />
      </View>

      <Text style={st.version}>Le Cercle 127 · {version}</Text>
    </Screen>
  );
}

const st = StyleSheet.create({
  section: { fontFamily: fonts.title, fontSize: 24, color: colors.gold, marginTop: space.sm },
  group: { borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: colors.surface, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14, paddingHorizontal: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 20, color: '#1b1730' },
  title: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  chevron: { color: colors.muted, fontSize: 22 },
  lang: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 12, paddingHorizontal: space.lg, backgroundColor: 'rgba(216,182,107,0.05)', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  langFlag: { fontSize: 22 },
  version: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: space.md },
});
