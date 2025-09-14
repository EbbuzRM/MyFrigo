import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Trash2,
  Info,
  Sun,
  Moon,
  ListTree,
  Calendar,
  User,
  MessageSquareQuote,
  Wrench,
} from 'lucide-react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { SettingsCard } from '@/components/SettingsCard';
import { Toast } from '@/components/Toast';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { StorageService } from '@/services/StorageService';
import { LoggingService } from '@/services/LoggingService';
import { DiagnosticPanel } from '@/components/DiagnosticPanel';


const Settings = () => {
  const { setAppTheme, isDarkMode } = useTheme();
  const { settings, loading, updateSettings } = useSettings();
  const styles = getStyles(isDarkMode);

  const [isDaysModalVisible, setIsDaysModalVisible] = useState(false);
  const [daysInput, setDaysInput] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiagnosticPanel, setShowDiagnosticPanel] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [longPressProgress, setLongPressProgress] = useState(0);

  useEffect(() => {
    if (settings) {
      setDaysInput(settings.notificationDays?.toString() ?? '3');
    }
  }, [settings]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast(null);
    setTimeout(() => {
      setToast({ message, type });
      Haptics.notificationAsync(type === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    }, 100);
  };

  const handleSaveNotificationDays = async () => {
    const days = parseInt(daysInput, 10);
    if (!isNaN(days) && days > 0 && days <= 30) {
      try {
        setIsSaving(true);
        await updateSettings({ notificationDays: days });
        showToast(`Giorni di preavviso impostati a ${days}.`);
        setIsDaysModalVisible(false);
      } catch (error) {
        LoggingService.error('Settings', 'Errore durante il salvataggio delle impostazioni:', error);
        showToast('Errore durante il salvataggio.', 'error');
      } finally {
        setIsSaving(false);
      }
    } else {
      showToast('Inserisci un numero di giorni valido (1-30).', 'error');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Conferma Eliminazione',
      'Sei sicuro di voler eliminare tutti i dati? Questa azione è irreversibile.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              showToast('Tutti i dati sono stati eliminati.');
            } catch {
              showToast('Impossibile eliminare i dati.', 'error');
            }
          },
        },
      ]
    );
  };

  if (loading || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Impostazioni</Text>
          <Text style={styles.subtitle}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="settings-screen">
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Impostazioni</Text>
          <Text style={styles.subtitle}>Personalizza l'app secondo le tue preferenze</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingsCard
            icon={<User size={24} color={isDarkMode ? '#a78bfa' : '#7c3aed'} />}
            title="Profilo"
            onPress={() => router.push('/profile')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifiche</Text>
          <SettingsCard
            icon={<Calendar size={24} color={isDarkMode ? '#fcd34d' : '#f59e0b'} />}
            title="Giorni di Preavviso"
            description={`Avvisami ${settings.notificationDays ?? '...'} giorni prima`}
            onPress={() => setIsDaysModalVisible(true)}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aspetto</Text>
          <SettingsCard
            icon={isDarkMode ? <Moon size={24} color="#818cf8" /> : <Sun size={24} color="#f59e0b" />}
            title="Modalità Scura"
            control={
              <Switch
                testID="dark-mode-switch"
                value={isDarkMode}
                onValueChange={(value) => setAppTheme(value ? 'dark' : 'light')}
                trackColor={{ false: '#e5e7eb', true: '#818cf8' }}
                thumbColor={isDarkMode ? '#6366f1' : '#f1f5f9'}
              />
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestione Dati</Text>
          <SettingsCard
            icon={<ListTree size={24} color={isDarkMode ? '#4ade80' : '#16a34a'} />}
            title="Gestisci Categorie"
            onPress={() => router.push('/manage-categories')}
          />
          <SettingsCard
            icon={<Trash2 size={24} color={isDarkMode ? '#f87171' : '#dc2626'} />}
            title="Elimina Tutti i Dati"
            onPress={handleClearData}
          />
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Informazioni e Supporto</Text>
          <SettingsCard
            icon={<Info size={24} color={isDarkMode ? '#9ca3af' : '#6b7280'} />}
            title="Informazioni sull'App"
            description={`Versione ${Constants.expoConfig?.version}`}
            onPress={() => {
              // Cancella il timer di pressione prolungata se esiste
              if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
                setLongPressProgress(0);
              }
              
              // Mostra le informazioni sull'app
              Alert.alert('MyFrigo', `Versione ${Constants.expoConfig?.version}`);
            }}
            onLongPress={() => {
              // Avvia un timer per rilevare la pressione prolungata di 5 secondi
              LoggingService.info('Settings', 'Rilevata pressione prolungata su Informazioni App');
              
              // Inizializza il progresso
              setLongPressProgress(0);
              
              // Crea un intervallo per aggiornare il progresso visivamente (opzionale)
              const progressInterval = setInterval(() => {
                setLongPressProgress(prev => {
                  const newProgress = prev + 20; // Incrementa del 20% ogni secondo
                  if (newProgress >= 100) {
                    clearInterval(progressInterval);
                  }
                  return newProgress;
                });
              }, 1000);
              
              // Imposta il timer principale per attivare il pannello diagnostico dopo 5 secondi
              longPressTimerRef.current = setTimeout(() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                LoggingService.info('Settings', 'Pannello diagnostico attivato dopo 5 secondi di pressione');
                setShowDiagnosticPanel(true);
                setLongPressProgress(0);
                clearInterval(progressInterval);
                longPressTimerRef.current = null;
              }, 5000);
            }}
          />
          <SettingsCard
            icon={<MessageSquareQuote size={24} color={isDarkMode ? '#a78bfa' : '#7c3aed'} />}
            title="Invia un Feedback"
            description="Segnala un bug o suggerisci un'idea"
            onPress={() => router.push('/feedback')}
          />
        </View>
      </ScrollView>

      <Modal
        transparent={true}
        animationType="fade"
        visible={isDaysModalVisible}
        onRequestClose={() => setIsDaysModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Giorni di Preavviso</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Numero di giorni (es. 3)"
              value={daysInput}
              onChangeText={setDaysInput}
              keyboardType="number-pad"
              autoFocus
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setIsDaysModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalButtonTextCancel}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  isSaving && styles.modalButtonDisabled
                ]}
                onPress={handleSaveNotificationDays}
                disabled={isSaving}
              >
                {isSaving ? (
                  <View style={styles.saveButtonContent}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={[styles.modalButtonTextConfirm, styles.saveButtonText]}>
                      Salvataggio...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.modalButtonTextConfirm}>Salva</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {toast && (
        <Toast
          testID="toast-message" // Aggiunto per Maestro
          message={toast.message}
          visible={!!toast}
          onDismiss={() => setToast(null)}
          type={toast.type}
        />
      )}
      
      {/* Indicatore di progresso per la pressione prolungata (opzionale) */}
      {longPressProgress > 0 && (
        <View style={styles.progressOverlay}>
          <View style={[styles.progressBar, { width: `${longPressProgress}%` }]} />
          <Text style={styles.progressText}>
            {longPressProgress < 100
              ? `Tieni premuto per attivare la diagnostica (${Math.round(longPressProgress)}%)`
              : 'Rilascia per attivare la diagnostica'}
          </Text>
        </View>
      )}
      
      {/* Pannello Diagnostico */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={showDiagnosticPanel}
        onRequestClose={() => setShowDiagnosticPanel(false)}
      >
        <DiagnosticPanel onClose={() => setShowDiagnosticPanel(false)} />
      </Modal>
    </SafeAreaView>
  );
};

