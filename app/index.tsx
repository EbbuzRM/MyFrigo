import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

const Index = () => {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Attendere che il contesto di autenticazione sia pronto
    }
    if (session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }
  }, [session, loading, router]);

  // Mostra un indicatore di caricamento mentre si decide dove reindirizzare
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>;
};

export default Index;
