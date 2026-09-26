// _layout.tsx — _layout module.
//
// exports: TabLayout
// used_by: none
// rules:   - The TabLayout component uses `AnimatedTabBar` as a custom tab bar; do not replace or remove it without updating the corresponding component module.
//          - All tab screens defined here must match actual file names inside `app/(tabs)/` directory; adding or removing tabs requires corresponding file changes.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { Tabs, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Home, Plus, Package, Settings, History } from 'lucide-react-native';
import AnimatedTabBar from '@/components/AnimatedTabBar';

// Esportazione predefinita del componente di layout delle tab
const TabLayout = () => {
  const { user } = useLocalSearchParams(); // Ottieni l'oggetto utente dai parametri
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={props => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('common.tabHome'),
          tabBarAccessibilityLabel: t('common.tabHomeLabel'),

          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
        initialParams={{ user: user }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: t('common.tabProducts'),
          tabBarAccessibilityLabel: t('common.tabProductsLabel'),
          tabBarIcon: ({ color, size }) => (
            <Package size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: t('common.tabAdd'),
          tabBarAccessibilityLabel: t('common.tabAddLabel'),
          tabBarIcon: ({ color, size }) => (
            <Plus size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('common.tabHistory'),
          tabBarAccessibilityLabel: t('common.tabHistoryLabel'),
          tabBarIcon: ({ color, size }) => (
            <History size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('common.tabSettings'),
          tabBarAccessibilityLabel: t('common.tabSettingsLabel'),
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

// Assicuriamoci che l'esportazione predefinita sia chiara
export default TabLayout;