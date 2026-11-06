import { router, Tabs } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '../../lib/theme';

// Barre du bas identique au site mobile : Accueil · Oracle · Rêve (au centre) · Grimoire · Symboles.
// Icônes illustrées reprises de la barre de navigation du site.
const TABS: Record<string, { label: string; icon: ImageSourcePropType }> = {
  index: { label: 'Accueil', icon: require('../../../assets/images/nav-accueil.png') },
  oracle: { label: 'Oracle', icon: require('../../../assets/images/nav-oracle.png') },
  reve: { label: 'Rêve', icon: require('../../../assets/images/nav-reve.png') },
  grimoire: { label: 'Grimoire', icon: require('../../../assets/images/nav-grimoire.png') },
  symboles: { label: 'Symboles', icon: require('../../../assets/images/nav-symboles.png') },
};

type BarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
};

const PATHS: Record<string, '/' | '/oracle' | '/reve' | '/grimoire' | '/symboles'> = {
  index: '/',
  oracle: '/oracle',
  reve: '/reve',
  grimoire: '/grimoire',
  symboles: '/symboles',
};

function TabBar({ state }: BarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.bar, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === i;
        const center = route.name === 'reve';
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
            onPress={() => router.navigate(PATHS[route.name] ?? '/')}
            style={st.item}
          >
            {center ? (
              <View style={st.centerWrap}>
                <Image source={tab.icon} style={st.centerBtn} accessibilityIgnoresInvertColors />
              </View>
            ) : (
              <>
                {focused && <View style={st.indicator} />}
                <Image source={tab.icon} style={[st.icon, !focused && { opacity: 0.8 }]} accessibilityIgnoresInvertColors />
              </>
            )}
            <Text style={[st.label, focused && { color: colors.gold }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.night } }}
      tabBar={(props) => <TabBar {...(props as unknown as BarProps)} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="oracle" />
      <Tabs.Screen name="reve" />
      <Tabs.Screen name="grimoire" />
      <Tabs.Screen name="symboles" />
    </Tabs>
  );
}

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#0b0f22',
    borderTopWidth: 1,
    borderTopColor: 'rgba(216,182,107,0.25)',
    paddingTop: 8,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2, minHeight: 52 },
  indicator: { position: 'absolute', top: -8, width: 22, height: 2, backgroundColor: colors.gold, borderRadius: 1 },
  icon: { width: 30, height: 31 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 11, color: '#c9c3e8' },
  centerWrap: {
    marginTop: -30,
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(216,182,107,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtn: { width: 56, height: 56 },
});
