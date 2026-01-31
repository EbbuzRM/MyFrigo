import React from 'react';
import { View, Text } from 'react-native';
import Constants from 'expo-constants';
import { UpdateModalStyles } from './UpdateModal.styles';
import { UpdateStatus } from './UpdateModalHeader';
import { UpdateInfo } from '@/services/UpdateService';

interface UpdateStatusMessageProps {
  styles: UpdateModalStyles;
  updateStatus: UpdateStatus;
  downloadProgress: number;
  updateInfo: UpdateInfo | null | undefined;
  autoInstall: boolean;
}

const getStatusMessageText = (
  status: UpdateStatus,
  downloadProgress: number,
  updateInfo: UpdateInfo | null | undefined,
  autoInstall: boolean
): string => {
  switch (status) {
    case 'downloading':
      return `Download in corso... ${Math.round(downloadProgress)}%`;
    case 'installing':
      return autoInstall ? 'Installazione in corso...' : 'Installazione completata!';
    case 'completed':
      return 'Aggiornamento scaricato con successo!';
    case 'error':
      return "Errore durante l'aggiornamento. Riprova più tardi.";
    default:
      return `Nuova versione disponibile: ${updateInfo?.availableVersion || 'N/D'}`;
  }
};

export const UpdateStatusMessage: React.FC<UpdateStatusMessageProps> = React.memo(({
  styles,
  updateStatus,
  downloadProgress,
  updateInfo,
  autoInstall,
}) => {
  const message = getStatusMessageText(updateStatus, downloadProgress, updateInfo, autoInstall);

  return (
    <View style={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        Aggiornamento Disponibile
      </Text>
      <Text style={styles.message} accessibilityLiveRegion="polite">
        {message}
      </Text>

      {updateStatus === 'idle' && (
        <View style={styles.versionInfo}>
          <Text style={styles.versionLabel}>Versione attuale:</Text>
          <Text style={styles.versionText}>{Constants.expoConfig?.version || 'N/D'}</Text>
          <Text style={styles.versionLabel}>Nuova versione:</Text>
          <Text style={styles.versionText}>{updateInfo?.availableVersion || 'N/D'}</Text>
        </View>
      )}
    </View>
  );
});

UpdateStatusMessage.displayName = 'UpdateStatusMessage';
