import z from 'zod';
import { useCallback, useEffect, useRef } from 'react';
import { ApiOptions, BaseRequestOptions } from '../types/apiTypes';
import { useApiHook } from './api/useApiHook';

// Generic store interface that any Zustand store must implement
interface CacheStore {
  getCacheData: (key: string) => any | null;
  setCacheData: (key: string, data: any) => void;
  clearCacheData: (key?: string) => void;
}

// Configuration for the cached API hook
interface CachedApiConfig<
  TRequest extends z.Schema | null = null,
  TResponse extends z.Schema | null = null,
> extends BaseRequestOptions {
  requestSchema?: TRequest;
  responseSchema?: TResponse;
}

interface StorageConfig<TStore extends CacheStore, TStorageParams = any> {
  useStore: () => TStore;
  storageKey: string | ((params: TStorageParams) => string);
}

// Hook return type
interface CachedApiHookReturn<TResponse> {
  data: TResponse | null;
  isLoading: boolean;
  error: Error | null;
  execute: (data?: any) => Promise<TResponse>;
  clearCache: () => void;
}

/**
 * Minimal cached API hook - stores API responses to cache only.
 *
 * This hook does NOT load from cache on mount (use navigation params for initial data).
 * It only stores API responses to cache when they arrive.
 */
export function buildCachedApiHook<
  TRequest extends z.Schema | null = null,
  TResponse extends z.Schema | null = null,
  TStore extends CacheStore = CacheStore,
  TStorageParams = any,
>(
  apiConfig: CachedApiConfig<TRequest, TResponse>,
  storageConfig: StorageConfig<TStore, TStorageParams>,
) {
  return function useCachedEndpoint(
    options?: ApiOptions<TRequest, TResponse, TStorageParams>,
  ): CachedApiHookReturn<TResponse extends z.Schema ? z.infer<TResponse> : any> {
    // Get the store instance
    const store = storageConfig.useStore();
    const setCacheData = store.setCacheData;
    const clearCacheData = store.clearCacheData;

    // Use the base API hook (handles request/response/cancellation)
    const { data: apiData, isLoading, error, execute: apiExecute } = useApiHook(apiConfig as any, options);

    // Refs for tracking cache key
    const lastKeyParamsRef = useRef<any>(null);

    // Get storageProps from options for cache key
    const storageProps = options?.storageProps;

    // Get storage key (handle both static string and function)
    const getStorageKey = useCallback((params?: TStorageParams): string => {
      if (typeof storageConfig.storageKey === 'function') {
        return storageConfig.storageKey(params as TStorageParams);
      }
      return storageConfig.storageKey;
    }, [storageConfig.storageKey]);

    // Store API response to cache when data arrives
    useEffect(() => {
      if (apiData && lastKeyParamsRef.current) {
        const key = getStorageKey(lastKeyParamsRef.current);
        setCacheData(key, apiData);
      }
    }, [apiData, setCacheData, getStorageKey]);

    // Wrap execute to track cache key and store result
    const execute = useCallback(
      async (requestData?: any) => {
        // Use storageProps for cache key if available, otherwise use requestData
        const keyParams = storageProps ?? requestData;
        lastKeyParamsRef.current = keyParams;

        // Execute API call
        const result = await apiExecute(requestData);

        // Store result to cache (also handled by useEffect above, but doing it here ensures immediate cache update)
        const key = getStorageKey(keyParams);
        setCacheData(key, result);

        return result;
      },
      [apiExecute, getStorageKey, setCacheData, storageProps],
    );

    // Clear cache for this endpoint
    const clearCache = useCallback(() => {
      const keyParams = lastKeyParamsRef.current ?? storageProps;
      if (keyParams) {
        const key = getStorageKey(keyParams);
        clearCacheData(key);
        console.log(`[CachedApiHook] 🧹 Cleared cache: ${key}`);
      }
    }, [clearCacheData, getStorageKey, storageProps]);

    return {
      data: apiData,
      isLoading,
      error,
      execute,
      clearCache,
    };
  };
}
