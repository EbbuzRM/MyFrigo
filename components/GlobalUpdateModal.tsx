import React from 'react';
import { UpdateModal } from './UpdateModal';
import { useUpdate } from '@/context/UpdateContext';

/**
 * Componente globale per il modal degli aggiornamenti.
 * Renderizzato fuori dalla navigazione delle tab per garantire che sia sempre visibile sopra tutto.
 */
export const GlobalUpdateModal: React.FC = () => {
  const { showModal, hideModal, lastUpdateInfo, settings } = useUpdate();

  return (
    <UpdateModal
      visible={showModal}
      onClose={hideModal}
      updateInfo={lastUpdateInfo}
      autoInstall={settings.autoInstallEnabled}
    />
  );
};