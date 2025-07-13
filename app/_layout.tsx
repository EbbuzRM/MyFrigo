import 'react-native-url-polyfill/auto';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ThemeProvider as NavThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { CategoryProvider } from '@/context/CategoryContext';
import { supabase } from '@/services/supabaseClient';
import * as Progress from 'react-native-progress';

// Keep the native splash screen visible while the app initializes.
SplashScreen.preventAutoHideAsync();

// Define app themes
const MyDefaultTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: '#007bff', background: '#ffffff', card: '#ffffff', text: '#212529', border: '#e9ecef', notification: '#dc3545' },
};
const MyDarkTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: '#007bff', background: '#121212', card: '#1e1e1e', text: '#ffffff', border: '#272727', notification: '#dc3545' },
};

// --- Custom Loading Screen Component ---
function LoadingScreen({ progress }) {
  return (
    <View style={loadingStyles.container}>
      <Image source={require('@/assets/images/icon.png')} style={loadingStyles.logo} />
      <Text style={loadingStyles.appName}>MyFrigo</Text>
      <Progress.Bar progress={progress} width={200} color="#007bff" />
      <Text style={loadingStyles.loadingText}>Caricamento... {Math.round(progress * 100)}%</Text>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  logo: { width: 100, height: 100, marginBottom: 20 },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#007bff', marginBottom: 20 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#8b949e' },
});

// --- Main App Navigation ---
function RootLayoutNav() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? MyDarkTheme : MyDefaultTheme;
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    setSession(supabase.auth.getSession()?.data?.session ?? null);
    setInitialized(true);
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const inTabsGroup = segments[0] === '(tabs)';
    if (session && !inTabsGroup) {
      router.replace('/(tabs)');
    } else if (!session && inTabsGroup) {
      router.replace('/login');
    }
  }, [session, initialized, segments, router]);

  return (
    <NavThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

// --- Root Layout with Loading Logic ---
export default function RootLayout() {
  const [fontsReady, setFontsReady] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [timerReady, setTimerReady] = useState(false);

  // Load fonts
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setFontsReady(true);
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    supabase.auth.getSession().finally(() => {
      setSessionReady(true);
    });

    const timer = setTimeout(() => {
      setTimerReady(true);
    }, 2000); // Minimum 2 seconds splash/loading screen

    return () => clearTimeout(timer);
  }, []);

  const appReady = fontsReady && sessionReady && timerReady;
  
  const progress = (Number(fontsReady) + Number(sessionReady) + Number(timerReady)) / 3;

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) {
    return <LoadingScreen progress={progress} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <CategoryProvider>
            <RootLayoutNav />
          </CategoryProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}