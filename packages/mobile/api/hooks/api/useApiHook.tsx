import { z } from 'zod';
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiOptions, RequestOptions } from '../../types/apiTypes';
import { ApiContext } from '../../ApiProvider';
import { SendRequest } from '../../axios/apiFetch';
import axios from 'axios';

// Helper type to determine the return type based on whether selector exists
export type ApiHookReturnType<TResponse extends z.Schema | null> = TResponse extends z.Schema ? z.infer<TResponse> | null : null;

export type ApiHookReturn<TRequest extends z.Schema | null, TResponse extends z.Schema | null> = {
  data: ApiHookReturnType<TResponse>;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  execute: ExecuteFunction<TRequest, TResponse>;
  reset: () => void;
};

export type ExecuteFunction<TRequest extends z.Schema | null, TResponse extends z.Schema | null> = TRequest extends z.Schema
  ? (data: z.infer<TRequest>) => Promise<TResponse extends z.Schema ? z.infer<TResponse> : any>
  : () => Promise<TResponse extends z.Schema ? z.infer<TResponse> : any>;

export interface ApiState<T = any> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

// Single function signature using conditional types
export function useApiHook<TRequest extends z.Schema | null = null, TResponse extends z.Schema | null = null>(
  config: RequestOptions<TRequest> & {
    requestSchema?: TRequest;
    responseSchema?: TResponse;
  },
  options?: ApiOptions<TRequest, TResponse>,
): {
  data: ApiHookReturnType<TResponse>;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  execute: ExecuteFunction<TRequest, TResponse>;
  reset: () => void;
} {
  const [state, setState] = useState<ApiState>({
    data: null,
    isLoading: false,
    error: null,
  });
  const [isFetching, setIsFetching] = useState(false);
  
  // AbortController ref for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const apiInstances = use(ApiContext);

  // Ref to track if initial autoFetch has been called
  const hasFetchedRef = useRef(false);

  // Memoize the clearDataOnCall option value to stabilize dependencies
  const clearDataOnCall = options?.clearDataOnCall;

  const execute = useCallback(
    async (data?: any) => {
      if (!apiInstances) throw new Error("Axios Instances haven't been setup");

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('[useApiHook] 🛑 Cancelled previous request:', {
          method: config.method,
          url: config.url,
        });
      }

      // Create new AbortController for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      console.log('[useApiHook] 🚀 API Request:', {
        method: config.method,
        url: config.url,
        apiInstance: config.apiInstance,
        clearDataOnCall: options?.clearDataOnCall
      });

      const shouldClearData = options?.clearDataOnCall === true;
      setIsFetching(true);

      if (shouldClearData) {
        // Explicit clear requested - clear data and show loading
        setState((prev) => ({ ...prev, data: null, isLoading: true, error: null }));
      } else if (!state.data) {
        // First call with no cached data - show loading
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
      }
      // If we have cached data and clearDataOnCall is false/undefined,
      // we keep showing the cached data during refresh (cache-first behavior)

      try {
        const response = await SendRequest(
          {
            ...config,
            requestSchema: config.requestSchema,
            responseSchema: config.responseSchema,
          },
          apiInstances[config.apiInstance],
          data,
        );

        console.log('[useApiHook] ✅ API Success:', {
          method: config.method,
          url: config.url,
          status: 'success'
        });

        // Clear the abort controller ref since request completed
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }

        // Always update data and clear loading/fetching states
        setState((prev) => ({
          ...prev,
          data: response,
          isLoading: false,
          error: null,
        }));
        setIsFetching(false);

        return response;
      } catch (error) {
        // Clear the abort controller ref on error
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }

        if (axios.isAxiosError(error)) {
          console.error('[useApiHook] ❌ API Error:', {
            method: config.method,
            url: config.url,
            error: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
          setState((prev) => ({ ...prev, error: error, isLoading: false }));
        } else {
          console.error('[useApiHook] ❌ Non-Axios Error:', error);
        }
        setIsFetching(false);
        throw error;
      }
    },
    [config, apiInstances, clearDataOnCall],
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  // Cleanup: Cancel any pending requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('[useApiHook] 🧹 Cleanup: Cancelled pending request on unmount');
      }
    };
  }, []);

  // Auto-fetch effect - only runs once when autoFetch becomes true
  useEffect(() => {
    if (options?.autoFetch && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      execute(options.requestData);
    }
  }, [options?.autoFetch, execute]);

  return {
    data: state.data as ApiHookReturnType<TResponse>,
    isLoading: state.isLoading,
    isFetching,
    error: state.error,
    execute: execute as ExecuteFunction<TRequest, TResponse>,
    reset,
  };
}
