import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Eyebrow, LinkRow, SiteFooter } from '../components/ui';
import { EXPLORE, LEARN, SISTERS } from '../lib/content';
import { useSession } from '../lib/session';
import { colors, space } from '../lib/theme';
import { t } from '../i18n';

// Reprend le menu du site mobile (Mon Grimoire, Rêve lucide, Le Cercle des 7 Sœurs, Ressources).
export default function Menu() {
  const { user } = useSession();
  const go = (path: string, title: string) => {
    router.back();
    router.push({ pathname: '/page', params: { path, title } });
  };
  const tab = (to: '/grimoire' | '/reve' | '/symboles' | '/oracle') => {
    router.back();
    router.navigate(to);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.night }} contentContainerStyle={st.content}>
      <Eyebrow>{t('Mon Grimoire')}</Eyebrow>
      <View style={st.group}>
        <LinkRow icon="❖" title={t('Mon Grimoire')} onPress={() => tab('/grimoire')} />
        <LinkRow icon="☾" title={t('Raconter un rêve')} onPress={() => tab('/reve')} />
        <LinkRow
          icon="✧"
          title={t('Mes lectures')}
          subtitle={t('Mes rêves avec Oni · Ma main avec Terra')}
          onPress={() => {
            router.back();
            router.push('/mes-lectures');
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
        <LinkRow
          icon="⚙"
          title={user ? t('Mon compte · {v0}', { v0: user.name }) : t('Réglages')}
          subtitle={t('Rappel du matin, données, diagnostic')}
          onPress={() => {
            router.back();
            router.push('/compte');
          }}
        />
      </View>

      <Eyebrow>{t('Rêve lucide')}</Eyebrow>
      <View style={st.group}>
        {LEARN.map((l) => (
          <LinkRow key={l.path} icon={l.icon} title={t(l.title)} onPress={() => go(l.path, t(l.title))} />
        ))}
      </View>

      <Eyebrow>{t('Le Cercle des 7 Sœurs')}</Eyebrow>
      <View style={st.group}>
        {SISTERS.map((s) => (
          <LinkRow key={s.slug} title={s.name} subtitle={t(s.role)} onPress={() => go(s.path, s.name)} />
        ))}
      </View>

      <Eyebrow>Ressources</Eyebrow>
      <View style={st.group}>
        <LinkRow icon="✦" title={t('Dictionnaire des symboles')} onPress={() => tab('/symboles')} />
        <LinkRow icon="✧" title={t('Oracle 127')} onPress={() => tab('/oracle')} />
        {EXPLORE.map((e) => (
          <LinkRow key={e.path} icon={e.icon} title={t(e.title)} onPress={() => go(e.path, t(e.title))} />
        ))}
      </View>
      <Text style={{ height: space.md }} />
      <SiteFooter />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  content: { padding: space.md, paddingBottom: 60, gap: space.md },
  group: { gap: space.sm },
});
