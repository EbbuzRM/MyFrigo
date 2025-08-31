/**
 * Questo modulo determina se l'applicazione è in esecuzione in un ambiente di test Detox.
 * Inizializza la variabile isTestMode una sola volta per garantire coerenza.
 */
import Constants from 'expo-constants';

// Legge i parametri di avvio passati da Detox
const launchArgs = Constants.expoConfig?.extra?.launchArgs as Record<string, any> | undefined;

/**
 * true se l'app è stata lanciata con il flag `detox-testing`.
 */
export const isTestMode = launchArgs?.['detox-testing'] === true;

console.log(`[TestEnv] App in modalità test: ${isTestMode}`);