

// Configura l'oggetto globale Expo
if (typeof global !== 'undefined' && !global.Expo) {
  global.Expo = {};
}

// Importa expo-router dopo che l'ambiente è stato preparato
import 'expo-router/entry';
