import { StyleSheet } from 'react-native';

export const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    label: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 8,
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    dateInputTouchable: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
    },
    dateTextValue: {
      fontSize: 16,
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    input: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
      backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    photoButton: {
      backgroundColor: isDarkMode ? '#238636' : '#10b981',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    photoButtonText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '500',
    },
    saveButton: {
      backgroundColor: isDarkMode ? '#238636' : '#10b981',
      padding: 16,
      borderRadius: 8,
      marginTop: 20,
      marginBottom: 20,
    },
    saveButtonText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: '#9ca3af',
    },
    addButton: {
      backgroundColor: isDarkMode ? '#21262d' : '#e2e8f0',
      padding: 10,
      borderRadius: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
      alignItems: 'center',
    },
    addButtonText: {
      color: isDarkMode ? '#58a6ff' : '#3b82f6',
      fontWeight: '500',
    },
    quantitiesSummary: {
      backgroundColor: isDarkMode ? '#21262d' : '#f1f5f9',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    },
    quantitiesSummaryText: {
      fontSize: 14,
      color: isDarkMode ? '#8b949e' : '#475569',
      textAlign: 'center',
      fontStyle: 'italic',
    },
    helperText: {
      fontSize: 12,
      color: isDarkMode ? '#8b949e' : '#64748b',
      marginBottom: 8,
      fontStyle: 'italic',
    },
  });
