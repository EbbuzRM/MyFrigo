import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';
import AnimatedTabItem from './AnimatedTabItem';
import { NavigationState, Route } from '@react-navigation/native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

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
        const label = descriptor.options.title !== undefined ? descriptor.options.title : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          LoggingService.info('AnimatedTabBar', `Tab pressed -> name: ${route.name}, index: ${index}`);
    
          const event = navigation.emit({
            type: 'tabPress' as const,
            target: route.key,
            canPreventDefault: true,
          });
    
          if (!isFocused && !(event as any).defaultPrevented) {
            try {
              // Prefer jumpTo for tab navigators when available to ensure tab switch behavior
              if ((navigation as any).jumpTo) {
                (navigation as any).jumpTo(route.name);
                LoggingService.info('AnimatedTabBar', `navigation.jumpTo called for ${route.name}`);
              } else {
                navigation.navigate(route.name);
                LoggingService.info('AnimatedTabBar', `navigation.navigate called for ${route.name}`);
              }
            } catch (navError) {
              LoggingService.error('AnimatedTabBar', `Navigation error for ${route.name}`, navError);
            }
          } else {
            LoggingService.info('AnimatedTabBar', `Tab press ignored (isFocused=${isFocused}, defaultPrevented=${(event as any).defaultPrevented}) for ${route.name}`);
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
            tabBarIcon={descriptor.options.tabBarIcon}
            tabBarAccessibilityLabel={descriptor.options.tabBarAccessibilityLabel}
            tabBarTestID={undefined}
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
