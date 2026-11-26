import { router } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Eyebrow, LinkRow, SiteFooter } from '../components/ui';
import { EXPLORE, LEARN } from '../lib/content';
import { useSession } from '../lib/session';
import { colors, space } from '../lib/theme';
import { t } from '../i18n';

// Menu simplifié (21/11/2026) : seulement ce que la barre du bas ne propose pas déjà.
// Grimoire, Rêve, Oracle et Symboles sont dans la barre du bas. Les Sœurs sont réunies sur la page
// « Le Cercle des 7 Sœurs » (Explorer). Paramètres regroupe langue, compte, rappel du matin et aide.
// Sanctuaire Framework 127 : recette locale uniquement (Docker sur le Mac de développement).
// Visible en développement, ou dans une compilation locale avec EXPO_PUBLIC_F127_RECETTE=1.
// Jamais dans les versions EAS / TestFlight : localhost n'existe pas sur le téléphone d'un utilisateur.
const F127_RECETTE = __DEV__ || process.env.EXPO_PUBLIC_F127_RECETTE === '1';
const SANCTUAIRE_RECETTE = 'http://localhost:8083/?f127_sanctuaire=1';

export default function Menu() {
  const { user } = useSession();
  const go = (path: string, title: string) => {
    router.back();
    router.push({ pathname: '/page', params: { path, title } });
  };

  return (
    <ScrollView style={{ backgroundColor: colors.night }} contentContainerStyle={st.content}>
      <Eyebrow>{t('Mon espace')}</Eyebrow>
      <View style={st.group}>
        <LinkRow
          icon="✧"
          title={t('Mes lectures')}
          subtitle={t('Mes rêves avec Oni · Ma main avec Terra')}
          onPress={() => {
            router.back();
            router.push('/mes-lectures');
          }}
        />
        <LinkRow
          icon="☾"
          title={t('Faisons connaissance')}
          subtitle={t('Ce qu’Oni sait de toi, pour mieux lire tes rêves')}
          onPress={() => {
            router.back();
            router.push('/connaissance');
          }}
        />
        {!user && (
          <LinkRow
            icon="◐"
            title={t('Se connecter')}
            onPress={() => {
              router.back();
              router.push('/connexion');
            }}
          />
        )}
        <LinkRow
          icon="⚙"
          title={t('Paramètres')}
          subtitle={t('Langue, compte, aide')}
          onPress={() => {
            router.back();
            router.push('/parametres');
          }}
        />
      </View>

      <Eyebrow>{t('Rêve lucide')}</Eyebrow>
      <View style={st.group}>
        {LEARN.map((l) => (
          <LinkRow key={l.path} icon={l.icon} title={t(l.title)} onPress={() => go(l.path, t(l.title))} />
        ))}
      </View>

      <Eyebrow>{t('Explorer')}</Eyebrow>
      <View style={st.group}>
        {EXPLORE.map((e) => (
          <LinkRow key={e.path} icon={e.icon} title={t(e.title)} onPress={() => go(e.path, t(e.title))} />
        ))}
      </View>
      {F127_RECETTE && (
        <>
          <Eyebrow>Recette · Framework 127</Eyebrow>
          <View style={st.group}>
            <LinkRow
              icon="✦"
              title="Sanctuaire des Sept Sœurs"
              subtitle="Recette locale sur ce Mac (Docker, mode observe)"
              onPress={() => {
                router.back();
                void Linking.openURL(SANCTUAIRE_RECETTE);
              }}
            />
          </View>
        </>
      )}
      <Text style={{ height: space.md }} />
      <SiteFooter />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  content: { padding: space.md, paddingBottom: 60, gap: space.md },
  group: { gap: space.sm },
});
