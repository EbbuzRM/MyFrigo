import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabaseClient';
import { LoggingService } from '@/services/LoggingService';


export default function NotFoundScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Estrai parametri direttamente da useLocalSearchParams
  const emailParam = params.email as string || '';
  const tokenParam = params.token as string || params.token_hash as string || params.code as string || '';

  // Decodifica valori
  const decodedEmail = decodeURIComponent(emailParam);
  const decodedToken = decodeURIComponent(tokenParam);
  const type = params.type as string | undefined;
  const redirect_to = params.redirect_to as string | undefined;
  const pathname = params.pathname as string | undefined;
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Verifica della richiesta...');
  const [isEmailConfirmation, setIsEmailConfirmation] = useState(false);

  useEffect(() => {
    const handleRequest = async () => {
      // Log di debug per vedere tutti i parametri ricevuti
      LoggingService.info('NotFound', '🔍 DEBUG - +not-found component called with params', {
        allParams: JSON.stringify(params),
        decodedToken: decodedToken ? decodedToken.substring(0, 10) + '...' : 'null',
        type: type || 'null',
        redirect_to: redirect_to || 'null',
        pathname: pathname || 'null',
        notFoundParams: params['not-found'],
      });

      LoggingService.info('NotFound', 'START HANDLING REQUEST', {
        allParams: JSON.stringify(params),
        token: decodedToken?.substring(0, 8),
        type,
        redirect_to,
        pathname
      });
      
      // Log di debug per vedere tutti i parametri ricevuti
      LoggingService.info('NotFound', '🔍 DEBUG - All params received', {
        allParams: JSON.stringify(params),
        token: decodedToken ? decodedToken.substring(0, 10) + '...' : 'null',
        type: type || 'null',
        redirect_to: redirect_to || 'null',
        pathname: pathname || 'null',
      });

      LoggingService.info('NotFound', '🔍 404 HANDLER - Link detected', {
        token: decodedToken ? decodedToken.substring(0, 10) + '...' : 'null',
        type: type || 'null',
        redirect_to: redirect_to || 'null',
        pathname: pathname || 'null',
      });

      // Rimosso il blocco type === 'recovery'
      if (type === 'signup' || type === 'invite' || type === 'magiclink' || type === 'email_change') {
        setIsEmailConfirmation(true);
        setMessage('Verifica link di conferma email...');
        setTimeout(() => {
            Alert.alert(
                "Conferma Email",
                "Se l'email è stata confermata, puoi accedere.",
                [{ text: "OK", onPress: () => router.replace("/login") }]
            );
            setLoading(false);
        }, 2000);
      } else {
        LoggingService.info('NotFound', '🤷‍♂️ 404 HANDLER - Not a special link', {
          token: decodedToken ? decodedToken.substring(0, 10) + '...' : 'null',
          type: type || 'null',
          redirect_to: redirect_to || 'null',
        });
        // Verifica se siamo in un loop di navigazione controllando i parametri not-found
        const notFoundParams = params['not-found'];
        LoggingService.info('NotFound', '🔄 Checking for navigation loop', {
          notFoundParams: JSON.stringify(notFoundParams)
        });
        
        // Se stiamo cercando di navigare a (tabs)/index, reindirizza solo a (tabs)
        if (notFoundParams && Array.isArray(notFoundParams) && 
            notFoundParams[0] === '(tabs)' && notFoundParams[1] === 'index') {
          setMessage('Reindirizzamento alla dashboard...');
          LoggingService.info('NotFound', '🔄 Detected (tabs)/index loop, redirecting to /(tabs)');
          // Usa setTimeout per evitare loop di navigazione troppo rapidi
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 300);
        } else {
          setMessage('Pagina non trovata. Reindirizzamento...');
          setTimeout(() => {
            LoggingService.info('NotFound', 'Redirecting to home page');
            // Controlla se l'utente è autenticato usando la sessione corrente
            supabase.auth.getSession().then(({ data }) => {
              const destination = data?.session ? '/(tabs)' : '/login';
              LoggingService.info('NotFound', `Redirecting to ${destination}`);
              router.replace(destination);
            }).catch(error => {
              LoggingService.error('NotFound', 'Error checking session', error);
              // In caso di errore, reindirizza al login come fallback
              router.replace('/login');
            });
          }, 1500);
        }
        setLoading(false);
      }
    };

    handleRequest();
  }, [decodedToken, type, redirect_to, pathname, router]); // Aggiunto pathname e router alle dipendenze

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Rimosso il rendering condizionale per isPasswordReset */}
        {isEmailConfirmation ? (
          <>
            
            <Text style={styles.title}>Conferma Email in Corso</Text>
            <Text style={styles.message}>{message}</Text>
            {loading && <ActivityIndicator size="large" color="#007bff" style={styles.loader} />}
          </>
        ) : (
          <>
            <Text style={styles.title}>MyFrigo</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
            ) : (
              <Text style={styles.message}>{message}</Text>
            )}
            {!loading && (
              <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
                <Text style={styles.buttonText}>Continua</Text>
              </TouchableOpacity>
            )}
          </>
        )}
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
    maxWidth: 400,
    width: '100%',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    lineHeight: 22,
  },
  loader: {
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 200,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});