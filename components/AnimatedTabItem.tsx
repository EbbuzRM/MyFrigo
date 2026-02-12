import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';

interface TabBarRoute {
  key: string;
  name: string;
  params?: object;
}

interface TabItemProps {
  route: TabBarRoute;
  index: number;
  isFocused: boolean;
  label: string;
  onPress: () => void;
  onLongPress: () => void;
  tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
  tabBarAccessibilityLabel?: string;
  tabBarTestID?: string;
}

const AnimatedTabItem: React.FC<TabItemProps> = ({
  route,
  index,
  isFocused,
  label,
  onPress,
  onLongPress,
  tabBarIcon,
  tabBarAccessibilityLabel,
  tabBarTestID,
}) => {
  const { isDarkMode } = useTheme();

  // Hook chiamato sempre allo stesso livello - rispetta le Rules of Hooks
  const scale = useSharedValue(isFocused ? 1.1 : 1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Aggiorna l'animazione quando cambia isFocused
  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1.1 : 1, { duration: 100, dampingRatio: 1 });
  }, [isFocused]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={tabBarAccessibilityLabel}
      testID={tabBarTestID}
      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
      onPressIn={() => (scale.value = withSpring(1.1, { duration: 100, dampingRatio: 1 }))}
      onPressOut={() => (scale.value = withSpring(isFocused ? 1.1 : 1, { duration: 100, dampingRatio: 1 }))}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
    >
      <Animated.View style={animatedStyle}>
        {tabBarIcon &&
          tabBarIcon({ focused: isFocused, color: isFocused ? '#2563EB' : '#64748B', size: 24 })}
      </Animated.View>
      <Text
        style={{
          color: isFocused ? '#2563EB' : '#64748B',
          fontSize: 10,
          fontFamily: 'Inter-Medium',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
    paddingHorizontal: 2,
  },
});

export default AnimatedTabItem;