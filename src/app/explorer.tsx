import { router } from 'expo-router';
import { View } from 'react-native';

import { Body, Eyebrow, LinkRow, OutlineButton, Screen, Title } from '../components/ui';
import { EXPLORE, LEARN } from '../lib/content';
import { space } from '../lib/theme';

const openPage = (path: string, title: string) => router.push({ pathname: '/page', params: { path, title } });

// Ressources du Cercle 127, sorties de l'accueil pour l'alléger.
export default function Explorer() {
  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <Eyebrow>Le Cercle 127</Eyebrow>
        <Title>Apprendre et explorer</Title>
        <Body muted>Des pratiques et des parcours pour aller plus loin, à votre rythme.</Body>
      </View>
      <Eyebrow>Apprendre</Eyebrow>
      <View style={{ gap: space.sm }}>
        {LEARN.map((l) => (
          <LinkRow key={l.path} icon={l.icon} title={l.title} subtitle={l.subtitle} onPress={() => (l.path === '/carnet-vocal/' ? router.push('/carnet-vocal') : openPage(l.path, l.title))} />
        ))}
      </View>
      <Eyebrow>Explorer</Eyebrow>
      <View style={{ gap: space.sm }}>
        {EXPLORE.map((e) => (
          <LinkRow key={e.path} icon={e.icon} title={e.title} subtitle={e.subtitle} onPress={() => openPage(e.path, e.title)} />
        ))}
      </View>
      <OutlineButton label="Retour à l’accueil" onPress={() => router.navigate('/')} />
    </Screen>
  );
}
