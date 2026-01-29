import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import SpaceMono from '../assets/fonts/SpaceMono-Regular.ttf';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppProviders } from '@/components/AppProviders';
import { GlobalUpdateModal } from '@/components/GlobalUpdateModal';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AppProviders>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="password-reset-form" options={{ headerShown: false }} />
          <Stack.Screen name="scanner" options={{ headerShown: false }} />
          <Stack.Screen name="photo-capture" options={{ headerShown: false }} />
          <Stack.Screen name="manual-entry" options={{ headerShown: false }} />
          <Stack.Screen name="history-detail" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="manage-categories" options={{ headerShown: false }} />
          <Stack.Screen name="feedback" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
        <GlobalUpdateModal />
      </AppProviders>
    </ThemeProvider>
  );
}
