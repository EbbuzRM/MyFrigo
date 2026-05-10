// useQuantityInput.ts — useQuantityInput module.
//
// exports: useQuantityInput
// used_by: components\QuantityInputRow.tsx
// rules:   - The `quantity` state string and `onUpdate` callback must remain the single source of truth; derived values from `parseQty` must never be stored externally or used to replace the string-based interface.
//          - All modified quantity values passed to `onUpdate` must be converted to strings; the hook must never return or emit numeric quantity values externally.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useCallback } from 'react';
import { MIN_QUANTITY, MAX_QUANTITY, QUANTITY_STEP } from '@/constants/quantities';

interface UseQuantityInputProps {
  quantity: string;
  onUpdate: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
}

interface UseQuantityInputReturn {
  handleIncrement: () => void;
  handleDecrement: () => void;
  handleQuantityChange: (text: string) => void;
  isAtMin: boolean;
  isAtMax: boolean;
}

export function useQuantityInput({
  quantity,
  onUpdate,
  min = MIN_QUANTITY,
  max = MAX_QUANTITY,
  step = QUANTITY_STEP,
}: UseQuantityInputProps): UseQuantityInputReturn {
  const parseQty = useCallback((v: string) => {
    const p = parseFloat(v.replace(',', '.'));
    return isNaN(p) ? 0 : p;
  }, []);

  const current = parseQty(quantity);

  const handleIncrement = useCallback(() => {
    onUpdate(String(Math.min(max, parseQty(quantity) + step)));
  }, [quantity, onUpdate, max, step, parseQty]);

  const handleDecrement = useCallback(() => {
    onUpdate(String(Math.max(min, parseQty(quantity) - step)));
  }, [quantity, onUpdate, min, step, parseQty]);

  const handleQuantityChange = useCallback((text: string) => {
    if (text === '') { onUpdate(''); return; }
    const norm = text.replace(',', '.');
    if (/^\d*\.?\d{0,2}$/.test(norm)) {
      const n = parseFloat(norm);
      if (!isNaN(n) && n > max) { onUpdate(String(max)); return; }
      onUpdate(norm);
    }
  }, [onUpdate, max]);

  return {
    handleIncrement,
    handleDecrement,
    handleQuantityChange,
    isAtMin: current <= min,
    isAtMax: current >= max,
  };
}
