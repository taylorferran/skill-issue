import { z } from 'zod';
import { use, useCallback, useEffect, useState } from 'react';
import { ApiOptions, RequestOptions } from '../../types/apiTypes';
import { ApiContext } from '../../ApiProvider';
import { SendRequest } from '../../axios/apiFetch';
import axios from 'axios';

// Helper type to determine the return type based on whether selector exists
export type ApiHookReturnType<TResponse extends z.Schema | null> = TResponse extends z.Schema ? z.infer<TResponse> | null : null;

export type ApiHookReturn<TRequest extends z.Schema | null, TResponse extends z.Schema | null> = {
  data: ApiHookReturnType<TResponse>;
  isLoading: boolean;
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
  error: Error | null;
  execute: ExecuteFunction<TRequest, TResponse>;
  reset: () => void;
} {
  const [state, setState] = useState<ApiState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const apiInstances = use(ApiContext);

  const execute = useCallback(
    async (data?: any) => {
      if (!apiInstances) throw new Error("Axios Instances haven't been setup");

      console.log('[useApiHook] 🚀 API Request:', {
        method: config.method,
        url: config.url,
        apiInstance: config.apiInstance
      });

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

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

        // Store only the raw response
        setState((prev) => ({
          ...prev,
          data: response,
          isLoading: false,
        }));

        return response;
      } catch (error) {
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
          throw error;
        } else {
          console.error('[useApiHook] ❌ Non-Axios Error:', error);
          //setState((prev) => ({ ...prev, error: error, isLoading: false }));
          throw error;
        }
      }
    },
    [config, apiInstances],
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  useEffect(() => {
    if (options?.autoFetch) {
      execute(options.requestData);
    }
  }, [options?.autoFetch, execute, options?.requestData]);

  return {
    data: state.data as ApiHookReturnType<TResponse>,
    isLoading: state.isLoading,
    error: state.error,
    execute: execute as ExecuteFunction<TRequest, TResponse>,
    reset,
  };
}
