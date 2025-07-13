import React, { useState, useEffect } from 'react';
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
} from 'lucide-react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { StorageService, AppSettings } from '@/services/StorageService';
import { NotificationService } from '@/services/NotificationService';
import { SettingsCard } from '@/components/SettingsCard';
import { Toast } from '@/components/Toast';
import { useTheme } from '@/context/ThemeContext';

// Componente per le impostazioni dell'app
const Settings = () => {
  const { setAppTheme, isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const [settings, setSettings] = useState<AppSettings>({
    notifications_enabled: true,
    notificationDays: 3,
    theme: 'light',
  });
  const [isDaysModalVisible, setIsDaysModalVisible] = useState(false);
  const [daysInput, setDaysInput] = useState(settings.notificationDays?.toString() ?? '3');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const unsubscribe = StorageService.listenToSettings((newSettings) => {
      if (newSettings) {
        setSettings(newSettings);
        setDaysInput(newSettings.notificationDays?.toString() ?? '3');
      }
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast(null); // Resetta il toast precedente
    setTimeout(() => {
      setToast({ message, type });
      Haptics.notificationAsync(type === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    }, 100);
  };

  const updateSetting = async (newSetting: Partial<AppSettings>) => {
    try {
      await StorageService.updateSettings(newSetting);
      return true;
    } catch (__) {
      void __; // Explicitly mark as used
      showToast('Impossibile salvare le impostazioni.', 'error');
      return false;
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) { 
      const granted = await NotificationService.requestPermissions();
      if(!granted) {
        Alert.alert("Permesso Negato", "Le notifiche non funzioneranno senza i permessi.");
        return;
      }
    }
    const success = await updateSetting({ notifications_enabled: value });
    if (success) {
      showToast(`Notifiche ${value ? 'attivate' : 'disattivate'}.`);
    }
  };

  const handleSaveNotificationDays = async () => {
    const days = parseInt(daysInput, 10);
    if (!isNaN(days) && days > 0 && days <= 30) {
      const success = await updateSetting({ notificationDays: days });
      if (success) {
        showToast(`Giorni di preavviso impostati a ${days}.`);
        setIsDaysModalVisible(false);
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
            } catch (__) {
              void __; // Explicitly mark as used
              showToast('Impossibile eliminare i dati.', 'error');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Impostazioni</Text>
          <Text style={styles.subtitle}>Personalizza l'app secondo le tue preferenze</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifiche</Text>
          <SettingsCard
            icon={<Bell size={24} color={isDarkMode ? '#60a5fa' : '#2563eb'} />}
            title="Notifiche di Scadenza"
            control={
              <Switch
                value={settings.notifications_enabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#e5e7eb', true: '#818cf8' }}
                thumbColor={isDarkMode ? (settings.notifications_enabled ? '#6366f1' : '#94a3b8') : (settings.notifications_enabled ? '#4f46e5' : '#f1f5f9')}
              />
            }
          />
          <SettingsCard
            icon={<Calendar size={24} color={isDarkMode ? '#fcd34d' : '#f59e0b'} />}
            title="Giorni di Preavviso"
            description={`Avvisami ${settings.notificationDays ?? 3} giorni prima`}
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

        <View style={[styles.section, { marginBottom: 250 }]}>
          <Text style={styles.sectionTitle}>Informazioni</Text>
          <SettingsCard
            icon={<Info size={24} color={isDarkMode ? '#9ca3af' : '#6b7280'} />}
            title="Informazioni sull'App"
            description={`Versione ${Constants.expoConfig?.version}`}
            onPress={() => Alert.alert('MyFrigo', `Versione ${Constants.expoConfig?.version}`)}
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
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setIsDaysModalVisible(false)}>
                <Text style={styles.modalButtonTextCancel}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleSaveNotificationDays}>
                <Text style={styles.modalButtonTextConfirm}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          visible={!!toast}
          onDismiss={() => setToast(null)}
          type={toast.type}
        />
      )}
    </SafeAreaView>
  );
};

// Esportazione predefinita del componente
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
});
