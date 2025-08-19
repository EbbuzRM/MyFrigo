import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import { LoggingService } from '@/services/LoggingService';

// Timeout in milliseconds for framework initialization
const FRAMEWORK_READY_TIMEOUT = 5000;

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    const clearFrameworkTimeout = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    // Set a timeout for framework initialization
    timeoutRef.current = setTimeout(() => {
      if (!isReady) {
        const timeoutError = new Error(`Framework initialization timed out after ${FRAMEWORK_READY_TIMEOUT}ms`);
        LoggingService.error('useFrameworkReady', 'Framework initialization timed out', timeoutError);
        setError(timeoutError);
        // Set ready anyway to prevent blocking the app
        setIsReady(true);
      }
    }, FRAMEWORK_READY_TIMEOUT);

    // Initialize the framework
    const initializeFramework = async () => {
      try {
        LoggingService.info('useFrameworkReady', 'Initializing framework');
        
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          if (typeof window.frameworkReady === 'function') {
            await window.frameworkReady();
            LoggingService.info('useFrameworkReady', 'Framework initialized successfully');
          } else {
            LoggingService.info('useFrameworkReady', 'window.frameworkReady is not a function');
          }
        }
        
        // Framework is ready
        setIsReady(true);
        clearFrameworkTimeout();
      } catch (err) {
        const frameworkError = err instanceof Error ? err : new Error('Unknown error initializing framework');
        LoggingService.error('useFrameworkReady', 'Error initializing framework', frameworkError);
        setError(frameworkError);
        // Set ready anyway to prevent blocking the app
        setIsReady(true);
      }
    };

    initializeFramework();

    // Cleanup on unmount
    return () => {
      clearFrameworkTimeout();
    };
  }, []);

  return { isReady, error };
}
