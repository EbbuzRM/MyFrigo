#!/usr/bin/env node
// start-dev-client.js — start-dev-client module.
//
// exports: none
// used_by: none
// rules:   none
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * Script per avviare l'app con il custom development client
 * Questo script risolve il problema del modulo nativo di Google Sign-In che non funziona con Expo Go
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Avvio di MyFrigo con Custom Development Client');
console.log('==================================================');

try {
  // Verifica se esiste già un custom development client
  const easJsonPath = path.join(process.cwd(), 'eas.json');
  
  if (!fs.existsSync(easJsonPath)) {
    console.log('⚠️  File eas.json non trovato. Creazione del file di configurazione EAS...');
    
    // Crea il file eas.json di base
    const easJson = {
      "cli": {
        "version": ">= 3.13.0"
      },
      "build": {
        "development": {
          "developmentClient": true,
          "distribution": "internal"
        },
        "preview": {
          "distribution": "internal"
        },
        "production": {}
      }
    };
    
    fs.writeFileSync(easJsonPath, JSON.stringify(easJson, null, 2));
    console.log('✅ File eas.json creato con successo!');
  }
  
  // Avvia il server di sviluppo con il flag --dev-client
  console.log('\n🔄 Avvio del server di sviluppo con custom development client...');
  console.log('💡 Assicurati di avere già eseguito la build con: eas build --platform android --profile development');
  
  execSync('npx expo start --dev-client', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
} catch (error) {
  console.error('❌ Errore durante l\'avvio:', error.message);
  console.log('\n📋 Suggerimenti:');
  console.log('1. Assicurati di avere Expo CLI installato globalmente');
  console.log('2. Esegui "npm install" per installare le dipendenze');
  console.log('3. Prova ad avviare manualmente con "npx expo start --dev-client"');
  console.log('4. Se non hai ancora eseguito la build, esegui: eas build --platform android --profile development');
  process.exit(1);
}