import { router } from 'expo-router';
import { View } from 'react-native';

import { Body, Eyebrow, LinkRow, OutlineButton, Screen, Title } from '../components/ui';
import { EXPLORE, LEARN } from '../lib/content';
import { space } from '../lib/theme';
import { t } from '../i18n';

const openPage = (path: string, title: string) => router.push({ pathname: '/page', params: { path, title } });

// Ressources du Cercle 127, sorties de l'accueil pour l'alléger.
export default function Explorer() {
  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <Eyebrow>{t('Le Cercle 127')}</Eyebrow>
        <Title>{t('Apprendre et explorer')}</Title>
        <Body muted>{t('Des pratiques et des parcours pour aller plus loin, à votre rythme.')}</Body>
      </View>
      <Eyebrow>Apprendre</Eyebrow>
      <View style={{ gap: space.sm }}>
        {LEARN.map((l) => (
          <LinkRow key={l.path} icon={l.icon} title={t(l.title)} subtitle={t(l.subtitle)} onPress={() => (l.path === '/carnet-vocal/' ? router.push('/carnet-vocal') : openPage(l.path, t(l.title)))} />
        ))}
      </View>
      <Eyebrow>Explorer</Eyebrow>
      <View style={{ gap: space.sm }}>
        {EXPLORE.map((e) => (
          <LinkRow key={e.path} icon={e.icon} title={t(e.title)} subtitle={t(e.subtitle)} onPress={() => openPage(e.path, t(e.title))} />
        ))}
      </View>
      <OutlineButton label={t('Retour à l’accueil')} onPress={() => router.navigate('/')} />
    </Screen>
  );
}
