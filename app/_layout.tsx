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
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { CategoryProvider } from '@/context/CategoryContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import * as Progress from 'react-native-progress';

SplashScreen.preventAutoHideAsync();

const MyDefaultTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: '#007bff', background: '#ffffff', card: '#ffffff', text: '#212529', border: '#e9ecef', notification: '#dc3545' },
};
const MyDarkTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: '#007bff', background: '#121212', card: '#1e1e1e', text: '#ffffff', border: '#272727', notification: '#dc3545' },
};

function LoadingScreen({ onLayout }) {
  return (
    <View style={loadingStyles.container} onLayout={onLayout}>
      <Image source={require('@/assets/images/icon.png')} style={loadingStyles.logo} />
      <Text style={loadingStyles.appName}>MyFrigo</Text>
      <Progress.Bar indeterminate width={200} color="#007bff" />
      <Text style={loadingStyles.loadingText}>Inizializzazione...</Text>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  logo: { width: 100, height: 100, marginBottom: 20 },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#007bff', marginBottom: 20 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#8b949e' },
});

function NavigationController() {
  const { session, loading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Non fare nulla finché il contesto non è pronto
    }

    const inTabsGroup = segments[0] === '(tabs)';

    if (session) {
      // L'utente è loggato
      const profileComplete = profile?.first_name && profile?.last_name;

      if (profileComplete) {
        // Profilo completo, l'utente deve stare nel gruppo (tabs)
        if (!inTabsGroup) {
          router.replace('/(tabs)');
        }
      } else {
        // Profilo incompleto, l'utente deve andare a completarlo
        router.replace('/complete-profile');
      }
    } else {
      // L'utente non è loggato, deve andare al login
      if (inTabsGroup) {
        router.replace('/login');
      }
    }
  }, [session, loading, profile, segments]);

  return null; // Questo componente non renderizza nulla
}

function RootLayoutNav() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? MyDarkTheme : MyDefaultTheme;

  return (
    <NavThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="complete-profile" />
        <Stack.Screen name="+not-found" />
      </Stack>
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
          <CategoryProvider>
            <AppInitializer />
          </CategoryProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
