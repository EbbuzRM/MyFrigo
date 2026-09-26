// UpdateStatusMessage.tsx — UpdateStatusMessage module.
//
// exports: UpdateStatusMessage
// used_by: components\UpdateModal.tsx
// rules:   - The `UpdateStatusMessage` component must remain a pure presentational component with no side effects or direct state management
//          - All style dependencies must come exclusively from the injected `UpdateModalStyles` object, not from inline or local style definitions
//          - The component's rendering logic must strictly follow the `UpdateStatus` union type defined in `UpdateModalHeader`, with no additional status values introduced
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import { View, Text } from 'react-native';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
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

type StatusMessageKey =
  | 'common.updateDownloading'
  | 'common.updateInstalling'
  | 'common.updateInstallComplete'
  | 'common.updateDownloaded'
  | 'common.updateError'
  | 'common.updateNewVersion'
  | 'common.notAvailable';
type Translate = (key: StatusMessageKey, options?: { percent?: number; version?: string }) => string;

const getStatusMessageText = (
  t: Translate,
  status: UpdateStatus,
  downloadProgress: number,
  updateInfo: UpdateInfo | null | undefined,
  autoInstall: boolean
): string => {
  switch (status) {
    case 'downloading':
      return t('common.updateDownloading', { percent: Math.round(downloadProgress) });
    case 'installing':
      return autoInstall ? t('common.updateInstalling') : t('common.updateInstallComplete');
    case 'completed':
      return t('common.updateDownloaded');
    case 'error':
      return t('common.updateError');
    default:
      return t('common.updateNewVersion', {
        version: updateInfo?.availableVersion || t('common.notAvailable'),
      });
  }
};

export const UpdateStatusMessage: React.FC<UpdateStatusMessageProps> = React.memo(({
  styles,
  updateStatus,
  downloadProgress,
  updateInfo,
  autoInstall,
}) => {
  const { t } = useTranslation();
  const message = getStatusMessageText(t as Translate, updateStatus, downloadProgress, updateInfo, autoInstall);

  return (
    <View style={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        {t('common.updateAvailableTitle')}
      </Text>
      <Text style={styles.message} accessibilityLiveRegion="polite">
        {message}
      </Text>

      {updateStatus === 'idle' && (
        <View style={styles.versionInfo}>
          <Text style={styles.versionLabel}>{t('common.currentVersion')}</Text>
          <Text style={styles.versionText}>{Constants.expoConfig?.version || t('common.notAvailable')}</Text>
          <Text style={styles.versionLabel}>{t('common.newVersion')}</Text>
          <Text style={styles.versionText}>{updateInfo?.availableVersion || t('common.notAvailable')}</Text>
        </View>
      )}
    </View>
  );
});

UpdateStatusMessage.displayName = 'UpdateStatusMessage';
