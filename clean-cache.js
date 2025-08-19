#!/usr/bin/env node

/**
 * Script per pulire la cache di Metro e Expo
 * Questo dovrebbe risolvere il problema della route "registration-confirmation"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Pulizia cache in corso...');

try {
  // Pulisci cache Metro
  console.log('📦 Pulizia cache Metro...');
  execSync('npx expo start --clear', { stdio: 'inherit' });
  
  // Pulisci node_modules/.cache
  console.log('🗑️  Pulizia cache node_modules...');
  const cachePath = path.join(__dirname, 'node_modules', '.cache');
  if (fs.existsSync(cachePath)) {
    fs.rmSync(cachePath, { recursive: true, force: true });
    console.log('✅ Cache node_modules pulita');
  }
  
  // Pulisci .expo
  console.log('🗂️  Pulizia cache .expo...');
  const expoCachePath = path.join(__dirname, '.expo');
  if (fs.existsSync(expoCachePath)) {
    fs.rmSync(expoCachePath, { recursive: true, force: true });
    console.log('✅ Cache .expo pulita');
  }
  
  console.log('✨ Pulizia completata! Ora puoi riavviare l\'app.');
  
} catch (error) {
  console.error('❌ Errore durante la pulizia:', error.message);
  process.exit(1);
}
