import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { LoggingService } from '@/services/LoggingService';

/**
 * Meta state interface for edit mode and flags
 */
export interface MetaState {
  isEditMode: boolean;
  originalProductId: string | null;
  hasManuallySelectedCategory: boolean;
  isInitialized: boolean;
}

interface MetaContextValue extends MetaState {
  setEditMode: (editMode: boolean) => void;
  setOriginalProductId: (productId: string | null) => void;
  setManuallySelectedCategory: (manual: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  resetMeta: () => void;
}

const MetaContext = createContext<MetaContextValue | undefined>(undefined);

const getInitialMetaState = (): MetaState => ({
  isEditMode: false,
  originalProductId: null,
  hasManuallySelectedCategory: false,
  isInitialized: false,
});

export const ManualEntryMetaProvider = ({ children }: { children: ReactNode }) => {
  const [metaState, setMetaState] = useState<MetaState>(getInitialMetaState());

  const setEditMode = useCallback((editMode: boolean) => {
    LoggingService.info('ManualEntryMeta', `Setting isEditMode to: ${editMode}`);
    setMetaState(prev => ({ ...prev, isEditMode: editMode }));
  }, []);

  const setOriginalProductId = useCallback((productId: string | null) => {
    LoggingService.info('ManualEntryMeta', `Setting originalProductId to: ${productId}`);
    setMetaState(prev => ({ ...prev, originalProductId: productId }));
  }, []);

  const setManuallySelectedCategory = useCallback((manual: boolean) => {
    LoggingService.info('ManualEntryMeta', `Setting hasManuallySelectedCategory to: ${manual}`);
    setMetaState(prev => ({ ...prev, hasManuallySelectedCategory: manual }));
  }, []);

  const setInitialized = useCallback((initialized: boolean) => {
    LoggingService.info('ManualEntryMeta', `Setting isInitialized to: ${initialized}`);
    setMetaState(prev => ({ ...prev, isInitialized: initialized }));
  }, []);

  const resetMeta = useCallback(() => {
    LoggingService.info('ManualEntryMeta', 'Resetting meta state');
    setMetaState(getInitialMetaState());
  }, []);

  const value: MetaContextValue = {
    ...metaState,
    setEditMode,
    setOriginalProductId,
    setManuallySelectedCategory,
    setInitialized,
    resetMeta,
  };

  return (
    <MetaContext.Provider value={value}>
      {children}
    </MetaContext.Provider>
  );
};

export const useManualEntryMeta = (): MetaContextValue => {
  const context = useContext(MetaContext);
  if (!context) {
    throw new Error('useManualEntryMeta must be used within ManualEntryMetaProvider');
  }
  return context;
};

export type { MetaContextValue };
