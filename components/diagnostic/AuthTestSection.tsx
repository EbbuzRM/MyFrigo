import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { DiagnosticTest, TestResult } from '@/hooks/useDiagnosticTests';

interface AuthTestSectionProps {
  tests: DiagnosticTest[];
  results: TestResult[];
  isRunning: boolean;
  onRunTest: (testId: string) => void;
}

export const AuthTestSection: React.FC<AuthTestSectionProps> = ({
  tests,
  results,
  isRunning,
  onRunTest
}) => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const authTests = tests.filter(test => test.category === 'auth');
  const authResults = results.filter(result => authTests.some(test => test.id === result.testId));

  const getTestResult = (testId: string) => {
    return authResults.find(result => result.testId === testId);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Test Autenticazione</Text>

      {authTests.map(test => {
        const result = getTestResult(test.id);
        const isLoading = isRunning && !result;

        return (
          <View key={test.id} style={styles.testContainer}>
            <TouchableOpacity
              style={[
                styles.testButton,
                result?.success === true && styles.testButtonSuccess,
                result?.success === false && styles.testButtonError,
                isLoading && styles.testButtonLoading
              ]}
              onPress={() => onRunTest(test.id)}
              disabled={isLoading}
            >
              <View style={styles.testContent}>
                <Text style={[
                  styles.testButtonText,
                  (result?.success === false || isLoading) && styles.testButtonTextLight
                ]}>
                  {test.name}
                </Text>

                {isLoading && (
                  <ActivityIndicator
                    size="small"
                    color={isDarkMode ? '#58a6ff' : '#3b82f6'}
                    style={styles.loader}
                  />
                )}

                {result && (
                  <View style={styles.resultContainer}>
                    <Text style={[
                      styles.resultText,
                      result.success ? styles.resultSuccess : styles.resultError
                    ]}>
                      {result.success ? '✅' : '❌'} {result.duration}ms
                    </Text>
                    {result.error && (
                      <Text style={styles.errorText} numberOfLines={2}>
                        {result.error}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  testContainer: {
    marginBottom: 8,
  },
  testButton: {
    backgroundColor: isDarkMode ? '#21262d' : '#e2e8f0',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
  },
  testButtonSuccess: {
    backgroundColor: isDarkMode ? '#0a2814' : '#ecfdf5',
    borderColor: isDarkMode ? '#2ea043' : '#10b981',
  },
  testButtonError: {
    backgroundColor: isDarkMode ? '#2d0f0f' : '#fef2f2',
    borderColor: isDarkMode ? '#da3633' : '#ef4444',
  },
  testButtonLoading: {
    opacity: 0.7,
  },
  testContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testButtonText: {
    color: isDarkMode ? '#58a6ff' : '#3b82f6',
    fontWeight: '500',
    flex: 1,
  },
  testButtonTextLight: {
    color: isDarkMode ? '#8b949e' : '#64748b',
  },
  loader: {
    marginLeft: 8,
  },
  resultContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultSuccess: {
    color: isDarkMode ? '#2ea043' : '#10b981',
  },
  resultError: {
    color: isDarkMode ? '#da3633' : '#ef4444',
  },
  errorText: {
    fontSize: 10,
    color: isDarkMode ? '#da3633' : '#ef4444',
    marginTop: 2,
    textAlign: 'right',
  },
});