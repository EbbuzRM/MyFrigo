import React, { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { ProductProvider } from '@/context/ProductContext';
import { CategoryProvider } from '@/context/CategoryContext';
import { ManualEntryProvider } from '@/context/ManualEntryContext';
import { LoggingService } from '@/services/LoggingService';

// Inizializza il LoggingService in modo sincrono all'importazione
// Per garantire che sia disponibile immediatamente nei componenti
let isLoggingServiceInitialized = false;

// Assicurati che LoggingService sia inizializzato solo una volta
if (!isLoggingServiceInitialized) {
  try {
    LoggingService.initialize().then(() => {
      isLoggingServiceInitialized = true;
    }).catch(error => {
      console.error('Failed to initialize LoggingService:', error);
    });
    // Imposta il flag immediatamente per evitare inizializzazioni multiple
    isLoggingServiceInitialized = true;
  } catch (error) {
    console.error('Failed to initialize LoggingService:', error);
    isLoggingServiceInitialized = true;
  }
}

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Componente che gestisce tutti i provider dell'applicazione
 * Semplifica la gerarchia dei provider e migliora la leggibilità
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  useEffect(() => {
    // Rinizializza il LoggingService in background per garantire la configurazione completa
    LoggingService.initialize().catch(error => {
      console.error('Failed to reinitialize LoggingService:', error);
    });
  }, []);

  return (
    <AuthProvider>
      <SettingsProvider>
        <ProductProvider>
          <CategoryProvider>
            <ManualEntryProvider>
              {children}
            </ManualEntryProvider>
          </CategoryProvider>
        </ProductProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};