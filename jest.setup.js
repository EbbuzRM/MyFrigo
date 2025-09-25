// Jest setup file
import 'react-native-gesture-handler/jestSetup';

// Mock Platform before other imports
jest.mock('react-native/Libraries/Utilities/Platform', () => {
  const Platform = {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  };
  
  // Rendi Platform scrivibile per i test che devono modificarlo
  Object.defineProperty(Platform, 'OS', {
    writable: true,
    value: 'ios',
  });
  
  return Platform;
});

// Mock anche l'import diretto da react-native
jest.mock('react-native', () => {
  const React = require('react');
  
  // Mock per i componenti principali
  const View = (props) => React.createElement('View', props);
  const Text = (props) => React.createElement('Text', props);
  const TouchableOpacity = (props) => React.createElement('TouchableOpacity', props);
  const StyleSheet = {
    create: (styles) => styles,
    flatten: (style) => style,
  };
  const Pressable = (props) => React.createElement('Pressable', props);
  const FlatList = (props) => React.createElement('FlatList', props);
  const ScrollView = (props) => React.createElement('ScrollView', props);
  const Image = (props) => React.createElement('Image', props);
  const TextInput = (props) => React.createElement('TextInput', props);
  const Switch = (props) => React.createElement('Switch', props);
  const SafeAreaView = (props) => React.createElement('SafeAreaView', props);
  const StatusBar = (props) => React.createElement('StatusBar', props);
  const Dimensions = {
    get: jest.fn(() => ({ width: 375, height: 667 })),
  };
  const Animated = {
    createAnimatedComponent: (component) => component,
    View: View,
    Text: Text,
    TouchableOpacity: TouchableOpacity,
  };
  const Easing = {
    ease: jest.fn(),
  };
  const TouchableHighlight = (props) => React.createElement('TouchableHighlight', props);
  const TouchableWithoutFeedback = (props) => React.createElement('TouchableWithoutFeedback', props);
  const Alert = {
    alert: jest.fn(),
  };
  const BackHandler = {
    addEventListener: jest.fn(),
  };
  const Keyboard = {
    dismiss: jest.fn(),
  };
  const KeyboardAvoidingView = (props) => React.createElement('KeyboardAvoidingView', props);
  
  // Mock per Modal che non dipende da Platform
  const Modal = (props) => {
    return React.createElement(View, props);
  };
  
  return {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Pressable,
    FlatList,
    ScrollView,
    Image,
    TextInput,
    Switch,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Animated,
    Easing,
    TouchableHighlight,
    TouchableWithoutFeedback,
    Alert,
    BackHandler,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Animated: {
      ...Animated,
      View: Animated.createAnimatedComponent(View),
      Text: Animated.createAnimatedComponent(Text),
      TouchableOpacity: Animated.createAnimatedComponent(TouchableOpacity),
    },
  };
});

// Mock expo modules
jest.mock('expo', () => ({
  ...jest.requireActual('expo'),
  Asset: {
    fromModule: jest.fn(() => ({
      downloadAsync: jest.fn(),
      localUri: 'mock-uri',
    })),
  },
  Constants: {
    expoConfig: {
      extra: {
        supabaseUrl: 'mock-url',
        supabaseAnonKey: 'mock-key',
      },
    },
  },
  Notifications: {
    getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-token' })),
    addNotificationReceivedListener: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn(),
  },
  TaskManager: {
    defineTask: jest.fn(),
    isTaskRegisteredAsync: jest.fn(() => Promise.resolve(false)),
    unregisterTaskAsync: jest.fn(),
  },
  BackgroundTask: {
    defineTask: jest.fn(),
    isTaskRegisteredAsync: jest.fn(() => Promise.resolve(false)),
    unregisterTaskAsync: jest.fn(),
  },
}));

// Mock __ExpoImportMetaRegistry
Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
value: {
  url: 'http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.myfrigo',
},
writable: true,
enumerable: false,
configurable: true,
});

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid'),
}));

// Mock expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(() => ({
      downloadAsync: jest.fn(),
      localUri: 'mock-uri',
    })),
  },
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      supabaseUrl: 'mock-url',
      supabaseAnonKey: 'mock-key',
    },
  },
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'mock-token' })),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

// Mock expo-task-manager
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(() => Promise.resolve(false)),
  unregisterTaskAsync: jest.fn(),
}));

