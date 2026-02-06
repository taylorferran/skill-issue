import z from 'zod';
import { ApiOptions, BaseRequestOptions, ParamType } from '../types/apiTypes';
import { useApiHook } from './api/useApiHook';
import { buildCachedApiHook } from './buildCachedApiHook';

// Generic store interface
interface CacheStore {
  getCacheData: (key: string) => any | null;
  setCacheData: (key: string, data: any) => void;
  clearCacheData: (key?: string) => void;
}

// Configuration for the API hook
interface ApiConfig<
  TRequest extends z.Schema | null = null,
  TResponse extends z.Schema | null = null,
> extends BaseRequestOptions {
  requestSchema?: TRequest;
  responseSchema?: TResponse;
  paramType?: ParamType;
}

// Storage configuration
interface StorageConfig<TStore extends CacheStore, TStorageParams = any> {
  useStore: () => TStore;
  storageKey: string | ((params: TStorageParams) => string);
}

// Hook return type for non-cached version
type ApiHookReturn<TRequest extends z.Schema | null, TResponse extends z.Schema | null> = ReturnType<typeof useApiHook<TRequest, TResponse>>;

/**
 * Factory function to build API endpoint hooks with optional caching.
 * 
 * **With storage config (cached):**
 * - Returns cached data immediately on mount
 * - Auto-fetches fresh data in background
 * - Updates cache when fresh data arrives
 * 
 * **Without storage config (non-cached):**
 * - Simple wrapper around useApiHook
 * - No caching, just direct API calls
 * 
 * @example
 * // Cached hook (for GET requests)
 * export const useGetUserSkills = buildApiEndpointHook(
 *   {
 *     method: 'GET',
 *     apiInstance: 'backend',
 *     url: '/users/:userId/skills',
 *     requestSchema: GetUserSkillsPathSchema,
 *     responseSchema: GetUserSkillsResponseSchema,
 *     paramType: "Path"
 *   },
 *   {
 *     useStore: useSkillsStore,
 *     storageKey: (params) => `userSkills:${params?.userId || 'default'}`,
 *   }
 * );
 * 
 * // Non-cached hook (for POST/PUT/DELETE)
 * export const useSubmitAnswer = buildApiEndpointHook({
 *   method: 'POST',
 *   apiInstance: 'backend',
 *   url: '/answer',
 *   requestSchema: SubmitAnswerSchema,
 *   responseSchema: SubmitAnswerResponseSchema,
 *   paramType: "Body"
 * });
 */
export function buildApiEndpointHook<
  TRequest extends z.Schema | null = null,
  TResponse extends z.Schema | null = null,
  TStore extends CacheStore = CacheStore,
  TStorageParams = any,
>(
  apiConfig: ApiConfig<TRequest, TResponse>,
  storageConfig?: StorageConfig<TStore, TStorageParams>,
) {
  // If storage config provided, use cached version with storage params type
  if (storageConfig) {
    return buildCachedApiHook<TRequest, TResponse, TStore, TStorageParams>(apiConfig, storageConfig);
  }
  
  // Otherwise, return simple hook without caching
  return function useEndpoint(
    options?: ApiOptions<TRequest, TResponse>,
  ): ApiHookReturn<TRequest, TResponse> {
    return useApiHook(apiConfig as any, options);
  };
}
