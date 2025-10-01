import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { Tabs } from 'expo-router';
import { LoggingService } from '@/services/LoggingService';

interface AnimatedTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({ state, descriptors, navigation }) => {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      testID="tab-bar"
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: isDarkMode ? '#121212' : '#ffffff',
          borderTopColor: isDarkMode ? '#272727' : '#f1f5f9',
          paddingBottom: insets.bottom + 5,
          height: 60 + insets.bottom,
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;

        const scale = useSharedValue(isFocused ? 1.1 : 1);

        const animatedStyle = useAnimatedStyle(() => {
          return {
            transform: [{ scale: scale.value }],
          };
        });

        const onPress = () => {
          LoggingService.info('AnimatedTabBar', `Tab pressed -> name: ${route.name}, index: ${index}`);
    
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
    
          if (!isFocused && !event.defaultPrevented) {
            try {
              // Prefer jumpTo for tab navigators when available to ensure tab switch behavior
              if (typeof navigation.jumpTo === 'function') {
                navigation.jumpTo(route.name);
                LoggingService.info('AnimatedTabBar', `navigation.jumpTo called for ${route.name}`);
              } else {
                navigation.navigate(route.name);
                LoggingService.info('AnimatedTabBar', `navigation.navigate called for ${route.name}`);
              }
            } catch (navError) {
              LoggingService.error('AnimatedTabBar', `Navigation error for ${route.name}`, navError);
            }
          } else {
            LoggingService.info('AnimatedTabBar', `Tab press ignored (isFocused=${isFocused}, defaultPrevented=${event.defaultPrevented}) for ${route.name}`);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            onPressIn={() => (scale.value = withSpring(1.1, { duration: 100, dampingRatio: 1 }))}
            onPressOut={() => (scale.value = withSpring(isFocused ? 1.1 : 1, { duration: 100, dampingRatio: 1 }))}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            <Animated.View style={animatedStyle}>
              {options.tabBarIcon &&
                options.tabBarIcon({ color: isFocused ? '#2563EB' : '#64748B', size: 24 })}
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
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
    paddingHorizontal: 2,
  },
});

export default AnimatedTabBar;
