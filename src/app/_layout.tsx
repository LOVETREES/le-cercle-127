import { CormorantGaramond_500Medium, CormorantGaramond_500Medium_Italic } from '@expo-google-fonts/cormorant-garamond';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider, useSession } from '../lib/session';
import { colors, fonts } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

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
