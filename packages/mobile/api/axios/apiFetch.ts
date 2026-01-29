import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { z } from 'zod';
import { ParamType, RequestOptions } from '../types/apiTypes';

/**
 * Extract path parameter names from a URL pattern
 * @example extractPathParamsFromUrl("/users/:userId/skills") => ["userId"]
 * @example extractPathParamsFromUrl("/items/:id/details/:detailId") => ["id", "detailId"]
 */
function extractPathParamsFromUrl(url: string): string[] {
  const matches = url.match(/:(\w+)/g);
  return matches ? matches.map(m => m.substring(1)) : [];
}

/**
 * Separate data into path parameters and body/query parameters
 * @param data - The complete request data
 * @param pathParamNames - Array of parameter names that should be used for path replacement
 * @returns Object with separated pathParams and bodyParams
 */
function separatePathAndBodyParams(
  data: Record<string, any>,
  pathParamNames: string[]
): { pathParams: Record<string, any>; bodyParams: Record<string, any> } {
  const pathParams: Record<string, any> = {};
  const bodyParams: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (pathParamNames.includes(key)) {
      pathParams[key] = value;
    } else {
      bodyParams[key] = value;
    }
  }
  
  return { pathParams, bodyParams };
}

export async function SendRequest<TRequest extends z.Schema | null = null, TResponse extends z.Schema | null = null>(
  options: RequestOptions<TRequest> & {
    requestSchema?: TRequest;
    responseSchema?: TResponse;
  },
  apiInstance: AxiosInstance,
  data?: TRequest extends z.Schema ? z.infer<TRequest> : never,
): Promise<TResponse extends z.Schema ? z.infer<TResponse> : never> {
  const { method, paramType, url, headers = {}, timeout, requestSchema, responseSchema, responseType } = options;
  let requestConfig: AxiosRequestConfig = {
    method,
    url,
    headers,
    timeout,
    responseType: responseType ?? 'json',
  };

  if (paramType && data) {
    if (requestSchema) validateWithZod(requestSchema, data);
    switch (paramType as ParamType) {
      case 'Path':
        // Use all data for path parameter replacement
        let preparsedUrl = requestConfig.url;
        for (const [key, value] of Object.entries(data)) {
          preparsedUrl = preparsedUrl?.replace(`:${key}`, String(value));
        }
        requestConfig.url = preparsedUrl;
        break;
        
      case 'PathAndBody':
        // Auto-detect path params from URL, send remaining data in body
        const pathParamNames = extractPathParamsFromUrl(requestConfig.url || '');
        const { pathParams, bodyParams } = separatePathAndBodyParams(data, pathParamNames);
        
        console.log('[apiFetch] 🔍 PathAndBody separation:', {
          url: requestConfig.url,
          pathParamNames,
          pathParams,
          bodyParams
        });
        
        // Replace path params in URL
        let urlWithParams = requestConfig.url;
        for (const [key, value] of Object.entries(pathParams)) {
          urlWithParams = urlWithParams?.replace(`:${key}`, String(value));
        }
        requestConfig.url = urlWithParams;
        
        // Send remaining data in body
        if (Object.keys(bodyParams).length > 0) {
          requestConfig.data = bodyParams;
        }
        break;
        
      case 'PathAndQuery':
        // Auto-detect path params from URL, send remaining data as query params
        const pathNames = extractPathParamsFromUrl(requestConfig.url || '');
        const separated = separatePathAndBodyParams(data, pathNames);
        
        console.log('[apiFetch] 🔍 PathAndQuery separation:', {
          url: requestConfig.url,
          pathNames,
          pathParams: separated.pathParams,
          queryParams: separated.bodyParams
        });
        
        // Replace path params in URL
        let urlWithPathParams = requestConfig.url;
        for (const [key, value] of Object.entries(separated.pathParams)) {
          urlWithPathParams = urlWithPathParams?.replace(`:${key}`, String(value));
        }
        requestConfig.url = urlWithPathParams;
        
        // Send remaining data as query params
        if (Object.keys(separated.bodyParams).length > 0) {
          requestConfig.params = separated.bodyParams;
        }
        break;
        
      case 'Body':
        requestConfig.data = data;
        break;
        
      case 'Query':
        requestConfig.params = data;
        break;
    }
  }

  // Log the final request configuration for debugging
  console.log('[apiFetch] 📤 Final Request Config:', {
    method: requestConfig.method,
    url: requestConfig.url,
    baseURL: apiInstance.defaults.baseURL,
    fullURL: `${apiInstance.defaults.baseURL || ''}${requestConfig.url || ''}`,
    hasData: !!requestConfig.data,
    hasParams: !!requestConfig.params,
    headers: requestConfig.headers
  });

  try {
    const response: AxiosResponse = await apiInstance.request(requestConfig);
    if (responseType === 'blob') return response.data as any;
    if (responseSchema) {
      return validateWithZod(responseSchema, response.data);
    }

    return response.data as any;
  } catch (error) {
    console.error('[apiFetch] ❌ Request failed:', {
      url: requestConfig.url,
      baseURL: apiInstance.defaults.baseURL,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}


export function validateWithZod<T extends z.ZodType>(
  schema: T,
  data: any,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formattedErrors = formatZodErrors(result.error);
    throw new Error(`Validation Error : ${JSON.stringify(formattedErrors)}`);
  }
  return result.data;
}
function formatZodErrors(error: z.ZodError): Record<string, string> {
  return error.errors.reduce<Record<string, string>>((acc, curr) => {
    // Create a string path from the array path
    const path = curr.path.join('.');
    // Use the path as a key, or 'general' if no path exists
    const key = path.length > 0 ? path : 'general';
    // Store the error message
    acc[key] = curr.message;

    return acc;
  }, {});
}
