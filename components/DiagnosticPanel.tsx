import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useDiagnosticTests } from '@/hooks/useDiagnosticTests';
import { AuthTestSection } from '@/components/diagnostic/AuthTestSection';
import { DatabaseTestSection } from '@/components/diagnostic/DatabaseTestSection';
import { PerformanceTestSection } from '@/components/diagnostic/PerformanceTestSection';
import { DiagnosticControls } from '@/components/diagnostic/DiagnosticControls';

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

  const styles = getStyles(isDarkMode);
  const completedTests = results.length;

  return (
    <View style={styles.container}>
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
    marginTop: 8, // Ridotto da 16 a 8 per avvicinare il testo
    marginBottom: 16, // Aggiunto margine inferiore per separazione
    lineHeight: 20,
  },
});
