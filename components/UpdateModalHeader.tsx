import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { X, Download, RefreshCw, CheckCircle } from 'lucide-react-native';
import { UpdateModalStyles } from './UpdateModal.styles';

export type UpdateStatus = 'idle' | 'downloading' | 'installing' | 'completed' | 'error';

interface UpdateModalHeaderProps {
  styles: UpdateModalStyles;
  updateStatus: UpdateStatus;
  isDarkMode: boolean;
  onClose: () => void;
  isClosable: boolean;
}

const getStatusIconColor = (status: UpdateStatus, isDarkMode: boolean): string => {
  switch (status) {
    case 'downloading':
      return isDarkMode ? '#a78bfa' : '#7c3aed';
    case 'installing':
    case 'completed':
      return isDarkMode ? '#4ade80' : '#16a34a';
    case 'error':
      return isDarkMode ? '#f87171' : '#dc2626';
    default:
      return isDarkMode ? '#a78bfa' : '#7c3aed';
  }
};

const StatusIcon: React.FC<{ status: UpdateStatus; color: string }> = React.memo(({ status, color }) => {
  switch (status) {
    case 'downloading':
      return <Download size={24} color={color} />;
    case 'installing':
      return <RefreshCw size={24} color={color} />;
    case 'completed':
      return <CheckCircle size={24} color={color} />;
    case 'error':
      return <X size={24} color={color} />;
    default:
      return <Download size={24} color={color} />;
  }
});

StatusIcon.displayName = 'StatusIcon';

export const UpdateModalHeader: React.FC<UpdateModalHeaderProps> = React.memo(({
  styles,
  updateStatus,
  isDarkMode,
  onClose,
  isClosable,
}) => {
  const iconColor = getStatusIconColor(updateStatus, isDarkMode);

  return (
    <View style={styles.header}>
      <View style={styles.iconContainer}>
        <StatusIcon status={updateStatus} color={iconColor} />
      </View>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
        disabled={!isClosable}
        accessible={true}
        accessibilityLabel="Chiudi modal aggiornamento"
        accessibilityRole="button"
        accessibilityState={{ disabled: !isClosable }}
      >
        <X size={20} color={isDarkMode ? '#8b949e' : '#6b7280'} />
      </TouchableOpacity>
    </View>
  );
});

UpdateModalHeader.displayName = 'UpdateModalHeader';
