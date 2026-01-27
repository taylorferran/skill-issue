import z from 'zod';
import { ApiOptions, RequestOptions } from '../types/apiTypes';
import { useApiHook } from './api/useApiHook';

export function buildApiEndpointHook<
  TRequest extends z.Schema | null = null,
  TResponse extends z.Schema | null = null,
>(
  config: RequestOptions<TRequest> & {
    requestSchema?: TRequest;
    responseSchema?: TResponse;
  },
) {
  return function useEndpoint<
    TOptions extends ApiOptions<TRequest, TResponse> & {
      selector?: (
        data: TResponse extends z.Schema ? z.infer<TResponse> : any,
      ) => any;
    } = ApiOptions<TRequest, TResponse>,
  >(options?: TOptions) {
    return useApiHook(config, options);
  };
}
