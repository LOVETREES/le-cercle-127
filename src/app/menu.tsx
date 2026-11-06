import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Eyebrow, LinkRow, SiteFooter } from '../components/ui';
import { EXPLORE, LEARN, SISTERS } from '../lib/content';
import { useSession } from '../lib/session';
import { colors, space } from '../lib/theme';

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
      <Eyebrow>Mon Grimoire</Eyebrow>
      <View style={st.group}>
        <LinkRow icon="❖" title="Mon Grimoire" onPress={() => tab('/grimoire')} />
        <LinkRow icon="☾" title="Raconter un rêve" onPress={() => tab('/reve')} />
        <LinkRow
          icon="◐"
          title={user ? `Mon compte · ${user.name}` : 'Se connecter'}
          onPress={() => {
            router.back();
            router.push(user ? '/compte' : '/connexion');
          }}
        />
      </View>

      <Eyebrow>Rêve lucide</Eyebrow>
      <View style={st.group}>
        {LEARN.map((l) => (
          <LinkRow key={l.path} icon={l.icon} title={l.title} onPress={() => go(l.path, l.title)} />
        ))}
      </View>

      <Eyebrow>Le Cercle des 7 Sœurs</Eyebrow>
      <View style={st.group}>
        {SISTERS.map((s) => (
          <LinkRow key={s.slug} title={s.name} subtitle={s.role} onPress={() => go(s.path, s.name)} />
        ))}
      </View>

      <Eyebrow>Ressources</Eyebrow>
      <View style={st.group}>
        <LinkRow icon="✦" title="Dictionnaire des symboles" onPress={() => tab('/symboles')} />
        <LinkRow icon="✧" title="Oracle 127" onPress={() => tab('/oracle')} />
        {EXPLORE.map((e) => (
          <LinkRow key={e.path} icon={e.icon} title={e.title} onPress={() => go(e.path, e.title)} />
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
