import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  tutorAPI, 
  TutorSearchFilters, 
  TutorSearchOptions, 
  TutorSearchResult,
  TutorWithUser 
} from '../lib/api/tutors';

// Types for search functionality
export interface SearchState {
  query: string;
  filters: TutorSearchFilters;
  options: TutorSearchOptions;
  isLoading: boolean;
  error: string | null;
  results: TutorSearchResult | null;
  suggestions: string[];
  searchHistory: string[];
  debouncedQuery: string;
}

export interface SearchActions {
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<TutorSearchFilters>) => void;
  setOptions: (options: Partial<TutorSearchOptions>) => void;
  clearFilters: () => void;
  clearSearch: () => void;
  clearHistory: () => void;
  removeFromHistory: (query: string) => void;
  executeSearch: () => void;
  refetch: () => void;
}

export interface UseSearchReturn extends SearchState, SearchActions {
  popularSubjects: string[];
  featuredTutors: TutorWithUser[];
  isSearching: boolean;
  hasSearched: boolean;
}

// Configuration constants
const DEBOUNCE_DELAY = 300;
const MAX_HISTORY_ITEMS = 10;
const MAX_SUGGESTIONS = 5;
const SEARCH_HISTORY_KEY = 'tutor-search-history';
const MIN_QUERY_LENGTH = 2;

// Default search options
const DEFAULT_OPTIONS: TutorSearchOptions = {
  page: 1,
  limit: 20,
  sortBy: 'relevance',
  sortOrder: 'desc',
  includeUnavailable: false
};

// Default filters
const DEFAULT_FILTERS: TutorSearchFilters = {};

/**
 * Custom hook for managing tutor search functionality
 * Provides debounced search, filtering, caching, and search history
 */
