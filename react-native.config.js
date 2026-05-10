// react-native.config.js — react-native.config module.
//
// exports: none
// used_by: none
// rules:   none
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

module.exports = {
  // Configurazione per la nuova architettura
  reactNativeVersion: '0.73.0', // Assicurati che questa versione sia compatibile con la tua versione di Expo
  project: {
    android: {
      sourceDir: './android',
    },
    ios: {
      sourceDir: './ios',
    },
  },
  dependencies: {
    // Configurazioni specifiche per le dipendenze native
  },
};