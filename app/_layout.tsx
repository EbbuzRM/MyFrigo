import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import SpaceMono from '../assets/fonts/SpaceMono-Regular.ttf';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppProviders } from '@/components/AppProviders';
import { GlobalUpdateModal } from '@/components/GlobalUpdateModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toast } from '@/components/Toast';
import { useUpdate } from '@/context/UpdateContext';
import { LoggingService } from '@/services/LoggingService';

/**
 * Componente interno che gestisce il modal degli aggiornamenti.
 * Deve essere renderizzato dentro <AppProviders> (dove si trova UpdateProvider)
 * per poter chiamare useUpdate() correttamente.
 */
function UpdateModalManager() {
  const { showModal, hideModal, lastUpdateInfo, settings } = useUpdate();
  
  return (
    <GlobalUpdateModal
      showModal={showModal}
      hideModal={hideModal}
      lastUpdateInfo={lastUpdateInfo}
      settings={settings}
    />
  );
}

/**
 * Componente interno che gestisce il Toast globale.
 * Deve essere renderizzato dentro <AppProviders> (dove si trova UpdateProvider)
 * per poter chiamare useUpdate() correttamente.
 */
function ToastManager() {
  const { toast, hideToast } = useUpdate();

  return (
    <Toast
      message={toast?.message ?? ''}
      visible={!!toast}
      onDismiss={hideToast}
      type={toast?.type ?? 'success'}
    />
  );
}

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

  // BUG-11: Cleanup LoggingService timer on app unmount to prevent memory leak
  useEffect(() => {
    return () => {
      LoggingService.destroy();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
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
          <UpdateModalManager />
          <ToastManager />
        </AppProviders>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
