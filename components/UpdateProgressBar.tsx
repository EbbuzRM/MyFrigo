// UpdateProgressBar.tsx — UpdateProgressBar module.
//
// exports: UpdateProgressBar
// used_by: components\UpdateModal.tsx
// rules:   - All React Native components in this module must accept and use `UpdateModalStyles` from `./UpdateModal.styles` for consistent theming
//          - Animated values (`Animated.Value`) must be passed as props, not created internally within components
//          - Components must use `React.memo` with explicit `displayName` for performance optimization
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import { View, Text, Animated } from 'react-native';
import { UpdateModalStyles } from './UpdateModal.styles';

interface UpdateProgressBarProps {
  styles: UpdateModalStyles;
  progressAnimation: Animated.Value;
  downloadProgress: number;
  isVisible: boolean;
}

export const UpdateProgressBar: React.FC<UpdateProgressBarProps> = React.memo(({
  styles,
  progressAnimation,
  downloadProgress,
  isVisible,
}) => {
  if (!isVisible) {
    return null;
  }

  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground}>
        <Animated.View
          style={[
            styles.progressBar,
            { width: progressWidth },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {Math.round(downloadProgress)}%
      </Text>
    </View>
  );
});

UpdateProgressBar.displayName = 'UpdateProgressBar';
