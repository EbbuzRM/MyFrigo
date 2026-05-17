// AppProviders.tsx — AppProviders module.
//
// exports: AppProviders
// used_by: app\_layout.tsx
// rules:   - All application context providers must be nested inside AuthProvider and SettingsProvider as the outermost providers in the hierarchy
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { ProductProvider } from '@/context/ProductContext';
import { CategoryProvider } from '@/context/CategoryContext';
import { ManualEntryProvider } from '@/context/ManualEntryContext';
import { UpdateProvider } from '@/context/UpdateContext';
import { LoggingService } from '@/services/LoggingService';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Componente che gestisce tutti i provider dell'applicazione
 * Semplifica la gerarchia dei provider e migliora la leggibilità
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  useEffect(() => {
    // Inizializza il LoggingService quando il componente monta
    LoggingService.initialize().catch(error => {
      LoggingService.error('AppProviders', 'Failed to initialize LoggingService: ' + (error instanceof Error ? error.message : String(error)));
    });
  }, []);

  return (
    <AuthProvider>
      <SettingsProvider>
        <ProductProvider>
          <CategoryProvider>
            <ManualEntryProvider>
              <UpdateProvider>
                {children}
              </UpdateProvider>
            </ManualEntryProvider>
          </CategoryProvider>
        </ProductProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};