// Mock expo-background-task
jest.mock('expo-background-task', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(() => Promise.resolve(false)),
  unregisterTaskAsync: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-reanimated with a simpler approach
jest.mock('react-native-reanimated', () => {
  const View = require('react-native/Libraries/Components/View/View');
  const Text = require('react-native/Libraries/Text/Text');
  
  // Mock shared value
  const mockSharedValue = (value) => ({
    value,
    _isReanimatedSharedValue: true,
  });
  
  // Mock animated style
  const mockUseAnimatedStyle = (updater) => {
    return updater();
  };
  
  return {
    default: {
      View: View,
      Text: Text,
      Image: View,
      ScrollView: View,
      FlatList: View,
      call: () => {},
    },
    View: View,
    Text: Text,
    Image: View,
    ScrollView: View,
    FlatList: View,
    createAnimatedComponent: (component) => component,
    useSharedValue: jest.fn(mockSharedValue),
    useAnimatedStyle: jest.fn(mockUseAnimatedStyle),
    Value: jest.fn(),
    timing: jest.fn(() => ({
      start: jest.fn(),
    })),
    spring: jest.fn(() => ({
      start: jest.fn(),
    })),
    decay: jest.fn(() => ({
      start: jest.fn(),
    })),
    sequence: jest.fn(),
    parallel: jest.fn(),
    event: jest.fn(),
    add: jest.fn(),
    sub: jest.fn(),
    multiply: jest.fn(),
    divide: jest.fn(),
    modulo: jest.fn(),
    pow: jest.fn(),
    sqrt: jest.fn(),
    sin: jest.fn(),
    cos: jest.fn(),
    tan: jest.fn(),
    acos: jest.fn(),
    asin: jest.fn(),
    atan: jest.fn(),
    exp: jest.fn(),
    round: jest.fn(),
    floor: jest.fn(),
    ceil: jest.fn(),
    lessThan: jest.fn(),
    eq: jest.fn(),
    greaterThan: jest.fn(),
    lessOrEq: jest.fn(),
    greaterOrEq: jest.fn(),
    neq: jest.fn(),
    and: jest.fn(),
    or: jest.fn(),
    defined: jest.fn(),
    not: jest.fn(),
    set: jest.fn(),
    concat: jest.fn(),
    cond: jest.fn(),
    block: jest.fn(),
    call: jest.fn(),
    debug: jest.fn(),
    onChange: jest.fn(),
    startClock: jest.fn(),
    stopClock: jest.fn(),
    clockRunning: jest.fn(),
    interpolate: jest.fn(),
    Extrapolate: {
      EXTEND: 'extend',
      CLAMP: 'clamp',
      IDENTITY: 'identity',
    },
    View: View,
    Text: Text,
    Image: View,
    ScrollView: View,
    FlatList: View,
    createAnimatedComponent: (component) => component,
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  const Text = require('react-native/Libraries/Text/Text');
  const TouchableOpacity = require('react-native/Libraries/Components/Touchable/TouchableOpacity');
  
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    Directions: {},
    gestureHandlerRootHOC: jest.fn((component) => component),
    TouchableHighlight: TouchableOpacity,
    TouchableNativeFeedback: TouchableOpacity,
    TouchableOpacity: TouchableOpacity,
    TouchableWithoutFeedback: TouchableOpacity,
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  ScreenContainer: 'ScreenContainer',
  Screen: 'Screen',
  ScreenStack: 'ScreenStack',
  ScreenStackHeaderConfig: 'ScreenStackHeaderConfig',
}));

// Mock react-native-calendars
jest.mock('react-native-calendars', () => ({
  Calendar: 'Calendar',
  LocaleConfig: {
    defaultLocale: 'it',
    locales: {
      it: {
        monthNames: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
        monthNamesShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
        dayNames: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
        dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
      },
    },
  },
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  // Crea un componente mock che accetta props e le applica a View
  const createMockComponent = (name) => {
    const MockComponent = (props) => {
      return React.createElement(View, {
        ...props,
        testID: props.testID || name,
        accessibilityLabel: props.accessibilityLabel || name,
      });
    };
    MockComponent.displayName = name;
    return MockComponent;
  };
  
  return {
    Home: createMockComponent('Home'),
    Package: createMockComponent('Package'),
    Calendar: createMockComponent('Calendar'),
    Camera: createMockComponent('Camera'),
    CheckCircle: createMockComponent('CheckCircle'),
    XCircle: createMockComponent('XCircle'),
    RotateCcw: createMockComponent('RotateCcw'),
    Edit2: createMockComponent('Edit2'),
    X: createMockComponent('X'),
    Plus: createMockComponent('Plus'),
    ScanBarcode: createMockComponent('ScanBarcode'),
  };
});

// Mock @react-native-picker/picker
jest.mock('@react-native-picker/picker', () => ({
  Picker: 'Picker',
}));

// Mock @react-native-community/datetimepicker
jest.mock('@react-native-community/datetimepicker', () => ({
  default: 'DateTimePicker',
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');

// Mock react-native-sound
jest.mock('react-native-sound', () => ({
  default: jest.fn().mockImplementation(() => ({
    play: jest.fn(),
    stop: jest.fn(),
    release: jest.fn(),
  })),
}));

// Mock react-native-onesignal
jest.mock('react-native-onesignal', () => ({
  OneSignal: {
    setAppId: jest.fn(),
    setNotificationWillShowInForegroundHandler: jest.fn(),
    setNotificationOpenedHandler: jest.fn(),
    getDeviceState: jest.fn(() => Promise.resolve({ userId: 'mock-user-id' })),
    setExternalUserId: jest.fn(),
    removeExternalUserId: jest.fn(),
    addTrigger: jest.fn(),
    removeTrigger: jest.fn(),
    clearTriggers: jest.fn(),
    getTags: jest.fn(() => Promise.resolve({})),
    sendTag: jest.fn(),
    sendTags: jest.fn(),
    deleteTag: jest.fn(),
    deleteTags: jest.fn(),
    promptForPushNotificationsWithUserResponse: jest.fn(),
    disablePush: jest.fn(),
    enablePush: jest.fn(),
    isPushDisabled: jest.fn(() => Promise.resolve(false)),
    setSubscription: jest.fn(),
    setEmail: jest.fn(),
    logoutEmail: jest.fn(),
    setSMSNumber: jest.fn(),
    removeSMSNumber: jest.fn(),
    setInAppMessageClickHandler: jest.fn(),
    addInAppMessageClickHandler: jest.fn(),
    removeInAppMessageClickHandler: jest.fn(),
    setInAppMessageLifecycleHandler: jest.fn(),
    addInAppMessageLifecycleHandler: jest.fn(),
    removeInAppMessageLifecycleHandler: jest.fn(),
    setLocationShared: jest.fn(),
    promptLocation: jest.fn(),
    setRequiresUserPrivacyConsent: jest.fn(),
    userPushSubscription: {
      addEmailSubscriptionObserver: jest.fn(),
      removeEmailSubscriptionObserver: jest.fn(),
      addSMSSubscriptionObserver: jest.fn(),
      removeSMSSubscriptionObserver: jest.fn(),
      addPushSubscriptionObserver: jest.fn(),
      removePushSubscriptionObserver: jest.fn(),
    },
  },
}));

// Mock openmoji
jest.mock('openmoji/data/openmoji.json', () => [
  {
    hexcode: '1F436',
    annotation: 'dog face',
    tags: ['animal', 'mammal'],
  },
  {
    hexcode: '1F431',
    annotation: 'cat face',
    tags: ['animal', 'mammal'],
  },
  {
    hexcode: '1F354',
    annotation: 'hamburger',
    tags: ['food'],
  },
  {
    hexcode: '1F36A',
    annotation: 'cookie',
    tags: ['food'],
  },
  {
    hexcode: '1F963',
    annotation: 'bowl with spoon',
    tags: ['food'],
  },
], { virtual: true });

// Global mocks
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch
global.fetch = jest.fn();

// Mock Alert
global.Alert = {
  alert: jest.fn(),
};

// Mock ThemeContext
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
    colors: {
      textPrimary: '#1a1a1a',
      textSecondary: '#666666',
      primary: '#3b82f6',
      error: '#ef4444',
      cardBackground: '#ffffff',
      background: '#f5f5f5'
    }
  }),
}));

