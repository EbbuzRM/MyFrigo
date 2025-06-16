import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Bell, 
  Trash2, 
  Download, 
  Upload, 
  Info, 
  ChevronRight,
  Sun,
  Moon,
  Smartphone,
  ListTree
} from 'lucide-react-native';
import { router } from 'expo-router';
import { StorageService, AppSettings } from '@/services/StorageService';
import { NotificationService } from '@/services/NotificationService';
import { SettingsCard } from '@/components/SettingsCard';
import { useTheme } from '../../context/ThemeContext';

export default function Settings() {
  const { theme: contextTheme, setAppTheme, isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: true,
    notificationDays: 3,
    theme: 'auto',
  });
  const [isDaysModalVisible, setIsDaysModalVisible] = useState(false);
  const [daysInput, setDaysInput] = useState(settings.notificationDays.toString());

  useEffect(() => {
    const unsubscribe = StorageService.listenToSettings((newSettings) => {
      setSettings(newSettings);
      setDaysInput(newSettings.notificationDays.toString());
      if (newSettings.theme !== contextTheme) {
        setAppTheme(newSettings.theme);
      }
    });
    return () => unsubscribe();
  }, [contextTheme, setAppTheme]);

  const handleThemeChange = async (newTheme: AppSettings['theme']) => {
    try {
      await StorageService.updateSettings({ theme: newTheme });
      // Il listener aggiornerà il context e lo stato locale
    } catch (error) {
      console.error('Error updating theme:', error);
      Alert.alert("Errore", "Impossibile aggiornare il tema.");
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    try {
      await StorageService.updateSettings({ notificationsEnabled: value });
      if (value) { 
        const granted = await NotificationService.requestPermissions();
        if(!granted) {
          Alert.alert("Permesso Negato", "Le notifiche non funzioneranno senza i permessi.");
          await StorageService.updateSettings({ notificationsEnabled: false });
        }
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert("Errore", "Impossibile aggiornare le impostazioni di notifica.");
    }
  };

  const openDaysModal = () => {
    setDaysInput(settings.notificationDays.toString());
    setIsDaysModalVisible(true);
  };

  const handleSaveNotificationDays = async () => {
    const days = parseInt(daysInput, 10);
    if (!isNaN(days) && days > 0 && days <= 30) {
      try {
        await StorageService.updateSettings({ notificationDays: days });
        Alert.alert('Successo', `Giorni di preavviso impostati a ${days}.`);
        setIsDaysModalVisible(false);
      } catch (error) {
        console.error('Error updating notification days:', error);
        Alert.alert("Errore", "Impossibile aggiornare i giorni di preavviso.");
      }
    } else {
      Alert.alert('Valore Non Valido', 'Inserisci un numero di giorni valido (es. 1-30).');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Conferma Eliminazione',
      'Sei sicuro di voler eliminare tutti i dati? Questa azione non può essere annullata.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              Alert.alert('Successo', 'Tutti i dati sono stati eliminati.');
            } catch (error) {
              Alert.alert('Errore', 'Impossibile eliminare i dati.');
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      await StorageService.exportData();
      Alert.alert('Esportazione', 'Dati esportati con successo! (Controlla la console per il JSON)');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile esportare i dati.');
    }
  };

  const handleImportData = () => {
    Alert.alert('Importazione', 'Funzionalità di importazione in arrivo.');
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
            title="Notifiche Push"
            description="Ricevi avvisi per prodotti in scadenza"
            icon={<Bell size={24} color="#2563EB" />}
            rightElement={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#f1f5f9', true: '#DBEAFE' }}
                thumbColor={settings.notificationsEnabled ? '#2563EB' : '#94a3b8'}
              />
            }
          />
          <SettingsCard
            title="Giorni di Preavviso"
            description={`Ricevi notifiche ${settings.notificationDays} giorni prima della scadenza`}
            icon={<Bell size={24} color="#F59E0B" />}
            rightElement={<Text style={styles.daysText}>{settings.notificationDays}</Text>}
            onPress={openDaysModal}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aspetto</Text>
          <SettingsCard
            title="Tema App"
            description={`Attualmente: ${settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}`}
            icon={
              settings.theme === 'light' ? <Sun size={24} color="#F59E0B" /> :
              settings.theme === 'dark' ? <Moon size={24} color="#6366F1" /> :
              <Smartphone size={24} color="#64748B" />
            }
            rightElement={<ChevronRight size={20} color="#94a3b8" />}
            onPress={() => {
              Alert.alert(
                'Scegli Tema', 'Seleziona il tema desiderato:',
                [
                  { text: 'Chiaro', onPress: () => handleThemeChange('light') },
                  { text: 'Scuro', onPress: () => handleThemeChange('dark') },
                  { text: 'Sistema', onPress: () => handleThemeChange('auto') },
                  { text: 'Annulla', style: 'cancel' },
                ],
                { cancelable: true }
              );
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dati</Text>
          <SettingsCard
            title="Gestisci Categorie"
            description="Modifica o elimina le categorie personalizzate"
            icon={<ListTree size={24} color="#10B981" />}
            rightElement={<ChevronRight size={20} color="#94a3b8" />}
            onPress={() => router.push('/manage-categories')}
          />
          <SettingsCard
            title="Esporta Dati"
            description="Scarica tutti i tuoi dati in formato JSON"
            icon={<Download size={24} color="#10B981" />}
            rightElement={<ChevronRight size={20} color="#94a3b8" />}
            onPress={handleExportData}
          />
          <SettingsCard
            title="Importa Dati"
            description="Carica dati da un backup precedente"
            icon={<Upload size={24} color="#8B5CF6" />}
            rightElement={<ChevronRight size={20} color="#94a3b8" />}
            onPress={handleImportData}
          />
          <SettingsCard
            title="Elimina Tutti i Dati"
            description="Rimuovi tutti i prodotti e le impostazioni"
            icon={<Trash2 size={24} color="#EF4444" />}
            rightElement={<ChevronRight size={20} color="#94a3b8" />}
            onPress={handleClearData}
            variant="danger"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informazioni</Text>
          <SettingsCard
            title="Informazioni sull'App"
            description="Versione 2.0.0 - Smart Food Manager"
            icon={<Info size={24} color="#64748B" />}
            rightElement={<ChevronRight size={20} color="#94a3b8" />}
            onPress={() => Alert.alert('Smart Food Manager', 'Versione 2.0.0\n\nGestione intelligente degli alimenti domestici con riconoscimento automatico e notifiche.')}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Smart Food Manager v2.0.0</Text>
          <Text style={styles.footerSubtext}>Gestione intelligente degli alimenti</Text>
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
            <Text style={styles.modalTitle}>Giorni di Preavviso Notifica</Text>
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
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDarkMode ? '#0d1117' : '#f8fafc' },
  scrollView: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontFamily: 'Inter-Bold', color: isDarkMode ? '#c9d1d9' : '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 16, fontFamily: 'Inter-Regular', color: isDarkMode ? '#8b949e' : '#64748B' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: isDarkMode ? '#c9d1d9' : '#1e293b', marginBottom: 12 },
  daysText: { fontSize: 16, fontFamily: 'Inter-Medium', color: isDarkMode ? '#c9d1d9' : '#334155' },
  footer: { padding: 20, alignItems: 'center', marginTop: 20 },
  footerText: { fontSize: 14, fontFamily: 'Inter-Medium', color: isDarkMode ? '#8b949e' : '#64748B', marginBottom: 4 },
  footerSubtext: { fontSize: 12, fontFamily: 'Inter-Regular', color: isDarkMode ? '#6b7280' : '#94a3b8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: isDarkMode ? '#161b22' : 'white', padding: 20, borderRadius: 10, width: '80%', alignItems: 'stretch', borderColor: isDarkMode ? '#30363d' : '#e2e8f0', borderWidth: 1 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter-Bold', marginBottom: 15, textAlign: 'center', color: isDarkMode ? '#c9d1d9' : '#1e293b' },
  modalInput: { borderWidth: 1, borderColor: isDarkMode ? '#30363d' : '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontFamily: 'Inter-Regular', marginBottom: 20, color: isDarkMode ? '#c9d1d9' : '#1e293b', backgroundColor: isDarkMode ? '#0d1117' : '#ffffff' },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  modalButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, flex: 1, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0', marginRight: 10 },
  modalButtonConfirm: { backgroundColor: '#2563EB', marginLeft: 10 },
  modalButtonTextCancel: { color: isDarkMode ? '#c9d1d9' : '#1e293b', fontFamily: 'Inter-SemiBold', fontSize: 16 },
  modalButtonTextConfirm: { color: 'white', fontFamily: 'Inter-SemiBold', fontSize: 16 },
});
