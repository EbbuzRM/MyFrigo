import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { Toast } from '@/components/Toast';
import { supabase } from '@/services/supabaseClient';
import { LoggingService } from '@/services/LoggingService';

// Funzione di utilità per implementare timeout per le promesse
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout (${timeoutMs}ms): ${errorMessage}`));
    }, timeoutMs);

    promise.then(
      (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
};

const FeedbackScreen = () => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const feedbackRef = useRef<string>('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast(null);
    setTimeout(() => {
      setToast({ message, type });
      Haptics.notificationAsync(type === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    }, 100);
  };

  const handleSendFeedback = async () => {
    if (feedbackText.trim().length < 10) {
      showToast('Il tuo feedback è un po\' corto, prova a descrivere meglio.', 'error');
      return;
    }
    
    // Salva il feedback corrente nel ref per eventuali retry
    feedbackRef.current = feedbackText;
    
    setLoading(true);
    LoggingService.info('FeedbackScreen', 'Invio feedback iniziato', { length: feedbackText.length });
    
    try {
      // Invoca la funzione Supabase con un timeout di 10 secondi
      const result = await withTimeout(
        supabase.functions.invoke('send-feedback', {
          body: { feedbackText },
        }),
        10000, // 10 secondi di timeout
        'L\'operazione di invio feedback ha impiegato troppo tempo'
      );
      
      const { error } = result as { error?: any };

      if (error) {
        throw error;
      }

      LoggingService.info('FeedbackScreen', 'Feedback inviato con successo');
      showToast('Feedback inviato con successo. Grazie!', 'success');
      setFeedbackText(''); // Pulisce il campo di testo
      setRetryCount(0); // Resetta il contatore dei tentativi
    } catch (error: any) {
      LoggingService.error('FeedbackScreen', 'Errore invio feedback', error);
      
      // Gestione dei tentativi di invio
      if (retryCount < maxRetries && (error.message.includes('Timeout') || error.message.includes('network') || error.message.includes('connection'))) {
        setRetryCount(prev => prev + 1);
        
        // Mostra un messaggio di errore con l'opzione di riprovare
        Alert.alert(
          'Errore di connessione',
          `Impossibile inviare il feedback. Tentativo ${retryCount + 1}/${maxRetries + 1}. Vuoi riprovare?`,
          [
            {
              text: 'Annulla',
              style: 'cancel',
              onPress: () => {
                setLoading(false);
                setRetryCount(0);
              }
            },
            {
              text: 'Riprova',
              onPress: () => {
                // Riprova dopo un breve ritardo
                setTimeout(() => {
                  // Ripristina il testo del feedback dal ref
                  setFeedbackText(feedbackRef.current);
                  handleSendFeedback();
                }, 1000);
              }
            }
          ]
        );
      } else {
        // Mostra un messaggio di errore generico se abbiamo superato il numero massimo di tentativi
        let errorMessage = `Errore nell'invio: ${error.message}`;
        if (retryCount >= maxRetries) {
          errorMessage = `Impossibile inviare il feedback dopo ${maxRetries + 1} tentativi. Riprova più tardi.`;
        }
        
        showToast(errorMessage, 'error');
        setRetryCount(0); // Resetta il contatore dei tentativi
        setLoading(false);
      }
    } finally {
      // Imposta loading a false solo se non stiamo per riprovare
      if (retryCount >= maxRetries) {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Invia Feedback', headerBackTitle: 'Impostazioni' }} />
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Aiutaci a Migliorare</Text>
            <Text style={styles.instructions}>
              Per aiutarci a migliorare, descrivi il tuo feedback in modo chiaro. Se segnali un bug/errore, includi i passaggi per riprodurlo. Se hai un'idea, spiega cosa vorresti che accadesse.
            </Text>
          </View>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Scrivi qui il tuo messaggio..."
            placeholderTextColor={isDarkMode ? '#8b949e' : '#9ca3af'}
            multiline
            value={feedbackText}
            onChangeText={setFeedbackText}
            autoFocus={true}
            editable={!loading} // Disabilita l'input durante il caricamento
          />
          <TouchableOpacity 
            style={[styles.feedbackButton, loading && styles.feedbackButtonDisabled]} 
            onPress={handleSendFeedback}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.feedbackButtonText}>Invia Feedback</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
        {toast && (
          <Toast
            message={toast.message}
            visible={!!toast}
            onDismiss={() => setToast(null)}
            type={toast.type}
          />
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
  },
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 12,
  },
  instructions: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    lineHeight: 22,
  },
  feedbackInput: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    minHeight: 150,
    textAlignVertical: 'top',
  },
  feedbackButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  feedbackButtonDisabled: {
    backgroundColor: '#a5b4fc', // Un colore più chiaro per indicare che è disabilitato
  },
  feedbackButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});

export default FeedbackScreen;
