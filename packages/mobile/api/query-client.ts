import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/**
 * TanStack Query client configuration with AsyncStorage persistence.
 *
 * Cache behavior:
 * - Data is persisted to AsyncStorage automatically
 * - Data is returned from cache immediately (cache-first)
 * - Background refetch updates cache without UI disruption
 * - Cache never expires (staleTime: Infinity)
 * - Cache never garbage collected (gcTime: Infinity)
 * - ALWAYS refetch on mount to get latest data while showing cached data instantly
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Never mark data as stale automatically - keeps cache valid forever
      staleTime: Infinity,
      // Never garbage collect cached data - infinite offline support
      gcTime: Infinity,
      // ALWAYS refetch on mount - serves cache immediately, updates in background
      refetchOnMount: 'always',
      // Don't refetch when app comes to foreground (mobile-specific)
      refetchOnWindowFocus: false,
      // Refetch when connection is restored
      refetchOnReconnect: true,
      // Retry failed requests 3 times
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

/**
 * AsyncStorage persister for TanStack Query.
 * Automatically saves query cache to AsyncStorage and restores on app launch.
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'tanstack-query-cache',
  // Debounce persistence to avoid excessive writes
  throttleTime: 1000,
});
