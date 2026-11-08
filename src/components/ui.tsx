import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DISCLAIMER, IMAGES, LEGAL } from '../lib/content';
import { colors, fonts, radius, space } from '../lib/theme';
import { useSession } from '../lib/session';
import { t } from '../i18n';

/** En-tête repris du site mobile : logo, « Onirologue », bouton menu. */
export function AppHeader() {
  const { isDemo } = useSession();
  return (
    <View style={s.header}>
      <Pressable
        style={s.brand}
        accessibilityRole="button"
        accessibilityLabel="Accueil"
        onPress={() => router.navigate('/')}
      >
        <Image source={IMAGES.logo} style={s.logo} />
        <View>
          <Text style={s.brandText}>Onirologue</Text>
          {isDemo && <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.gold }}>{t('Démonstration locale')}</Text>}
        </View>
      </Pressable>
      <Pressable
        style={[s.menuBtn, { marginLeft: 'auto', marginRight: 10 }]}
        accessibilityRole="button"
        accessibilityLabel={t('Paramètres')}
        onPress={() => router.push('/parametres')}
        hitSlop={8}
      >
        <Text style={{ fontSize: 20, color: colors.text }}>⚙︎</Text>
      </Pressable>
      <Pressable
        style={s.menuBtn}
        accessibilityRole="button"
        accessibilityLabel={t('Ouvrir le menu')}
        onPress={() => router.push('/menu')}
        hitSlop={8}
      >
        <View style={s.menuLine} />
        <View style={s.menuLine} />
        <View style={s.menuLine} />
      </Pressable>
    </View>
  );
}

export function Screen({ children, scroll = true, header = true }: { children: ReactNode; scroll?: boolean; header?: boolean }) {
  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {header && <AppHeader />}
      {scroll ? (
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Eyebrow({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Text style={s.eyebrow}>{children}</Text>
    </View>
  );
}

export function Title({ children, size = 30 }: { children: ReactNode; size?: number }) {
  return (
    <Text style={[s.title, { fontSize: size, lineHeight: size * 1.15 }]} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: object }) {
  return <Text style={[s.body, muted && { color: colors.muted }, style]}>{children}</Text>;
}

export function GoldButton({ label, onPress, loading, disabled }: { label: string; onPress: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [s.gold, (pressed || disabled) && { opacity: 0.75 }]}
    >
      {loading ? <ActivityIndicator color={colors.night} /> : <Text style={s.goldText}>{label}</Text>}
    </Pressable>
  );
}

export function OutlineButton({ label, onPress, danger, disabled }: { label: string; onPress: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.outline, danger && { borderColor: colors.danger }, (pressed || disabled) && { opacity: 0.7 }]}
    >
      <Text style={[s.outlineText, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function LinkRow({ icon, title, subtitle, onPress }: { icon?: string; title: string; subtitle?: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      onPress={onPress}
      style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
    >
      {icon ? (
        <View style={s.rowIcon}>
          <Text style={s.rowIconText}>{icon}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        {subtitle ? <Text style={s.rowSub}>{subtitle}</Text> : null}
      </View>
      <Text style={s.chevron}>›</Text>
    </Pressable>
  );
}

export function Field({ label, required, ...props }: TextInputProps & { label: string; required?: boolean }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={s.label}>{label}</Text>
      {required ? (
        <View style={s.required}>
          <Text style={s.requiredText}>Obligatoire</Text>
        </View>
      ) : null}
      <TextInput
        placeholderTextColor="#6f7090"
        accessibilityLabel={label}
        {...props}
        style={[s.input, props.multiline && { minHeight: 180, textAlignVertical: 'top' }, props.style]}
      />
    </View>
  );
}

export function Notice({ text, tone = 'info' }: { text: string; tone?: 'info' | 'error' | 'success' }) {
  const c = tone === 'error' ? colors.danger : tone === 'success' ? colors.success : colors.gold;
  return (
    <View style={[s.notice, { borderLeftColor: c }]} accessibilityLiveRegion="polite">
      <Text style={s.body}>{text}</Text>
    </View>
  );
}

export function SiteFooter() {
  return (
    <View style={s.footer}>
      <View style={s.footerLinks}>
        {LEGAL.map((l) => (
          <Pressable
            key={l.path}
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/page', params: { path: l.path, title: t(l.title) } })}
          >
            <Text style={s.footerLink}>{t(l.title)}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.footerNote}>{t(DISCLAIMER)}</Text>
      <Text style={s.footerCopy}>{t('© 2026 L’Onirologue — Le Cercle des 7 Sœurs')}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night },
  content: { padding: space.md, paddingBottom: 120, gap: space.lg },
  header: {
    height: 60,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(216,182,107,0.35)',
    backgroundColor: colors.night,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.gold },
  brandText: { fontFamily: fonts.title, fontSize: 24, color: colors.text, letterSpacing: 1 },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  menuLine: { width: 18, height: 2, borderRadius: 1, backgroundColor: colors.text },
  eyebrow: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2.5, color: colors.muted, textTransform: 'uppercase' },
  title: { fontFamily: fonts.title, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.text },
  gold: {
    minHeight: 56,
    borderRadius: radius.pill,
    backgroundColor: '#e8cf8f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  goldText: { fontFamily: fonts.title, fontSize: 21, color: '#1b1730' },
  outline: {
    minHeight: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  outlineText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.gold },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: space.md,
    gap: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surface,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconText: { color: colors.text, fontSize: 16 },
  rowTitle: { fontFamily: fonts.title, fontSize: 19, color: colors.text },
  rowSub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
  chevron: { color: colors.text, fontSize: 22 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.text },
  required: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(216,182,107,0.6)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  requiredText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.gold },
  input: {
    minHeight: 50,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(170,160,230,0.45)',
    backgroundColor: '#0d1124',
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notice: {
    borderLeftWidth: 3,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: space.md,
  },
  footer: { paddingTop: space.lg, gap: space.md, alignItems: 'center' },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md },
  footerLink: { fontFamily: fonts.body, fontSize: 13, color: colors.gold },
  footerNote: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text, textAlign: 'center' },
  footerCopy: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
});
