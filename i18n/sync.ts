// sync.ts — re-read device language preferences when the app returns to foreground.
//
// exports: syncSystemLanguage, handleAppStateChange, startLanguageSync, stopLanguageSync
// used_by: i18n/setup.ts (app entry), i18n/__tests__/*
// rules:   Updates run through i18next.changeLanguage only — react-i18next re-renders
//          texts in place, with no forced remount (form state and navigation survive).
//          RN exposes no per-state listener: we subscribe to `change` and react on `active`.
// agent:   executor | 2026-09-22 | Fase A i18n | initial infrastructure

import i18next from 'i18next';
import { AppState, type AppStateStatus } from 'react-native';
import { LoggingService } from '@/services/LoggingService';
import { getSystemLanguage } from './language';
import type { SupportedLanguage } from './types';

type AppStateSubscription = { remove: () => void };

let appStateSubscription: AppStateSubscription | null = null;

/** Align the active language with the device preferences (no-op if unchanged). */
export async function syncSystemLanguage(): Promise<SupportedLanguage> {
  const nextLanguage = getSystemLanguage();
  if (i18next.language !== nextLanguage) {
    await i18next.changeLanguage(nextLanguage);
  }
  return nextLanguage;
}

/** AppState listener: language is re-read only when returning to foreground. */
export function handleAppStateChange(state: AppStateStatus): void {
  if (state !== 'active') return;
  void syncSystemLanguage().catch((error: unknown) => {
    LoggingService.error('i18n', 'syncSystemLanguage failed', error);
  });
}

/** Start watching the foreground transition. Idempotent; returns the stop function. */
export function startLanguageSync(): () => void {
  if (appStateSubscription === null) {
    appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
  }
  return stopLanguageSync;
}

export function stopLanguageSync(): void {
  appStateSubscription?.remove();
  appStateSubscription = null;
}
