import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

import { Body, Card, OutlineButton, Screen, Title } from '../components/ui';
import { SISTERS } from '../lib/content';
import { colors, fonts, space } from '../lib/theme';
import { t } from '../i18n';

export default function Soeurs() {
  return <Screen>
    <Title>{t('Le Cercle des 7 Sœurs')}</Title>
    <Body>{t('Sept regards, une même trame vivante. Choisissez la Sœur qui rejoint votre besoin du moment.')}</Body>
    {SISTERS.map((sister) => <Pressable key={sister.slug} accessibilityRole="button" accessibilityLabel={t('Découvrir {v0}', { v0: sister.name })} onPress={() => router.push({ pathname: '/page', params: { path: sister.path, title: sister.name } })}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Image source={sister.image} style={{ width: 74, height: 74, borderRadius: 37 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.gold, fontFamily: fonts.title, fontSize: 30 }}>{sister.name}</Text>
            <Body>{t(sister.role)}</Body>
          </View>
          <Text style={{ color: colors.gold, fontSize: 28 }}>›</Text>
        </View>
      </Card>
    </Pressable>)}
    <OutlineButton label={t('Retour à l’accueil')} onPress={() => router.navigate('/')} />
  </Screen>;
}
