
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabaseClient';
import { LoggingService } from '@/services/LoggingService';

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
