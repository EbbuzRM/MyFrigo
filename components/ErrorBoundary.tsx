// ErrorBoundary.tsx — ErrorBoundary module.
//
// exports: ErrorBoundary
// used_by: app\_layout.tsx
// rules:   - The `fallback` prop is the sole extension point for error UI customization; any modifications to error presentation must preserve or delegate to this prop.
//          - This component must remain a class component extending `React.Component` as it relies on `getDerivedStateFromError` and `componentDidCatch` lifecycle methods.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LoggingService } from '@/services/LoggingService';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    LoggingService.error('ErrorBoundary', 'UI Error', { error, errorInfo });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Qualcosa è andato storto</Text>
          <Text style={styles.message}>Riprova ad aprire l'app</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
});