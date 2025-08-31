import { Tabs, useLocalSearchParams } from 'expo-router';
import { Home, Plus, Package, Settings, History } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedTabBar from '@/components/AnimatedTabBar';

// Esportazione predefinita del componente di layout delle tab
const TabLayout = () => {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useLocalSearchParams(); // Ottieni l'oggetto utente dai parametri

  return (
    <Tabs
      tabBar={props => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarTestID: 'dashboard-tab',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
        initialParams={{ user: user }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Prodotti',
          tabBarTestID: 'products-tab',
          tabBarIcon: ({ color, size }) => (
            <Package size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Aggiungi',
          tabBarTestID: 'add-tab',
          tabBarIcon: ({ color, size }) => (
            <Plus size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Storico',
          tabBarTestID: 'history-tab',
          tabBarIcon: ({ color, size }) => (
            <History size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Impostazioni',
          tabBarTestID: 'settings-tab',
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
