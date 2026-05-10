#!/usr/bin/env node
// clean-cache.js — clean-cache module.
//
// exports: none
// used_by: none
// rules:   none
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * Script per pulire la cache di Metro e Expo
 */

import { execSync } from 'child_process';
import { rmSync } from 'fs';
import * as fs from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Before:
// import { join } from 'path';
// …
import { join, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = import.meta.dirname || dirname(__filename);
console.log('🧹 Pulizia cache in corso...');

try {
  // Pulisci cache Metro
  console.log('📦 Pulizia cache Metro...');
  execSync('npx expo start --clear', { stdio: 'inherit' });
  
  // Pulisci node_modules/.cache
  console.log('🗑️  Pulizia cache node_modules...');
  const cachePath = join(__dirname, 'node_modules', '.cache');
  if (fs.existsSync(cachePath)) {
    rmSync(cachePath, { recursive: true, force: true });
    console.log('✅ Cache node_modules pulita');
  }
  
  // Pulisci .expo
  console.log('🗂️  Pulizia cache .expo...');
  const expoCachePath = join(__dirname, '.expo');
  if (fs.existsSync(expoCachePath)) {
    rmSync(expoCachePath, { recursive: true, force: true });
    console.log('✅ Cache .expo pulita');
  }
  
  console.log('✨ Pulizia completata! Ora puoi riavviare l\'app.');
  
} catch (error) {
  console.error('❌ Errore durante la pulizia:', error.message);
  process.exit(1);
}
