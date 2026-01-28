import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { z } from 'zod';
import { ParamType, RequestOptions } from '../types/apiTypes';

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
        let preparsedUrl = requestConfig.url;
        for (const [key, value] of Object.entries(data)) {
          preparsedUrl = preparsedUrl?.replace(`:${key}`, String(value));
        }
        requestConfig.url = preparsedUrl;
        break;
      case 'Body':
        requestConfig.data = data;
        break;
      case 'Query':
        requestConfig.params = data;
    }
  }

  try {
    const response: AxiosResponse = await apiInstance.request(requestConfig);
    if (responseType === 'blob') return response.data as any;
    if (responseSchema) {
      return validateWithZod(responseSchema, response.data);
    }

    return response.data as any;
  } catch (error) {
    console.log(error as Error);
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
