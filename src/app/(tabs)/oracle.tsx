import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { SitePage } from '../../components/SitePage';
import { Screen } from '../../components/ui';
import { FEATURES } from '../../lib/features';
import { colors, fonts, radius, space } from '../../lib/theme';
import { t } from '../../i18n';

export default function Oracle() {
  return (
    <Screen scroll={false}>
      {FEATURES.oracleNatif ? (
        <Pressable onPress={() => router.push('/oracle-natif')} style={st.try} accessibilityRole="link">
          <Text style={st.tryT}>{t('✦ Essayer le nouvel Oracle')}</Text>
          <Text style={st.tryS}>{t('Le cercle vivant des Sept Sœurs ›')}</Text>
        </Pressable>
      ) : null}
      <SitePage path="/oracle-127/" />
    </Screen>
  );
}

const st = StyleSheet.create({
  try: { marginHorizontal: space.md, marginTop: space.sm, marginBottom: space.xs, paddingVertical: 10, paddingHorizontal: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(216,182,107,0.55)', backgroundColor: '#14132b' },
  tryT: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.gold },
  tryS: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
});
