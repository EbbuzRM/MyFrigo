import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { UpdateModalStyles } from './UpdateModal.styles';
import { UpdateStatus } from './UpdateModalHeader';

interface UpdateActionsProps {
  styles: UpdateModalStyles;
  updateStatus: UpdateStatus;
  isDownloading: boolean;
  isInstalling: boolean;
  autoInstall: boolean;
  onLater: () => void;
  onInstall: () => void;
  onRestart: () => void;
}

export const UpdateActions: React.FC<UpdateActionsProps> = React.memo(({
  styles, updateStatus, isDownloading, isInstalling, autoInstall, onLater, onInstall, onRestart,
}) => {
  const showButtons = updateStatus === 'idle' || updateStatus === 'completed' || updateStatus === 'error';
  const showRestart = updateStatus === 'completed' && !autoInstall;
  if (!showButtons) return null;

  const PrimaryButton: React.FC<{ onPress: () => void; label: string }> = ({ onPress, label }) => (
    <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onPress}
      accessible accessibilityLabel={label} accessibilityRole="button">
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );

  if (updateStatus === 'error') {
    return <View style={styles.actions}><PrimaryButton onPress={onInstall} label="Riprova" /></View>;
  }

  if (showRestart) {
    return <View style={styles.actions}><PrimaryButton onPress={onRestart} label="Riavvia App" /></View>;
  }

  return (
    <View style={styles.actions}>
      <TouchableOpacity style={[styles.button, styles.laterButton]} onPress={onLater}
        accessible accessibilityLabel="Più tardi" accessibilityRole="button">
        <Text style={styles.buttonText}>Più tardi</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onInstall}
        disabled={isDownloading || isInstalling}
        accessible accessibilityLabel="Installa ora" accessibilityRole="button"
        accessibilityState={{ disabled: isDownloading || isInstalling }}>
        {isDownloading || isInstalling ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : <Text style={styles.primaryButtonText}>Installa ora</Text>}
      </TouchableOpacity>
    </View>
  );
});

UpdateActions.displayName = 'UpdateActions';
