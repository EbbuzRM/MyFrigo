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
