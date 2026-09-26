// setup.ts — side-effect entry for the app bundle: initialize i18n and start the
// foreground language sync BEFORE expo-router renders (imported first by index.js).
//
// exports: none
// used_by: index.js
// rules:   Keep side effects here only — importing i18n/index.ts alone stays pure.
// agent:   executor | 2026-09-22 | Fase A i18n | initial infrastructure

import { initI18n } from './index';
import { startLanguageSync } from './sync';

initI18n();
startLanguageSync();