export function useSearch(initialFilters: TutorSearchFilters = {}, initialOptions: TutorSearchOptions = {}) {
  const queryClient = useQueryClient();
  
  // Core search state
  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFiltersState] = useState<TutorSearchFilters>({ ...DEFAULT_FILTERS, ...initialFilters });
  const [options, setOptionsState] = useState<TutorSearchOptions>({ ...DEFAULT_OPTIONS, ...initialOptions });
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Refs for managing debounce and cleanup
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          setSearchHistory(parsedHistory.slice(0, MAX_HISTORY_ITEMS));
        }
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }, []);

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }, [searchHistory]);

  // Debounce search query
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query]);

  // Generate search suggestions based on query and history
  useEffect(() => {
    if (query.length >= MIN_QUERY_LENGTH) {
      const filteredHistory = searchHistory
        .filter(item => 
          item.toLowerCase().includes(query.toLowerCase()) && 
          item.toLowerCase() !== query.toLowerCase()
        )
        .slice(0, MAX_SUGGESTIONS);

      setSuggestions(filteredHistory);
    } else {
      setSuggestions([]);
    }
  }, [query, searchHistory]);

  // Create query key for React Query caching
  const createQueryKey = useCallback((searchQuery: string, searchFilters: TutorSearchFilters, searchOptions: TutorSearchOptions) => {
    return ['tutors', 'search', {
      query: searchQuery,
      filters: searchFilters,
      options: searchOptions
    }];
  }, []);

  // Main search query using React Query
  const {
    data: results,
    isLoading,
    isFetching,
    refetch: refetchQuery,
    error: queryError
  } = useQuery({
    queryKey: createQueryKey(debouncedQuery, filters, options),
    queryFn: async ({ signal }) => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      try {
        setError(null);
        
        const searchFilters: TutorSearchFilters = {
          ...filters,
          ...(debouncedQuery.trim() && { searchQuery: debouncedQuery.trim() })
        };

        const result = await tutorAPI.searchTutors(searchFilters, options);
        
        // Add successful search to history
        if (debouncedQuery.trim() && debouncedQuery.length >= MIN_QUERY_LENGTH) {
          addToSearchHistory(debouncedQuery.trim());
        }
        
        setHasSearched(true);
        return result;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Search failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    enabled: hasSearched || debouncedQuery.length >= MIN_QUERY_LENGTH || Object.keys(filters).length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Query for popular subjects
  const { data: popularSubjects = [] } = useQuery({
    queryKey: ['tutors', 'popular-subjects'],
    queryFn: async () => {
      const subjects = await tutorAPI.getPopularSubjects(10);
      return subjects.map(s => s.subject);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000 // 1 hour
  });

  // Query for featured tutors
  const { data: featuredTutors = [] } = useQuery({
    queryKey: ['tutors', 'featured'],
    queryFn: () => tutorAPI.getFeaturedTutors(6),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000 // 30 minutes
  });

  // Helper function to add search query to history
  const addToSearchHistory = useCallback((searchQuery: string) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== searchQuery.toLowerCase());
      const newHistory = [searchQuery, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      return newHistory;
    });
  }, []);

  // Action handlers
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    setError(null);
  }, []);

  const setFilters = useCallback((newFilters: Partial<TutorSearchFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setError(null);
    
    // Reset to first page when filters change
    if (options.page !== 1) {
      setOptionsState(prev => ({ ...prev, page: 1 }));
    }
  }, [options.page]);

  const setOptions = useCallback((newOptions: Partial<TutorSearchOptions>) => {
    setOptionsState(prev => ({ ...prev, ...newOptions }));
    setError(null);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
    setOptionsState(prev => ({ ...prev, page: 1 }));
    setError(null);
  }, []);

  const clearSearch = useCallback(() => {
    setQueryState('');
    setDebouncedQuery('');
    setFiltersState(DEFAULT_FILTERS);
    setOptionsState(DEFAULT_OPTIONS);
    setError(null);
    setSuggestions([]);
    setHasSearched(false);
    
    // Clear the query cache for search results
    queryClient.removeQueries({ 
      queryKey: ['tutors', 'search'],
      exact: false 
    });
  }, [queryClient]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    setSuggestions([]);
  }, []);

  const removeFromHistory = useCallback((queryToRemove: string) => {
    setSearchHistory(prev => prev.filter(item => item !== queryToRemove));
  }, []);

  const executeSearch = useCallback(() => {
    if (query.trim()) {
      setDebouncedQuery(query.trim());
      addToSearchHistory(query.trim());
    }
    setHasSearched(true);
  }, [query, addToSearchHistory]);

  const refetch = useCallback(() => {
    setError(null);
    refetchQuery();
  }, [refetchQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle query errors
  useEffect(() => {
    if (queryError) {
      const errorMessage = queryError instanceof Error ? queryError.message : 'Search failed';
      setError(errorMessage);
    }
  }, [queryError]);

  return {
    // State
    query,
    filters,
    options,
    isLoading: isLoading || isFetching,
    error: error || (queryError instanceof Error ? queryError.message : null),
    results: results || null,
    suggestions,
    searchHistory,
    debouncedQuery,
    popularSubjects,
    featuredTutors,
    isSearching: isLoading || isFetching,
    hasSearched,

    // Actions
    setQuery,
    setFilters,
    setOptions,
    clearFilters,
    clearSearch,
    clearHistory,
    removeFromHistory,
    executeSearch,
    refetch
  };
}

// Additional utility hooks for specific search scenarios

/**
 * Hook for quick subject-based search
 */
export function useSubjectSearch(subject: string) {
  return useSearch(
    { subjects: subject ? [subject] : [] },
    { sortBy: 'rating', sortOrder: 'desc' }
  );
}

/**
 * Hook for location-based search
 */
export function useLocationSearch(location: string) {
  return useSearch(
    { location },
    { sortBy: 'relevance', sortOrder: 'desc' }
  );
}

/**
 * Hook for availability-based search
 */
export function useAvailabilitySearch(availability: TutorSearchFilters['availability']) {
  return useSearch(
    { availability },
    { sortBy: 'relevance', sortOrder: 'desc', includeUnavailable: false }
  );
}

/**
 * Hook for getting search suggestions without executing search
 */
export function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          setSearchHistory(parsedHistory);
        }
      }
    } catch (error) {
      console.warn('Failed to load search history for suggestions:', error);
    }
  }, []);

  useEffect(() => {
    if (query.length >= MIN_QUERY_LENGTH) {
      const filteredHistory = searchHistory
        .filter(item => 
          item.toLowerCase().includes(query.toLowerCase()) && 
          item.toLowerCase() !== query.toLowerCase()
        )
        .slice(0, MAX_SUGGESTIONS);

      setSuggestions(filteredHistory);
    } else {
      setSuggestions([]);
    }
  }, [query, searchHistory]);

  return suggestions;
}

// Export types for external use
export type {
  SearchState,
  SearchActions,
  UseSearchReturn
};