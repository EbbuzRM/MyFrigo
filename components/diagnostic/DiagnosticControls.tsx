import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Play, Square } from 'lucide-react-native';

interface DiagnosticControlsProps {
  isRunning: boolean;
  onRunAllTests: () => void;
  onStopTests?: () => void;
  testCount: number;
  completedTests: number;
}

export const DiagnosticControls: React.FC<DiagnosticControlsProps> = memo(({
  isRunning,
  onRunAllTests,
  onStopTests,
  testCount,
  completedTests
}) => {
  const { isDarkMode } = useTheme();

  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

  const progressPercentage = useMemo(() => {
    return testCount > 0 ? (completedTests / testCount) * 100 : 0;
  }, [completedTests, testCount]);

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {completedTests}/{testCount} test completati
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercentage}%` }
            ]}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.runAllButton,
          isRunning && styles.runAllButtonRunning
        ]}
        onPress={isRunning ? onStopTests : onRunAllTests}
        disabled={false}
      >
        {isRunning ? (
          <>
            <ActivityIndicator size="small" color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.runAllButtonText}>Esecuzione Test...</Text>
          </>
        ) : (
          <>
            <Play size={20} color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.runAllButtonText}>Esegui Tutti i Test</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.infoText}>
        I test verificano il corretto funzionamento del sistema MyFrigo, inclusi autenticazione,
        connettività database, performance API e salute generale del sistema.
      </Text>
    </View>
  );
});

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: isDarkMode ? '#161b22' : '#e2e8f0',
    borderRadius: 12,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: isDarkMode ? '#238636' : '#10b981',
    borderRadius: 2,
  },
  runAllButton: {
    backgroundColor: isDarkMode ? '#238636' : '#10b981',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  runAllButtonRunning: {
    backgroundColor: isDarkMode ? '#da3633' : '#ef4444',
  },
  buttonIcon: {
    marginRight: 4,
  },
  runAllButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: isDarkMode ? '#8b949e' : '#64748b',
    marginTop: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});