import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, ViewStyle } from 'react-native';
import { UpdateModal } from './UpdateModal';
import { UpdateInfo, UpdateSettings } from '@/services/UpdateService';

interface GlobalUpdateModalProps {
  showModal: boolean;
  hideModal: () => void;
  lastUpdateInfo: UpdateInfo | null;
  settings: UpdateSettings;
}

/**
 * Componente globale per il modal degli aggiornamenti.
 * Sostituisce il componente Modal integrato con un'implementazione custom
 * posizionata assolutamente per garantire che sia sempre sopra tutto.
 */
export const GlobalUpdateModal: React.FC<GlobalUpdateModalProps> = ({
  showModal,
  hideModal,
  lastUpdateInfo,
  settings,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = React.useState(showModal);

  useEffect(() => {
    if (showModal) {
      setIsVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    }
  }, [showModal]);

  if (!isVisible && !showModal) return null;

  return (
    <Animated.View
      style={[
        styles.modalWrapper,
        { opacity: fadeAnim }
      ]}
      pointerEvents={showModal ? 'auto' : 'none'}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={hideModal}
      />
      <UpdateModal
        visible={showModal}
        onClose={hideModal}
        updateInfo={lastUpdateInfo}
        autoInstall={settings.autoInstallEnabled}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    elevation: 999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
});