// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Estendi le sourceExts per includere 'cjs' se non già presente
// Questo può aiutare con alcuni pacchetti @react-native-firebase
const defaultSourceExts = defaultConfig.resolver.sourceExts || [];
const additionalExts = ['cjs']; // Aggiungiamo 'cjs'

defaultConfig.resolver.sourceExts = [...new Set([...defaultSourceExts, ...additionalExts, 'js', 'json', 'ts', 'tsx'])];

// Se hai problemi con SVG, potresti aver bisogno di una configurazione simile a questa:
// defaultConfig.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
// defaultConfig.resolver.assetExts = defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg');
// defaultConfig.resolver.sourceExts.push('svg');

module.exports = defaultConfig;
