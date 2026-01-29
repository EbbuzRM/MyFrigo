import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { Download, CheckCircle, X, RefreshCw } from 'lucide-react-native';
import { LoggingService } from '@/services/LoggingService';
import { UpdateService, UpdateInfo, DownloadProgress } from '@/services/UpdateService';
import { useTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  updateInfo?: UpdateInfo | null;
  autoInstall?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  onClose,
  updateInfo,
  autoInstall = false,
}) => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'downloading' | 'installing' | 'completed' | 'error'>('idle');
  const [progressAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && updateInfo?.isAvailable) {
      setUpdateStatus('idle');
      setDownloadProgress(0);
      setIsDownloading(false);
      setIsInstalling(false);
      
      // Animazione di entrata
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, updateInfo]);

  const handleDownloadAndInstall = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setUpdateStatus('downloading');
      setIsDownloading(true);

      // Scarica l'aggiornamento con callback di progresso
      const success = await UpdateService.downloadUpdate((progress: DownloadProgress) => {
        const percentage = (progress.totalBytesWritten / progress.totalBytes) * 100;
        setDownloadProgress(percentage);
        
        // Animazione della progressBar
        Animated.timing(progressAnimation, {
          toValue: percentage / 100,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setUpdateStatus('installing');
        setIsInstalling(true);

        if (autoInstall) {
          // Attendi un momento per mostrare il completamento
          setTimeout(async () => {
            await UpdateService.restartApp();
          }, 1500);
        } else {
          setTimeout(() => {
            setUpdateStatus('completed');
            setIsInstalling(false);
          }, 1000);
        }
      } else {
        throw new Error('Download fallito');
      }

    } catch (error) {
      LoggingService.error('UpdateModal', `Errore durante download/install: ${error}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setUpdateStatus('error');
      setIsDownloading(false);
      setIsInstalling(false);
    }
  };

  const handleLater = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleRestart = async () => {
    setUpdateStatus('installing');
    await UpdateService.restartApp();
  };

  const getStatusMessage = () => {
    switch (updateStatus) {
      case 'downloading':
        return `Download in corso... ${Math.round(downloadProgress)}%`;
      case 'installing':
        return autoInstall ? 'Installazione in corso...' : 'Installazione completata!';
      case 'completed':
        return 'Aggiornamento scaricato con successo!';
      case 'error':
        return 'Errore durante l\'aggiornamento. Riprova più tardi.';
      default:
        return `Nuova versione disponibile: ${updateInfo?.availableVersion || 'N/D'}`;
    }
  };

  const getStatusIcon = () => {
    switch (updateStatus) {
      case 'downloading':
        return <Download size={24} color={isDarkMode ? '#a78bfa' : '#7c3aed'} />;
      case 'installing':
        return <RefreshCw size={24} color={isDarkMode ? '#4ade80' : '#16a34a'} />;
      case 'completed':
        return <CheckCircle size={24} color={isDarkMode ? '#4ade80' : '#16a34a'} />;
      case 'error':
        return <X size={24} color={isDarkMode ? '#f87171' : '#dc2626'} />;
      default:
        return <Download size={24} color={isDarkMode ? '#a78bfa' : '#7c3aed'} />;
    }
  };

  const showProgress = updateStatus === 'downloading';
  const showButtons = updateStatus === 'idle' || updateStatus === 'completed' || updateStatus === 'error';
  const showRestartButton = updateStatus === 'completed' && !autoInstall;

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              {getStatusIcon()}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleLater}
              disabled={updateStatus === 'downloading' || updateStatus === 'installing'}
            >
              <X size={20} color={isDarkMode ? '#8b949e' : '#6b7280'} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>Aggiornamento Disponibile</Text>
            <Text style={styles.message}>
              {getStatusMessage()}
            </Text>

            {/* Progress Bar */}
            {showProgress && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      {
                        width: progressAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(downloadProgress)}%
                </Text>
              </View>
            )}

            {/* Version Info */}
            {updateStatus === 'idle' && (
              <View style={styles.versionInfo}>
                <Text style={styles.versionLabel}>Versione attuale:</Text>
                <Text style={styles.versionText}>{Constants.expoConfig?.version || 'N/D'}</Text>
                <Text style={styles.versionLabel}>Nuova versione:</Text>
                <Text style={styles.versionText}>{updateInfo?.availableVersion || 'N/D'}</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          {showButtons && (
            <View style={styles.actions}>
              {updateStatus === 'error' ? (
                <TouchableOpacity
                  style={[styles.button, styles.retryButton]}
                  onPress={handleDownloadAndInstall}
                >
                  <Text style={styles.retryButtonText}>Riprova</Text>
                </TouchableOpacity>
              ) : showRestartButton ? (
                <TouchableOpacity
                  style={[styles.button, styles.installButton]}
                  onPress={handleRestart}
                >
                  <Text style={styles.installButtonText}>Riavvia App</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.laterButton]}
                    onPress={handleLater}
                  >
                    <Text style={styles.laterButtonText}>Più tardi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.installButton]}
                    onPress={handleDownloadAndInstall}
                    disabled={isDownloading || isInstalling}
                  >
                    {isDownloading || isInstalling ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.installButtonText}>Installa ora</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderRadius: 16,
    width: Math.min(screenWidth - 40, 400),
    maxWidth: '100%',
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: isDarkMode ? '#21262d' : '#f9fafb',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  progressContainer: {
    width: '100%',
    marginTop: 20,
  },
  progressBackground: {
    height: 6,
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: isDarkMode ? '#8b949e' : '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  versionInfo: {
    width: '100%',
    marginTop: 20,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8fafc',
    borderRadius: 8,
    padding: 16,
  },
  versionLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748b',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  laterButton: {
    backgroundColor: isDarkMode ? '#30363d' : '#e5e7eb',
  },
  installButton: {
    backgroundColor: '#4f46e5',
  },
  retryButton: {
    backgroundColor: '#4f46e5',
    flex: 1,
  },
  laterButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#c9d1d9' : '#374151',
  },
  installButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});