import '@react-native-firebase/analytics'; // Import to initialize Firebase Analytics
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
import { NotificationService } from '@/services/NotificationService';
import { StorageService } from '@/services/StorageService'; // Import StorageService
import { ThemeProvider, useTheme } from '../context/ThemeContext'; // Import ThemeProvider and useTheme
import '@/services/firebaseConfig'; // Import for side effects (initialization)

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
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const requestNotifPermissions = async () => {
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        console.log('Notification permissions granted.');
        // Sync notifications for existing active products
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
        // Optionally, inform the user that notifications will not work
      }
    };
    requestNotifPermissions();
    
    // Listener for app state changes to re-sync notifications when app comes to foreground
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

  // Inner component to access theme context after ThemeProvider is set up
  const AppContent = () => {
    const { isDarkMode } = useTheme();
    const theme = isDarkMode ? DarkTheme : DefaultTheme;

    return (
      <NavThemeProvider value={theme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      </NavThemeProvider>
    );
  };

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
