// useAppLifecycle.ts — useAppLifecycle module.
//
// exports: useAppLifecycle
// used_by: app\(tabs)\index.tsx
// rules:   rules:
//          - This module manages app lifecycle state transitions and must always keep the callback invocation synchronous within the effect.
//          - Any changes to the lifecycle subscription logic must preserve the cleanup pattern via the returned subscription removal function.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useEffect } from 'react';
import { AppState } from 'react-native';
import { LoggingService } from '@/services/LoggingService';

/**
 * Hook per intercettare i cambiamenti di stato dell'app (es. background -> foreground).
 * @param onForeground Callback eseguita quando l'app torna attiva.
 */
export function useAppLifecycle(onForeground: () => void) {
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                LoggingService.info('AppLifecycle', 'L\'app è tornata in foreground, eseguo callback...');
                onForeground();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [onForeground]);
}
