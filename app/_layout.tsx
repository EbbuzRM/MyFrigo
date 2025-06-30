import 'react-native-url-polyfill/auto';
import { useEffect } from 'react';
import { ThemeProvider as NavThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { Platform, AppState } from 'react-native';
import { NotificationService } from '@/services/NotificationService';
import { StorageService } from '@/services/StorageService';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import '@/services/firebaseConfig';
import '@/services/backgroundSync';
import * as BackgroundTask from 'expo-background-task';

const BACKGROUND_SYNC_TASK = 'background-sync';

const MyDefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007bff',
    background: '#ffffff',
    card: '#ffffff',
    text: '#212529',
    border: '#e9ecef',
    notification: '#dc3545',
  },
};

const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#007bff',
    background: '#121212',
    card: '#1e1e1e',
    text: '#ffffff',
    border: '#272727',
    notification: '#dc3545',
  },
};

async function registerBackgroundTask() {
  try {
    await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 60 * 15, // 15 minutes
    });
    console.log('Background sync task registered');
  } catch (error) {
    console.error('Failed to register background sync task:', error);
  }
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    registerBackgroundTask();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        // Ricarica l'app quando ritorna in primo piano
        if (Platform.OS !== 'web') {
          Updates.reloadAsync();
        }
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const requestNotifPermissions = async () => {
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        console.log('Notification permissions granted.');
        const syncNotifications = async () => {
          try {
            const settings = await StorageService.getSettings();
            if (settings.notificationsEnabled) {
              const products = await StorageService.getProducts();
              const activeProducts = products.filter(p => p.status === 'active');
              await NotificationService.scheduleMultipleNotifications(activeProducts, settings);
              console.log('Initial notification sync complete for active products.');
            }
          } catch (error) {
            console.error("Error during initial notification sync:", error);
          }
        };
        syncNotifications();
      } else {
        console.log('Notification permissions denied.');
      }
    };
    requestNotifPermissions();
    
    const AppState = require('react-native').AppState;
    const subscription = AppState.addEventListener('change', async (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('App has come to the foreground, re-syncing notifications.');
        try {
          const settings = await StorageService.getSettings();
          if (settings.notificationsEnabled) {
            const products = await StorageService.getProducts();
            const activeProducts = products.filter(p => p.status === 'active');
            await NotificationService.scheduleMultipleNotifications(activeProducts, settings);
            console.log('Foreground notification sync complete.');
          }
        } catch (error) {
          console.error("Error during foreground notification sync:", error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? MyDarkTheme : MyDefaultTheme;

  return (
    <NavThemeProvider value={theme}>
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: {
          backgroundColor: isDarkMode ? '#0d1117' : '#ffffff'
        }
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}
