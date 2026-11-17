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
        <Body muted>{t('Vous venez de traverser un moment difficile. Prenez le temps dont vous avez besoin : vous n’avez rien à interpréter tout de suite.')}</Body>
      </View>
      <Card style={{ gap: space.md }}>
        <Title size={24}>{t('Un instant pour vous')}</Title>
        <Body>{t('Regardez autour de vous et nommez quelques objets que vous reconnaissez.')}</Body>
        <Body>{t('Si cela vous convient, posez les pieds au sol ou sentez un appui sous votre corps.')}</Body>
        <Body>{t('Laissez votre respiration trouver son rythme, sans la forcer.')}</Body>
      </Card>
      <GoldButton label={t('Raconter mon rêve')} onPress={() => router.navigate('/reve')} />
      <OutlineButton label={t('Cauchemar : comprendre et s’apaiser')} onPress={() => router.push({ pathname: '/page', params: { path: '/cauchemar-comprendre-et-sapaiser-lonirologue/', title: t('Cauchemar : comprendre et s’apaiser') } })} />
      <OutlineButton label={t('Retour à l’accueil')} onPress={() => router.navigate('/')} />
    </Screen>
  );
}
