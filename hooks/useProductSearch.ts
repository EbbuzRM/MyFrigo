import { useState, useCallback, useRef } from 'react';
import { LoggingService } from '@/services/LoggingService';

/**
 * Valid status filter values
 */
export type ProductStatusFilter = 'all' | 'fresh' | 'expiring' | 'expired';

/**
 * Result interface for useProductSearch hook
 */
export interface UseProductSearchResult {
  /** Current search query string */
  searchQuery: string;
  /** Setter for search query */
  setSearchQuery: (query: string) => void;
  /** Callback to clear search */
  clearSearch: () => void;
  /** Check if search is active */
  hasSearchQuery: boolean;
}

/**
 * Custom hook for managing product search functionality
 * 
 * @returns Search state and handlers
 */
export function useProductSearch(): UseProductSearchResult {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchQueryRef = useRef(searchQuery);

  // Keep ref in sync with state
  searchQueryRef.current = searchQuery;

  /**
   * Clears the current search query
   */
  const clearSearch = useCallback(() => {
    LoggingService.debug('useProductSearch', 'Clearing search query');
    setSearchQuery('');
  }, []);

  /**
   * Handler for search query changes with logging
   */
  const handleSearchChange = useCallback((query: string) => {
    if (query !== searchQueryRef.current) {
      LoggingService.debug('useProductSearch', `Search query changed: "${query}"`);
    }
    setSearchQuery(query);
  }, []);

  const hasSearchQuery = searchQuery.length > 0;

  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
    clearSearch,
    hasSearchQuery,
  };
}
