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
  Image,
  ActionSheetIOS,
  PermissionsAndroid,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '@/context/ThemeContext';
import { Toast } from '@/components/Toast';
import { supabase } from '@/services/supabaseClient';
import { Linking } from 'react-native';
import { LoggingService } from '@/services/LoggingService';
import { ChevronLeft } from 'lucide-react-native';

const FeedbackScreen = () => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  const router = useRouter();
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast(null);
    setTimeout(() => {
      setToast({ message, type });
      Haptics.notificationAsync(type === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    }, 100);
  };

  const handleImageSelection = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setScreenshotUri(result.assets[0].uri);
        showToast('Screenshot selezionato', 'success');
      } else {
        showToast('Selezione annullata', 'success');
      }
    } catch (error) {
      LoggingService.error('FeedbackScreen', 'Errore durante la selezione dell\'immagine', error);
      showToast('Errore durante la selezione dell\'immagine', 'error');
    } finally {
      setScreenshotLoading(false);
    }
  };

  const handleChooseScreenshot = async () => {
    setScreenshotLoading(true);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso Negato', 'Per aggiungere uno screenshot, è necessario concedere l\'accesso alla galleria.');
      setScreenshotLoading(false);
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Scegli dalla Galleria', 'Annulla'],
          cancelButtonIndex: 1,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) handleImageSelection();
          else setScreenshotLoading(false);
        }
      );
    } else {
      handleImageSelection();
    }
  };

  const removeScreenshot = () => {
    setScreenshotUri(null);
    showToast('Screenshot rimosso', 'success');
  };

  const handleSendFeedback = async () => {
    if (feedbackText.trim().length < 10) {
      showToast('Il tuo feedback è un po\' corto, prova a descrivere meglio.', 'error');
      return;
    }

    setLoading(true);
    LoggingService.info('FeedbackScreen', 'Invio feedback iniziato', {
      length: feedbackText.length,
      hasScreenshot: !!screenshotUri,
    });

    let screenshotBase64 = null;
    try {
      if (screenshotUri) {
        const base64Data = await FileSystem.readAsStringAsync(screenshotUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        screenshotBase64 = `data:image/jpeg;base64,${base64Data}`;
      }

      const { data, error } = await supabase.functions.invoke('send-feedback', {
        body: {
          feedbackText,
          screenshot: screenshotBase64,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      LoggingService.info('FeedbackScreen', 'Feedback inviato con successo', data);
      showToast('Feedback inviato con successo. Grazie!', 'success');

      setFeedbackText('');
      setScreenshotUri(null);
      Keyboard.dismiss();
      setTimeout(() => router.back(), 50);

    } catch (error: any) {
      LoggingService.error('FeedbackScreen', 'Errore invio feedback', error);
      const errorMessage = error.message || 'Errore sconosciuto';
      showToast(`Errore nell\'invio: ${errorMessage}`, 'error');
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
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              testID="feedback-back-button"
              accessibilityRole="button"
              accessibilityLabel="Torna indietro"
              onPress={() => {
                LoggingService.info('FeedbackScreen', 'Back button pressed');
                Keyboard.dismiss();
                setTimeout(() => router.push('/(tabs)/settings'), 50);
              }}
              style={[styles.backButton, { padding: 16 }]}
            >
              <ChevronLeft size={28} color={isDarkMode ? '#c9d1d9' : '#1e293b'} />
            </TouchableOpacity>
            <Text style={styles.title}>Aiutaci a Migliorare</Text>
          </View>

          <Text style={styles.instructions}>
            Descrivi il tuo feedback o il bug che hai trovato. Se possibile, includi i passaggi per riprodurlo.
          </Text>
          
          <TextInput
            style={styles.feedbackInput}
            placeholder="Scrivi qui il tuo messaggio..."
            placeholderTextColor={isDarkMode ? '#8b949e' : '#9ca3af'}
            multiline
            value={feedbackText}
            onChangeText={setFeedbackText}
            editable={!loading}
          />
          
          <View style={styles.screenshotSection}>
            <Text style={styles.screenshotLabel}>Screenshot (opzionale)</Text>
            <View style={styles.screenshotButtonsContainer}>
              <TouchableOpacity
                style={[styles.screenshotButton, screenshotLoading && styles.screenshotButtonDisabled]}
                onPress={handleChooseScreenshot}
                disabled={loading || screenshotLoading}
              >
                {screenshotLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.screenshotButtonText}>Aggiungi Screenshot</Text>
                )}
              </TouchableOpacity>
              
              {screenshotUri && (
                <TouchableOpacity
                  style={styles.removeScreenshotButton}
                  onPress={removeScreenshot}
                  disabled={loading}
                >
                  <Text style={styles.removeScreenshotButtonText}>Rimuovi</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {screenshotUri && (
              <View style={styles.screenshotPreview}>
                <Image
                  source={{ uri: screenshotUri }}
                  style={styles.screenshotImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.feedbackButton, loading && styles.feedbackButtonDisabled]}
            onPress={handleSendFeedback}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.feedbackButtonText}>
                Invia Feedback{!screenshotUri ? '' : ' con Screenshot'}
              </Text>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    flex: 1,
  },
  instructions: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    lineHeight: 22,
    marginBottom: 24,
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
  screenshotSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  screenshotLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 12,
  },
  screenshotButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  screenshotButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },
  screenshotButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  screenshotButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  removeScreenshotButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  removeScreenshotButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  screenshotPreview: {
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 8,
    padding: 8,
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
  },
  screenshotImage: {
    width: '100%',
    height: 150,
    borderRadius: 4,
  },
  feedbackButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  feedbackButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  feedbackButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});

export default FeedbackScreen;
