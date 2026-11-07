import { CormorantGaramond_500Medium, CormorantGaramond_500Medium_Italic } from '@expo-google-fonts/cormorant-garamond';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { installCrashGuard } from '../lib/crash';
import { SessionProvider, useSession } from '../lib/session';
import { colors, fonts } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
installCrashGuard();

// Une erreur d'affichage montre cet écran au lieu de fermer l'application.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
      <Text style={{ color: colors.gold, fontSize: 40 }}>☾</Text>
      <Text style={{ color: colors.text, fontSize: 18, textAlign: 'center' }}>Une erreur est survenue.</Text>
      <Text selectable style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>
        {error.message}
      </Text>
      <Pressable
        onPress={retry}
        accessibilityRole="button"
        style={{ backgroundColor: '#e8cf8f', borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14 }}
      >
        <Text style={{ color: '#1b1730', fontSize: 16 }}>Réessayer</Text>
      </Pressable>
    </View>
  );
}

function Root() {
  const { ready } = useSession();
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_500Medium_Italic,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
  });
  const loaded = ready && (fontsLoaded || Boolean(fontError));

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => undefined);
  }, [loaded]);

  // Un toucher sur le rappel du matin ouvre directement l'écran « Rêve ».
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener(() => router.navigate('/reve'));
    return () => sub.remove();
  }, []);

  if (!loaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.night },
          headerTintColor: colors.gold,
          headerTitleStyle: { fontFamily: fonts.title, color: colors.text, fontSize: 21 },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.night },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="menu" options={{ title: 'Menu', presentation: 'modal' }} />
        <Stack.Screen name="page" options={{ title: '' }} />
        <Stack.Screen name="connexion" options={{ title: 'Mon Grimoire', presentation: 'modal' }} />
        <Stack.Screen name="compte" options={{ title: 'Mon compte' }} />
        <Stack.Screen name="carnet-vocal" options={{ title: 'Carnet vocal', headerShown: false }} />
        <Stack.Screen name="parcours" options={{ title: 'Mon parcours onirique', headerShown: false }} />
        <Stack.Screen name="soeurs" options={{ title: 'Le Cercle des 7 Sœurs', headerShown: false }} />
        <Stack.Screen name="journal" options={{ title: 'Mon journal', headerShown: false }} />
        <Stack.Screen name="confidentialite" options={{ title: 'Confidentialité', headerShown: false }} />
        <Stack.Screen name="reve/[id]" options={{ title: 'Mon rêve' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <Root />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
