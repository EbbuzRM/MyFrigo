// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('bin', 'txt', 'jpg', 'png', 'ttf');
config.resolver.sourceExts.push('js', 'jsx', 'json', 'ts', 'tsx', 'cjs');

config.watchFolders = [path.resolve(__dirname, './')];

module.exports = config;
