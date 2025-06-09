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

export default function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationDays, setNotificationDays] = useState(3);
  const [currentTheme, setCurrentTheme] = useState<AppSettings['theme']>('auto');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await StorageService.getSettings();
      setNotificationsEnabled(settings.notificationsEnabled);
      setNotificationDays(settings.notificationDays);
      setCurrentTheme(settings.theme);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleThemeChange = async (theme: AppSettings['theme']) => {
    try {
      setCurrentTheme(theme);
      await StorageService.updateSettings({ theme });
      Alert.alert('Tema Aggiornato', `Il tema è stato impostato su: ${theme}. Potrebbe essere necessario riavviare l'app per vedere tutte le modifiche.`);
      // Note: Actual theme application requires more setup (e.g., context, dynamic styles)
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

  const handleNotificationDaysChange = () => {
    Alert.prompt(
      'Giorni di Preavviso',
      'Inserisci il numero di giorni di preavviso per le notifiche (es. 1-7).',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async (daysStr) => {
            if (daysStr) {
              const days = parseInt(daysStr, 10);
              if (!isNaN(days) && days > 0 && days <= 30) { // Basic validation
                try {
                  setNotificationDays(days);
                  await StorageService.updateSettings({ notificationDays: days });
                  Alert.alert('Successo', `Giorni di preavviso impostati a ${days}.`);
                } catch (error) {
                  console.error('Error updating notification days:', error);
                  Alert.alert("Errore", "Impossibile aggiornare i giorni di preavviso.");
                }
              } else {
                Alert.alert('Valore Non Valido', 'Inserisci un numero di giorni valido (es. 1-30).');
              }
            }
          },
        },
      ],
      'plain-text', // Input type
      notificationDays.toString(), // Default value
      'numeric' // Keyboard type
    );
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
            onPress={handleNotificationDaysChange}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aspetto</Text>
          <SettingsCard
            title="Tema App"
            description={`Attualmente: ${currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}`}
            icon={
              currentTheme === 'light' ? <Sun size={24} color="#F59E0B" /> :
              currentTheme === 'dark' ? <Moon size={24} color="#6366F1" /> :
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
});
