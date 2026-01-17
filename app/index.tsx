import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { LoggingService } from '@/services/LoggingService';

const Index = () => {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Attendere che il contesto di autenticazione sia pronto
    }
    if (session) {
      const isResetting = session.user.user_metadata?.is_resetting_password;
      if (isResetting) {
        LoggingService.info('Index', 'Redirecting to password-reset-form (flag present)');
        router.replace('/password-reset-form');
      } else {
        LoggingService.info('Index', 'Redirecting to (tabs)');
        router.replace('/(tabs)');
      }
    } else {
      router.replace('/login');
    }
  }, [session, loading, router]);

  // Mostra un indicatore di caricamento mentre si decide dove reindirizzare
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>;
};

export default Index;
