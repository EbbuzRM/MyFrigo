import 'react-native-url-polyfill/auto';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ThemeProvider as NavThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { CategoryProvider } from '@/context/CategoryContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ProductProvider } from '@/context/ProductContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { NotificationService } from '@/services/NotificationService';
import * as Progress from 'react-native-progress';



import { registerBackgroundFetchAsync } from '@/services/backgroundSync';

SplashScreen.preventAutoHideAsync();

function NavigationController() {
  const { session, loading, profile } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const isReady = useFrameworkReady();

  useEffect(() => {
    if (!isReady || loading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (session && profile?.first_name && !inAuthGroup) {
      router.replace('/(tabs)');
    } else if (session && !profile?.first_name && segments[1] !== 'complete-profile') {
      router.replace('/complete-profile');
    } else if (!session && inAuthGroup) {
      router.replace('/login');
    }
    
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [session, loading, profile, segments, isReady]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

function RootLayoutNav() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? MyDarkTheme : MyDefaultTheme;

  // Registra il task in background qui, all'interno di un componente React
  useEffect(() => {
    registerBackgroundFetchAsync();
  }, []);

  return (
    <NavThemeProvider value={theme}>
      <NavigationController />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

function AppInitializer() {
  const { loading } = useAuth();
  const [layoutReady, setLayoutReady] = useState(false);

  const onLayout = useCallback(async () => {
    if (layoutReady) return;
    setLayoutReady(true);
    await SplashScreen.hideAsync();
  }, [layoutReady]);

  if (loading) {
    return <LoadingScreen onLayout={onLayout} />;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      <RootLayoutNav />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <SettingsProvider>
            <CategoryProvider>
              <ProductProvider>
                <AppInitializer />
              </ProductProvider>
            </CategoryProvider>
          </SettingsProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
