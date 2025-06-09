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
  Modal, // Added Modal
  TextInput, // Added TextInput for modal
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
  Smartphone
} from 'lucide-react-native';
import { StorageService, AppSettings } from '@/services/StorageService'; // Import AppSettings
import { NotificationService } from '@/services/NotificationService';
import { SettingsCard } from '@/components/SettingsCard';
import { useTheme } from '../../context/ThemeContext'; // Import useTheme

export default function Settings() {
  const { theme: contextTheme, setAppTheme } = useTheme(); // Use theme from context

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationDays, setNotificationDays] = useState(3);
  // const [currentTheme, setCurrentTheme] = useState<AppSettings['theme']>('auto'); // Replaced by contextTheme
  const [isDaysModalVisible, setIsDaysModalVisible] = useState(false);
  const [daysInput, setDaysInput] = useState(notificationDays.toString());
  
  // Local currentTheme state to sync with context, primarily for UI display within this component
  const [displayTheme, setDisplayTheme] = useState<AppSettings['theme']>(contextTheme);

  useEffect(() => {
    // Sync local display theme when context theme changes (e.g. on initial load from context)
    setDisplayTheme(contextTheme);
  }, [contextTheme]);

  useEffect(() => {
    // Load other settings not managed by ThemeContext
    const loadOtherSettings = async () => {
      try {
        const settings = await StorageService.getSettings();
        setNotificationsEnabled(settings.notificationsEnabled);
        setNotificationDays(settings.notificationDays);
        // Theme is now primarily from context, but ensure consistency if needed
        if (settings.theme !== displayTheme) {
          setDisplayTheme(settings.theme); 
        }
      } catch (error) {
        console.error('Error loading non-theme settings:', error);
      }
    };
    loadOtherSettings();
  }, []); // Removed displayTheme from deps to avoid loop with contextTheme effect

  const handleThemeChange = async (newTheme: AppSettings['theme']) => {
    try {
      await setAppTheme(newTheme); // This updates context and storage
      setDisplayTheme(newTheme); // Update local display
      Alert.alert('Tema Aggiornato', `Il tema è stato impostato su: ${newTheme}.`);
      // The note about restarting is less relevant now as context should trigger UI updates.
    } catch (error) {
      console.error('Error updating theme:', error);
      Alert.alert("Errore", "Impossibile aggiornare il tema.");
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    try {
      setNotificationsEnabled(value);
      await StorageService.updateSettings({ notificationsEnabled: value });
      
      // Request permissions if enabling, though it's also done on app load.
      // This ensures if they were denied and re-enabled, we ask again.
      if (value) { 
        const granted = await NotificationService.requestPermissions();
        if(!granted) {
          Alert.alert("Permesso Negato", "Le notifiche non funzioneranno senza i permessi.");
          // Optionally, revert the toggle if permissions are critical and denied here
          // setNotificationsEnabled(false); 
          // await StorageService.updateSettings({ notificationsEnabled: false });
        }
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert("Errore", "Impossibile aggiornare le impostazioni di notifica.");
    }
  };

  const openDaysModal = () => {
    setDaysInput(notificationDays.toString());
    setIsDaysModalVisible(true);
  };

  const handleSaveNotificationDays = async () => {
    if (daysInput) {
      const days = parseInt(daysInput, 10);
      if (!isNaN(days) && days > 0 && days <= 30) { // Basic validation
        try {
          setNotificationDays(days);
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
    } else {
      Alert.alert('Valore Non Valido', 'Il campo non può essere vuoto.');
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
      const data = await StorageService.exportData();
      // In a real app, this would trigger file download or sharing
      Alert.alert('Esportazione', 'Dati esportati con successo!');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile esportare i dati.');
    }
  };

  const handleImportData = () => {
    // In a real app, this would open file picker
    Alert.alert('Importazione', 'Funzionalità di importazione in arrivo.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Impostazioni</Text>
          <Text style={styles.subtitle}>
            Personalizza l'app secondo le tue preferenze
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifiche</Text>
          
          <SettingsCard
            title="Notifiche Push"
            description="Ricevi avvisi per prodotti in scadenza"
            icon={<Bell size={24} color="#2563EB" />}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#f1f5f9', true: '#DBEAFE' }}
                thumbColor={notificationsEnabled ? '#2563EB' : '#94a3b8'}
              />
            }
          />

          <SettingsCard
            title="Giorni di Preavviso"
            description={`Ricevi notifiche ${notificationDays} giorni prima della scadenza`}
            icon={<Bell size={24} color="#F59E0B" />}
            rightElement={<Text style={styles.daysText}>{notificationDays}</Text>}
            onPress={openDaysModal}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aspetto</Text>
          <SettingsCard
            title="Tema App"
            description={`Attualmente: ${displayTheme.charAt(0).toUpperCase() + displayTheme.slice(1)}`}
            icon={
              displayTheme === 'light' ? <Sun size={24} color="#F59E0B" /> :
              displayTheme === 'dark' ? <Moon size={24} color="#6366F1" /> :
              <Smartphone size={24} color="#64748B" />
            }
            rightElement={<ChevronRight size={20} color="#94a3b8" />}
            onPress={() => {
              Alert.alert(
                'Scegli Tema',
                'Seleziona il tema desiderato:',
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
            description="Versione 1.0.0 - Smart Food Manager"
            icon={<Info size={24} color="#64748B" />}
            rightElement={<ChevronRight size={20} color="#94a3b8" />}
            onPress={() => {
              Alert.alert(
                'Smart Food Manager',
                'Versione 1.0.0\n\nGestione intelligente degli alimenti domestici con riconoscimento automatico e notifiche.'
              );
            }}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Smart Food Manager v1.0.0
          </Text>
          <Text style={styles.footerSubtext}>
            Gestione intelligente degli alimenti
          </Text>
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
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setIsDaysModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSaveNotificationDays}
              >
                <Text style={styles.modalButtonTextConfirm}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 12,
  },
  daysText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#334155',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  // Modal Styles (can be shared or moved to a common style sheet)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#1e293b',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
    color: '#1e293b',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#e2e8f0',
    marginRight: 10,
  },
  modalButtonConfirm: {
    backgroundColor: '#2563EB',
    marginLeft: 10,
  },
  modalButtonTextCancel: {
    color: '#1e293b',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  modalButtonTextConfirm: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});
