// AnimatedTabBar.tsx — AnimatedTabBar module.
//
// exports: AnimatedTabBar
// used_by: .backup\_layout.tsx
//                   app\(tabs)\_layout.tsx
// rules:   - The AnimatedTabBar component must always receive bottomTabNavigator navigation props and must not be used outside a BottomTabNavigator context
//          - All tab items must be wrapped in AnimatedTabItem components; no direct tab rendering is permitted outside the AnimatedTabItem abstraction
//          - The component must always use useSafeAreaInsets for bottom padding and never hardcode tab bar bottom spacing
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';
import AnimatedTabItem from './AnimatedTabItem';
import { Route } from '@react-navigation/native';
import { BottomTabBarProps, BottomTabNavigationEventMap, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { NavigationHelpers, ParamListBase } from '@react-navigation/native';

interface TabPressEvent {
  defaultPrevented: boolean;
}

const AnimatedTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
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
      {state.routes.map((route: Route<string>, index: number) => {
        const descriptor = descriptors[route.key];
        
        // Salta il rendering se href è esplicitamente null (standard Expo Router)
        type ExtendedOptions = BottomTabNavigationOptions & { href?: string | null };
        const options = descriptor.options as ExtendedOptions;
        if (options.href === null) {
          return null;
        }

        const label = options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          LoggingService.info('AnimatedTabBar', `Tab pressed -> name: ${route.name}, index: ${index}`);

          const event = navigation.emit({
            type: 'tabPress' as const,
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !(event as TabPressEvent).defaultPrevented) {
            try {
              const tabNavigation = navigation as unknown as NavigationHelpers<ParamListBase, BottomTabNavigationEventMap> & { jumpTo?: (name: string) => void };
              if (tabNavigation.jumpTo) {
                tabNavigation.jumpTo(route.name);
                LoggingService.info('AnimatedTabBar', `navigation.jumpTo called for ${route.name}`);
              } else {
                navigation.navigate(route.name);
                LoggingService.info('AnimatedTabBar', `navigation.navigate called for ${route.name}`);
              }
            } catch (navError) {
              LoggingService.error('AnimatedTabBar', `Navigation error for ${route.name}`, navError);
            }
          } else {
            LoggingService.info('AnimatedTabBar', `Tab press ignored (isFocused=${isFocused}, defaultPrevented=${(event as TabPressEvent).defaultPrevented}) for ${route.name}`);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress' as const,
            target: route.key,
          });
        };

        return (
          <AnimatedTabItem
            key={route.key}
            route={route}
            index={index}
            isFocused={isFocused}
            label={label}
            onPress={onPress}
            onLongPress={onLongPress}
            tabBarIcon={options.tabBarIcon}
            tabBarAccessibilityLabel={options.tabBarAccessibilityLabel}
            tabBarTestID={`tab-${route.name}`}
          />
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
});

export default AnimatedTabBar;
