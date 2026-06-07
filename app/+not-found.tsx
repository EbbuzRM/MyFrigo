// +not-found.tsx — +not-found module.
//
// exports: NotFoundScreen | function
// used_by: none
// rules:   - Must maintain the 1.5-second delay before redirect to allow for session check completion
//          - Redirect logic must use router.replace (not push) for all navigation destinations to prevent history stack pollution
//          - Supabase session check determines redirect target: authenticated users go to '/(tabs)', unauthenticated users go to '/login'
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabaseClient';
import { LoggingService } from '@/services/LoggingService';

/**
 * Rules:   Relies on Supabase session to determine redirect destination - if Supabase auth isn't initialized or provider changes, redirect logic breaks. Uses router.replace (not push) so redirect doesn't add history entry.
 */
export default function NotFoundScreen() {
  const router = useRouter();

  useEffect(() => {
    LoggingService.info('NotFound', 'Page not found, determining redirect.');
    
    const timer = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        const destination = data?.session ? '/(tabs)' : '/login';
        LoggingService.info('NotFound', `Redirecting to ${destination}`);
        router.replace(destination);
      }).catch(error => {
        LoggingService.error('NotFound', 'Error checking session, redirecting to login', error);
        router.replace('/login');
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Pagina non trovata</Text>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.message}>Stiamo per reindirizzarti...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});
