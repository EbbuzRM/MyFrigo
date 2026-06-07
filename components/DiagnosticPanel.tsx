// DiagnosticPanel.tsx — DiagnosticPanel module.
//
// exports: DiagnosticPanel
// used_by: app\(tabs)\settings.tsx
// rules:   - All child diagnostic components (AuthTestSection, DatabaseTestSection, PerformanceTestSection, DiagnosticControls) must use the shared `useDiagnosticTests` hook for state management and test execution coordination.
//          - All log operations must go through `LoggingService`; direct file system or storage access for logs is prohibited.
//          - Theme dependency via `useTheme()` and `getStyles(isDarkMode)` must be consistently applied across all diagnostic sub-components.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useDiagnosticTests } from '@/hooks/useDiagnosticTests';
import { AuthTestSection } from '@/components/diagnostic/AuthTestSection';
import { DatabaseTestSection } from '@/components/diagnostic/DatabaseTestSection';
import { PerformanceTestSection } from '@/components/diagnostic/PerformanceTestSection';
import { DiagnosticControls } from '@/components/diagnostic/DiagnosticControls';
import { LoggingService } from '@/services/LoggingService';
import { supabase } from '@/services/supabaseClient';

interface DiagnosticPanelProps {
  onClose: () => void;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({ onClose }) => {
  const { isDarkMode } = useTheme();
  const {
    availableTests,
    isRunning,
    results,
    runAllTests,
    runTest
  } = useDiagnosticTests();

  const [logs, setLogs] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(false);

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const logData = await LoggingService.getLogs();
      setLogs(logData);
    } catch (error) {
      console.error('Errore nel caricamento dei log:', error);
      setLogs('Errore nel caricamento dei log');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      setLoadingLogs(true);
      await LoggingService.clearLogs();
      setLogs('');
    } catch (error) {
      console.error('Errore nella cancellazione dei log:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleResetTestUsers = async () => {
    Alert.alert(
      'Reset Test Users',
      'Sei sicuro di voler cancellare tutti gli utenti di test? Questa operazione è irreversibile.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Sì, Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data, error } = await supabase.functions.invoke('delete-all-users', {
                method: 'POST',
              });
              if (error) throw error;
              Alert.alert('Successo', 'Tutti gli utenti di test sono stati rimossi.');
            } catch (error: any) {
              console.error('Errore durante il reset degli utenti:', error);
              Alert.alert('Errore', `Impossibile resettare gli utenti: ${error.message || 'Errore sconosciuto'}`);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const styles = getStyles(isDarkMode);
  const completedTests = results.length;

  return (
    <View style={styles.container} testID="diagnostic-panel">
      <View style={styles.header}>
        <Text style={styles.headerText}>Pannello Diagnostico</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Chiudi</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <DiagnosticControls
          onRunAllTests={runAllTests}
          isRunning={isRunning}
          completedTests={completedTests}
          testCount={availableTests.length}
        />

        <AuthTestSection
          tests={availableTests.filter(test => test.category === 'auth')}
          onRunTest={runTest}
          results={results}
          isRunning={isRunning}
        />

        <DatabaseTestSection
          tests={availableTests.filter(test => test.category === 'database')}
          onRunTest={runTest}
          results={results}
          isRunning={isRunning}
        />

        <PerformanceTestSection
          tests={availableTests.filter(test => test.category === 'performance')}
          onRunTest={runTest}
          results={results}
          isRunning={isRunning}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manutenzione Sistema</Text>
          <TouchableOpacity 
            style={[styles.logButton, styles.clearButton]} 
            onPress={handleResetTestUsers}
            testID="reset-test-users-button"
          >
            <Text style={[styles.logButtonText, styles.clearButtonText]}>Reset Test Users</Text>
          </TouchableOpacity>
        </View>

        {/* Log Viewer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log dell'App</Text>
          <View style={styles.logControls}>
            <TouchableOpacity style={styles.logButton} onPress={loadLogs} disabled={loadingLogs}>
              <Text style={styles.logButtonText}>{loadingLogs ? 'Caricamento...' : 'Aggiorna Log'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.logButton, styles.clearButton]} onPress={handleClearLogs}>
              <Text style={[styles.logButtonText, styles.clearButtonText]}>Cancella Log</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.logContainer}>
            <Text style={styles.logText}>{logs || 'Nessun log disponibile'}</Text>
          </View>
        </View>

        <Text style={styles.infoText}>
          Questi test verificano il corretto funzionamento del sistema MyFrigo, inclusi autenticazione, inserimento prodotti,
          connettività database, performance API, integrità dati, cache, sessioni utente e salute generale del sistema.
          I risultati dei test saranno visualizzati tramite alert e registrati nei log dell'applicazione per analisi dettagliate.
        </Text>
      </ScrollView>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
    margin: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: isDarkMode ? '#161b22' : '#e2e8f0',
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#30363d' : '#cbd5e1',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  closeButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: isDarkMode ? '#21262d' : '#cbd5e1',
  },
  closeButtonText: {
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 12,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  testButton: {
    backgroundColor: isDarkMode ? '#21262d' : '#e2e8f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
  },
  testButtonText: {
    color: isDarkMode ? '#58a6ff' : '#3b82f6',
    fontWeight: '500',
    textAlign: 'center',
  },
  allTestsButton: {
    backgroundColor: isDarkMode ? '#238636' : '#10b981',
    borderColor: isDarkMode ? '#2ea043' : '#059669',
  },
  infoText: {
    fontSize: 14,
    color: isDarkMode ? '#8b949e' : '#64748b',
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 20,
  },
  section: {
    marginVertical: 12,
  },
  logControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  logButton: {
    flex: 1,
    backgroundColor: isDarkMode ? '#21262d' : '#e2e8f0',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    alignItems: 'center',
  },
  logButtonText: {
    color: isDarkMode ? '#58a6ff' : '#3b82f6',
    fontWeight: '500',
    fontSize: 14,
  },
  clearButton: {
    backgroundColor: isDarkMode ? '#da3633' : '#ef4444',
    borderColor: isDarkMode ? '#f85149' : '#dc2626',
  },
  clearButtonText: {
    color: '#ffffff',
  },
  logContainer: {
    backgroundColor: isDarkMode ? '#161b22' : '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  logText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    lineHeight: 18,
  },
});
