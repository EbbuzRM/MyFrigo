import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LoggingService } from '@/services/LoggingService';
import { UpdateService, UpdateInfo, DownloadProgress } from '@/services/UpdateService';
import { useTheme } from '@/context/ThemeContext';
import { useUpdateAnimation } from '@/hooks/useUpdateAnimation';
import { createUpdateModalStyles } from './UpdateModal.styles';
import { UpdateModalHeader, UpdateStatus } from './UpdateModalHeader';
import { UpdateProgressBar } from './UpdateProgressBar';
import { UpdateStatusMessage } from './UpdateStatusMessage';
import { UpdateActions } from './UpdateActions';

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  updateInfo?: UpdateInfo | null;
  autoInstall?: boolean;
}

export const UpdateModal: React.FC<UpdateModalProps> = React.memo(({
  visible, onClose, updateInfo, autoInstall = false,
}) => {
  const { isDarkMode } = useTheme();
  const styles = useMemo(() => createUpdateModalStyles(isDarkMode), [isDarkMode]);
  const { progressAnimation, animateProgress, animateFadeIn, resetAnimations } = useUpdateAnimation();

  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');

  const isClosable = useMemo(() => updateStatus !== 'downloading' && updateStatus !== 'installing', [updateStatus]);
  const showProgress = useMemo(() => updateStatus === 'downloading', [updateStatus]);

  useEffect(() => {
    if (visible && updateInfo?.isAvailable) {
      setUpdateStatus('idle'); setDownloadProgress(0); setIsDownloading(false); setIsInstalling(false);
      resetAnimations();
    }
  }, [visible, updateInfo, resetAnimations]);

  const handleDownloadAndInstall = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setUpdateStatus('downloading'); setIsDownloading(true);

      const success = await UpdateService.downloadUpdate((progress: DownloadProgress) => {
        const percentage = (progress.totalBytesWritten / progress.totalBytes) * 100;
        setDownloadProgress(percentage); animateProgress(percentage / 100);
      });

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUpdateStatus('installing'); setIsInstalling(true);
        setTimeout(async () => {
          if (autoInstall) await UpdateService.restartApp();
          else { setUpdateStatus('completed'); setIsInstalling(false); }
        }, autoInstall ? 1500 : 1000);
      } else { throw new Error('Download fallito'); }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Errore sconosciuto';
      LoggingService.error('UpdateModal', `Errore: ${msg}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setUpdateStatus('error'); setIsDownloading(false); setIsInstalling(false);
    }
  }, [autoInstall, animateProgress]);

  const handleLater = useCallback(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }, [onClose]);
  const handleRestart = useCallback(async () => { setUpdateStatus('installing'); await UpdateService.restartApp(); }, []);

  return (
    <View style={styles.modalContainer}>
      <UpdateModalHeader styles={styles} updateStatus={updateStatus} isDarkMode={isDarkMode}
        onClose={handleLater} isClosable={isClosable} />
      <UpdateStatusMessage styles={styles} updateStatus={updateStatus} downloadProgress={downloadProgress}
        updateInfo={updateInfo} autoInstall={autoInstall} />
      <UpdateProgressBar styles={styles} progressAnimation={progressAnimation}
        downloadProgress={downloadProgress} isVisible={showProgress} />
      <UpdateActions styles={styles} updateStatus={updateStatus} isDownloading={isDownloading}
        isInstalling={isInstalling} autoInstall={autoInstall} onLater={handleLater}
        onInstall={handleDownloadAndInstall} onRestart={handleRestart} />
    </View>
  );
});

UpdateModal.displayName = 'UpdateModal';
