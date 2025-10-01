import React, { ReactNode, memo, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react-native';

interface DiagnosticWrapperProps {
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: ReactNode;
  title?: string;
  showProgress?: boolean;
  progress?: {
    completed: number;
    total: number;
  };
}

export const DiagnosticWrapper: React.FC<DiagnosticWrapperProps> = memo(({
  isLoading = false,
  error = null,
  onRetry,
  children,
  title,
  showProgress = false,
  progress
}) => {
  const { isDarkMode } = useTheme();

  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

  const progressPercentage = useMemo(() => {
    if (!progress || progress.total === 0) return 0;
    return (progress.completed / progress.total) * 100;
  }, [progress]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertTriangle size={48} color={isDarkMode ? '#f85149' : '#dc2626'} />
        <Text style={styles.errorTitle}>Errore di Sistema</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <RefreshCw size={16} color="#ffffff" />
            <Text style={styles.retryButtonText}>Riprova</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDarkMode ? '#58a6ff' : '#3b82f6'} />
        {title && <Text style={styles.loadingTitle}>{title}</Text>}
        {showProgress && progress && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {progress.completed}/{progress.total} test completati
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
        )}
      </View>
    );
  }

  return <>{children}</>;
});

interface TestResultIndicatorProps {
  result?: {
    success: boolean;
    duration: number;
    error?: string;
  };
  size?: 'small' | 'medium' | 'large';
}

export const TestResultIndicator: React.FC<TestResultIndicatorProps> = memo(({
  result,
  size = 'medium'
}) => {
  const { isDarkMode } = useTheme();

  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

  const iconSize = useMemo(() => {
    return size === 'small' ? 16 : size === 'medium' ? 20 : 24;
  }, [size]);

  if (!result) {
    return <View style={[styles.indicator, styles.indicatorPending, getSizeStyle(size)]} />;
  }

  return (
    <View style={styles.resultContainer}>
      {result.success ? (
        <CheckCircle size={iconSize} color={isDarkMode ? '#238636' : '#10b981'} />
      ) : (
        <XCircle size={iconSize} color={isDarkMode ? '#da3633' : '#ef4444'} />
      )}
      <Text style={[styles.durationText, getSizeStyle(size)]}>
        {result.duration}ms
      </Text>
    </View>
  );
});

const getSizeStyle = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return { width: 20, height: 20 };
    case 'medium':
      return { width: 24, height: 24 };
    case 'large':
      return { width: 32, height: 32 };
    default:
      return { width: 24, height: 24 };
  }
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
    borderRadius: 12,
    margin: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDarkMode ? '#f85149' : '#dc2626',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: isDarkMode ? '#8b949e' : '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: isDarkMode ? '#238636' : '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
    borderRadius: 12,
    margin: 16,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginTop: 16,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  progressText: {
    fontSize: 14,
    color: isDarkMode ? '#8b949e' : '#64748b',
    marginBottom: 8,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: isDarkMode ? '#238636' : '#10b981',
    borderRadius: 2,
  },
  indicator: {
    borderRadius: 10,
    borderWidth: 2,
  },
  indicatorPending: {
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    borderColor: isDarkMode ? '#6e7681' : '#cbd5e1',
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: isDarkMode ? '#8b949e' : '#64748b',
    fontWeight: '500',
  },
});