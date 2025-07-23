import React, { useState } from 'react';
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
import { supabase } from '@/services/supabaseClient'; // Importa il client Supabase

const FeedbackScreen = () => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false); // Stato di caricamento
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
    
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-feedback', {
        body: { feedbackText },
      });

      if (error) {
        throw error;
      }

      showToast('Feedback inviato con successo. Grazie!', 'success');
      setFeedbackText(''); // Pulisce il campo di testo
    } catch (error: any) {
      console.error('Errore invio feedback:', error);
      showToast(`Errore nell'invio: ${error.message}`, 'error');
    } finally {
      setLoading(false);
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
