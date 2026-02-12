import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import SpaceMono from '../assets/fonts/SpaceMono-Regular.ttf';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppProviders } from '@/components/AppProviders';
import { GlobalUpdateModal } from '@/components/GlobalUpdateModal';
import { Toast } from '@/components/Toast';
import { UpdateInfo, UpdateSettings } from '@/services/UpdateService';
import { useUpdate } from '@/context/UpdateContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono,
  });

  // Stato per passare le props della UI globale fuori da AppProviders
  const [globalUIProps, setGlobalUIProps] = useState<{
    showModal: boolean;
    hideModal: () => void;
    lastUpdateInfo: UpdateInfo | null;
    settings: UpdateSettings;
    toast: { message: string; type: 'success' | 'error' } | null;
    onDismissToast: () => void;
  } | null>(null);

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
        <UpdateUIPropsProvider setGlobalUIProps={setGlobalUIProps}>
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
        </UpdateUIPropsProvider>
      </AppProviders>

      {/* UI Globale sita fuori dalla gerarchia delle tab per stare sopra tutto */}
      {globalUIProps && (
        <>
          <GlobalUpdateModal
            showModal={globalUIProps.showModal}
            hideModal={globalUIProps.hideModal}
            lastUpdateInfo={globalUIProps.lastUpdateInfo}
            settings={globalUIProps.settings}
          />
          {globalUIProps.toast && (
            <Toast
              message={globalUIProps.toast.message}
              type={globalUIProps.toast.type}
              visible={!!globalUIProps.toast}
              onDismiss={globalUIProps.onDismissToast}
            />
          )}
        </>
      )}
    </ThemeProvider>
  );
}

// Provider per passare le props della UI globale fuori da AppProviders
function UpdateUIPropsProvider({
  children,
  setGlobalUIProps
}: {
  children: React.ReactNode;
  setGlobalUIProps: (props: {
    showModal: boolean;
    hideModal: () => void;
    lastUpdateInfo: UpdateInfo | null;
    settings: UpdateSettings;
    toast: { message: string; type: 'success' | 'error' } | null;
    onDismissToast: () => void;
  } | null) => void;
}) {
  const {
    showModal,
    hideModal,
    lastUpdateInfo,
    settings,
    toast,
    hideToast
  } = useUpdate();

  useEffect(() => {
    setGlobalUIProps({
      showModal,
      hideModal,
      lastUpdateInfo,
      settings,
      toast,
      onDismissToast: hideToast
    });

    // Per pulizia, aggiungiamo un modo per resettare l'UI quando il toast scade
  }, [showModal, hideModal, lastUpdateInfo, settings, toast, hideToast, setGlobalUIProps]);

  return <>{children}</>;
}
