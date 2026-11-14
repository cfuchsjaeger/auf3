import { Silkscreen_400Regular, Silkscreen_700Bold } from '@expo-google-fonts/silkscreen';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { initSounds } from '@/feedback';
import { AccountProvider } from '@/state/account';
import { StoreProvider, useStore } from '@/state/store';
import { colors } from '@/ui/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Silkscreen_400Regular,
    Silkscreen_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    initSounds();
  }, []);

  return (
    <StoreProvider>
      <AccountProvider>
        <Gate fontsReady={fontsLoaded || !!fontError} />
      </AccountProvider>
    </StoreProvider>
  );
}

function Gate({ fontsReady }: { fontsReady: boolean }) {
  const { ready } = useStore();
  const show = fontsReady && ready;

  useEffect(() => {
    if (show) SplashScreen.hideAsync().catch(() => {});
  }, [show]);

  if (!show) return null;
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.ground },
          animation: 'fade',
          animationDuration: 120,
        }}
      />
    </>
  );
}