// Mock CategoryContext
jest.mock('@/context/CategoryContext', () => ({
  useCategories: () => ({
    categories: [
      { id: 'cat1', name: 'Latticini', icon: '🥛', color: '#3b82f6' },
      { id: 'cat2', name: 'Frutta', icon: '🍎', color: '#ef4444' },
    ],
    getCategoryById: (id) => {
      const categories = [
        { id: 'cat1', name: 'Latticini', icon: '🥛', color: '#3b82f6' },
        { id: 'cat2', name: 'Frutta', icon: '🍎', color: '#ef4444' },
      ];
      return categories.find(cat => cat.id === id);
    }
  }),
}));

// Mock LoggingService
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock accessibility utils
jest.mock('@/utils/accessibility', () => ({
  getAnimatedPressableAccessibilityProps: jest.fn(() => ({})),
  getStatsCardAccessibilityProps: jest.fn(() => ({})),
  getProductCardAccessibilityProps: jest.fn(() => ({})),
  getCategoryFilterAccessibilityProps: jest.fn(() => ({})),
  getSettingsCardAccessibilityProps: jest.fn(() => ({})),
  getDeleteButtonAccessibilityProps: jest.fn(() => ({})),
  getActionButtonAccessibilityProps: jest.fn(() => ({})),
  getImageAccessibilityProps: jest.fn(() => ({})),
}));

// Mock constants
jest.mock('@/constants/colors', () => ({
  COLORS: {
    LIGHT: {
      textPrimary: '#1a1a1a',
    },
    DARK: {
      textPrimary: '#ffffff',
    },
  },
}));

// Mock hooks
jest.mock('@/hooks/useExpirationStatus', () => ({
  useExpirationStatus: jest.fn(() => ({
    backgroundColor: '#ffffff',
    color: '#16a34a',
    daysUntilExpiration: 5,
    isExpiringSoon: false,
    isExpired: false,
  })),
}));
