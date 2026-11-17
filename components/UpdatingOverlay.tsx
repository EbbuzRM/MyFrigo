// UpdatingOverlay.tsx — UpdatingOverlay module.
//
// exports: UpdatingOverlay
// used_by: app\_layout.tsx
// rules:   - Purely presentational: visibility comes from UpdateContext.isApplyingUpdate; the minimum on-screen time is enforced there, not here.
//          - Colors come from useTheme(); no hardcoded palette.
// agent:   claude-opus-5-5 | 2026-11-17 | schermata "Aggiornamento in corso" per il flusso OTA automatico
// message:

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Modal, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';

const BAR_HEIGHT = 6;
const SEGMENT_RATIO = 0.35;
const SLIDE_DURATION_MS = 1200;

interface UpdatingOverlayProps {
  visible: boolean;
}

export function UpdatingOverlay({ visible }: UpdatingOverlayProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    progress.setValue(0);
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: SLIDE_DURATION_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [visible, progress]);

  const segmentWidth = trackWidth * SEGMENT_RATIO;
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-segmentWidth, trackWidth],
  });

  const onTrackLayout = (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width);

  if (!visible) return null;

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View
        testID="updating-overlay"
        style={[styles.container, { backgroundColor: colors.background }]}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('common.updatingTitle')}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('common.updatingTitle')}</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>{t('common.updatingMessage')}</Text>
        <View style={[styles.track, { backgroundColor: colors.cardBackground }]} onLayout={onTrackLayout}>
          <Animated.View
            style={[
              styles.segment,
              { width: segmentWidth, backgroundColor: colors.primary, transform: [{ translateX }] },
            ]}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    marginBottom: 28,
    textAlign: 'center',
  },
  track: {
    width: '80%',
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  segment: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
  },
});
