import { StyleSheet } from 'react-native';

/**
 * Styles for ConsumeQuantityModal and its sub-components
 */
export const getConsumeQuantityModalStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 20,
    },
    modalContent: {
      width: '90%',
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      maxHeight: '80%',
      backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    title: {
      flex: 1,
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      textAlign: 'center',
      marginLeft: 8,
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    closeButton: {
      padding: 4,
    },
    description: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 22,
      color: isDarkMode ? '#8b949e' : '#64748b',
    },
    inputContainer: {
      marginBottom: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      backgroundColor: isDarkMode ? '#21262d' : '#f8f9fa',
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    error: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      marginTop: 4,
      textAlign: 'center',
      color: '#ef4444',
    },
    buttonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
    },
    cancelButton: {
      backgroundColor: isDarkMode ? '#21262d' : '#f8f9fa',
      borderWidth: 1,
      borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
    },
    confirmButton: {
      backgroundColor: '#16a34a',
    },
    confirmButtonDisabled: {
      backgroundColor: '#9ca3af',
    },
    buttonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#ffffff',
    },
    cancelButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
  });