export default Settings;

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa' },
  scrollView: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontFamily: 'Inter-Bold', color: isDarkMode ? '#c9d1d9' : '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 16, fontFamily: 'Inter-Regular', color: isDarkMode ? '#8b949e' : '#64748B' },
  section: { paddingHorizontal: 20, marginVertical: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: isDarkMode ? '#8b949e' : '#64748B', marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: isDarkMode ? '#161b22' : '#ffffff', padding: 24, borderRadius: 16, width: '85%', alignItems: 'stretch', borderColor: isDarkMode ? '#30363d' : '#e2e8f0', borderWidth: 1 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter-Bold', marginBottom: 20, textAlign: 'center', color: isDarkMode ? '#c9d1d9' : '#1e293b' },
  modalInput: { borderWidth: 1, borderColor: isDarkMode ? '#30363d' : '#cbd5e1', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, fontFamily: 'Inter-Regular', marginBottom: 24, color: isDarkMode ? '#c9d1d9' : '#1e293b', backgroundColor: isDarkMode ? '#0d1117' : '#ffffff', textAlign: 'center' },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, flex: 1, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: isDarkMode ? '#30363d' : '#e5e7eb', marginRight: 8 },
  modalButtonConfirm: { backgroundColor: '#4f46e5', marginLeft: 8 },
  modalButtonTextCancel: { color: isDarkMode ? '#c9d1d9' : '#374151', fontFamily: 'Inter-SemiBold', fontSize: 16 },
  modalButtonTextConfirm: { color: 'white', fontFamily: 'Inter-SemiBold', fontSize: 16 },
  modalButtonDisabled: {
    backgroundColor: '#a5b4fc',
    opacity: 0.8
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    marginLeft: 8,
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#4f46e5',
    borderRadius: 2,
    alignSelf: 'stretch',
    marginBottom: 8,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});
