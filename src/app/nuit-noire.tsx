import { router } from 'expo-router';
import { View } from 'react-native';

import { Body, Card, Eyebrow, GoldButton, OutlineButton, Screen, Title } from '../components/ui';
import { space } from '../lib/theme';
import { t } from '../i18n';

export default function NuitNoire() {
  return (
    <Screen>
      <View style={{ gap: space.sm }}>
        <Eyebrow>{t('NUIT NOIRE · APRÈS UN CAUCHEMAR')}</Eyebrow>
        <Title>{t('Revenir doucement au présent')}</Title>
        <Body muted>{t('Tu viens de traverser un moment difficile. Prends le temps dont tu as besoin : tu n’as rien à interpréter tout de suite.')}</Body>
      </View>
      <Card style={{ gap: space.md }}>
        <Title size={24}>{t('Un instant pour toi')}</Title>
        <Body>{t('Regarde autour de toi et nomme quelques objets que tu reconnais.')}</Body>
        <Body>{t('Si cela te convient, pose les pieds au sol ou sens un appui sous ton corps.')}</Body>
        <Body>{t('Laisse ta respiration trouver son rythme, sans la forcer.')}</Body>
      </Card>
      <GoldButton label={t('Raconter mon rêve')} onPress={() => router.navigate('/reve')} />
      <OutlineButton label={t('Cauchemar : comprendre et s’apaiser')} onPress={() => router.push({ pathname: '/page', params: { path: '/cauchemar-comprendre-et-sapaiser-lonirologue/', title: t('Cauchemar : comprendre et s’apaiser') } })} />
      <OutlineButton label={t('Retour à l’accueil')} onPress={() => router.navigate('/')} />
    </Screen>
  );
}
