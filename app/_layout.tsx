import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import SpaceMono from '../assets/fonts/SpaceMono-Regular.ttf';
import { ThemeProvider } from '@/context/ThemeContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { AuthProvider } from '@/context/AuthContext';
import { ProductProvider } from '@/context/ProductContext';
import { CategoryProvider } from '@/context/CategoryContext';
import { ManualEntryProvider } from '@/context/ManualEntryContext';

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
      <AuthProvider>
        <SettingsProvider>
          <ProductProvider>
            <CategoryProvider>
              <ManualEntryProvider>
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
              </ManualEntryProvider>
            </CategoryProvider>
          </ProductProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
