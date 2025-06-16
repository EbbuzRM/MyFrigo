const { createRunOncePlugin } = require('@expo/config-plugins');

const withReactNativeMLKitTextRecognition = (config) => {
  // Questo plugin non richiede modifiche specifiche a build.gradle o AndroidManifest.xml
  // perché il pacchetto @react-native-ml-kit/text-recognition gestisce le proprie dipendenze native
  // e i permessi necessari sono già presenti nell'app.
  // Il suo scopo principale è garantire che Expo riconosca il pacchetto.

  // Per iOS, assicurati che le descrizioni di utilizzo della fotocamera e della libreria foto siano presenti.
  // Queste sono già presenti in app.json, ma è una buona pratica assicurarsi che lo siano.
  if (config.ios && !config.ios.infoPlist) {
    config.ios.infoPlist = {};
  }
  if (config.ios) {
    config.ios.infoPlist.NSCameraUsageDescription = config.ios.infoPlist.NSCameraUsageDescription || 'Questa app ha bisogno dell\'accesso alla fotocamera per il riconoscimento del testo.';
    config.ios.infoPlist.NSPhotoLibraryUsageDescription = config.ios.infoPlist.NSPhotoLibraryUsageDescription || 'Questa app ha bisogno dell\'accesso alla libreria foto per il riconoscimento del testo.';
  }

  return config;
};

module.exports = createRunOncePlugin(withReactNativeMLKitTextRecognition, 'react-native-ml-kit-text-recognition', '1.0.0');
