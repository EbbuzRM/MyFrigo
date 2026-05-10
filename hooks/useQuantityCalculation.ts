// useQuantityCalculation.ts — useQuantityCalculation module.
//
// exports: QuantityCalculationResult | ValidationResult | useQuantityCalculation
// used_by: components\ConsumeQuantityModal.tsx
// rules:   - This module exports a **merged return type** (`QuantityCalculationResult & { validateInput: ... }`) that must be preserved as a single return from `useQuantityCalculation`
//          - The `validateInput` function **depends on the reactive `totalQuantity` value** — any refactoring must maintain this closure relationship to avoid stale comparisons
//          - The two `unit` types (`'pz'` and `'conf'`) are **semantically significant** for the mixed-unit calculation logic and must not be removed or renamed without updating all consumers
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useMemo, useCallback } from 'react';
import { Quantity } from '@/types/Product';

export interface QuantityCalculationResult {
  totalQuantity: number;
  unit: string;
  hasPz: boolean;
  hasConf: boolean;
  quantities: Quantity[];
}

export interface ValidationResult {
  isValid: boolean;
  error: string;
}

export const useQuantityCalculation = (quantities: Quantity[] | undefined): QuantityCalculationResult & {
  validateInput: (input: string) => ValidationResult;
} => {
  const safeQuantities = useMemo(() => (Array.isArray(quantities) ? quantities : []), [quantities]);
  const hasPz = useMemo(() => safeQuantities.some((q) => q.unit === 'pz'), [safeQuantities]);
  const hasConf = useMemo(() => safeQuantities.some((q) => q.unit === 'conf'), [safeQuantities]);

  const { totalQuantity, unit } = useMemo(() => {
    if (hasPz && hasConf) {
      const total = safeQuantities.filter((q) => q.unit === 'pz').reduce((sum, q) => sum + q.quantity, 0);
      return { totalQuantity: total, unit: 'pz' };
    }
    const total = safeQuantities.reduce((sum, q) => sum + q.quantity, 0);
    return { totalQuantity: total, unit: safeQuantities[0]?.unit || 'unità' };
  }, [safeQuantities, hasPz, hasConf]);

  const validateInput = useCallback((input: string): ValidationResult => {
    const trimmed = input.trim();
    if (!trimmed) return { isValid: false, error: 'Inserisci una quantità.' };
    const num = parseInt(trimmed, 10);
    if (isNaN(num)) return { isValid: false, error: 'Inserisci un numero valido.' };
    if (num < 1) return { isValid: false, error: 'La quantità deve essere almeno 1.' };
    if (num > totalQuantity) return { isValid: false, error: `Inserisci un numero tra 1 e ${totalQuantity} (${unit}).` };
    return { isValid: true, error: '' };
  }, [totalQuantity, unit]);

  return { totalQuantity, unit, hasPz, hasConf, quantities: safeQuantities, validateInput };
};
