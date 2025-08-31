// Importa il modulo di ambiente test per primo per assicurare che venga eseguito subito.
import '../services/test-env';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { useFonts } from 'expo-font';
import { LoggingService } from '@/services/LoggingService';
import { SettingsProvider } from '@/context/SettingsContext';
import { AuthProvider } from '@/context/AuthContext';
import { ProductProvider } from '@/context/ProductContext';
import { CategoryProvider } from '@/context/CategoryContext';
import { ManualEntryProvider } from '@/context/ManualEntryContext';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Inizializza il logging
        LoggingService.info('RootLayout', 'App initialization started');
        
        // Attendi che i font siano caricati
        if (fontsLoaded) {
          LoggingService.info('RootLayout', 'Fonts loaded successfully');
          setIsReady(true);
          await SplashScreen.hideAsync();
        }
      } catch (error) {
        LoggingService.error('RootLayout', 'Error during app initialization', error);
        // Nascondi comunque lo splash screen in caso di errore
        await SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, [fontsLoaded]);

  if (!isReady) {
    // Lo splash screen rimane visibile finché non siamo pronti
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
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="login" options={{ headerShown: false }} />
                  <Stack.Screen name="signup" options={{ headerShown: false }} />
                  <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
                  <Stack.Screen name="password-reset-form" options={{ headerShown: false }} />
                  <Stack.Screen name="product-detail" options={{ headerShown: false }} />
                  <Stack.Screen name="scanner" options={{ headerShown: false }} />
                  <Stack.Screen name="photo-capture" options={{ headerShown: false }} />
                  <Stack.Screen name="manual-entry" options={{ headerShown: false }} />
                  <Stack.Screen name="history-detail" options={{ headerShown: false }} />
                  <Stack.Screen name="profile" options={{ headerShown: false }} />
                  <Stack.Screen name="manage-categories" options={{ headerShown: false }} />
                  <Stack.Screen name="feedback" options={{ headerShown: false }} />
                  <Stack.Screen name="email-sent" options={{ headerShown: false }} />
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
