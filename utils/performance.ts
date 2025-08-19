/**
 * Utilità per l'ottimizzazione delle performance in React Native
 * 
 * Questo file contiene funzioni di utilità per migliorare le performance
 * dei componenti React, come la memoizzazione di valori e funzioni.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * Hook personalizzato per memoizzare uno stile in base alle dipendenze
 * @param styleFunction La funzione che genera lo stile
 * @param deps Le dipendenze da cui dipende lo stile
 * @returns Lo stile memoizzato
 */
export function useMemoizedStyles<T>(styleFunction: (...args: any[]) => T, deps: any[]): T {
  return useMemo(() => styleFunction(...deps), deps);
}

/**
 * Hook personalizzato per tracciare lo stato precedente di un valore
 * @param value Il valore da tracciare
 * @returns Il valore precedente
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}

/**
 * Hook personalizzato per memoizzare un callback con controllo delle dipendenze
 * @param callback La funzione da memoizzare
 * @param deps Le dipendenze da cui dipende il callback
 * @returns Il callback memoizzato
 */
export function useSafeCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): (...args: Parameters<T>) => ReturnType<T> {
  // Verifica che tutte le dipendenze siano definite
  const allDepsValid = deps.every(dep => dep !== undefined && dep !== null);
  
  return useCallback(
    (...args: Parameters<T>): ReturnType<T> => {
      if (allDepsValid) {
        return callback(...args);
      }
      console.warn('useSafeCallback: alcune dipendenze non sono definite');
      return undefined as unknown as ReturnType<T>;
    },
    deps
  );
}

/**
 * Hook personalizzato per memoizzare un valore con controllo delle dipendenze
 * @param factory La funzione che genera il valore
 * @param deps Le dipendenze da cui dipende il valore
 * @returns Il valore memoizzato
 */
export function useSafeMemo<T>(factory: () => T, deps: any[]): T | undefined {
  // Verifica che tutte le dipendenze siano definite
  const allDepsValid = deps.every(dep => dep !== undefined && dep !== null);
  
  return useMemo(() => {
    if (allDepsValid) {
      return factory();
    }
    console.warn('useSafeMemo: alcune dipendenze non sono definite');
    return undefined;
  }, deps);
}

/**
 * Hook personalizzato per evitare re-render inutili
 * @param value Il valore da memoizzare
 * @param isEqual Funzione di confronto personalizzata (opzionale)
 * @returns Il valore memoizzato
 */
export function useDeepMemo<T>(value: T, isEqual?: (prev: T, next: T) => boolean): T {
  const ref = useRef<T>(value);
  
  if (isEqual ? !isEqual(ref.current, value) : ref.current !== value) {
    ref.current = value;
  }
  
  return ref.current;
}

/**
 * Funzione di utilità per verificare se un oggetto è vuoto
 * @param obj L'oggetto da verificare
 * @returns true se l'oggetto è vuoto, false altrimenti
 */
export function isEmptyObject(obj: Record<string, any> | null | undefined): boolean {
  if (!obj) return true;
  return Object.keys(obj).length === 0;
}

/**
 * Funzione di utilità per verificare se due array sono uguali
 * @param arr1 Il primo array
 * @param arr2 Il secondo array
 * @returns true se gli array sono uguali, false altrimenti
 */
export function areArraysEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  
  return true;
}

export default {
  useMemoizedStyles,
  usePrevious,
  useSafeCallback,
  useSafeMemo,
  useDeepMemo,
  isEmptyObject,
  areArraysEqual,
};