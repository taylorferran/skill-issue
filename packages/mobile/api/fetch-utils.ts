import { z } from 'zod';
import Constants from 'expo-constants';

// Get API configuration from expo-constants (baked in at build time via app.config.ts)
const API_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000/api';
const API_BEARER_TOKEN = Constants.expoConfig?.extra?.apiBearerToken || '';

if (!API_BEARER_TOKEN) {
  console.warn('[fetch-utils] ⚠️ API bearer token not configured. Check EAS environment variables.');
}

/**
 * HTTP methods supported by the API
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Parameter types for API requests
 */
export type ParamType = 'Path' | 'Query' | 'Body' | 'PathAndBody' | 'PathAndQuery';

/**
 * Configuration for an API request with optional Zod schemas
 */
interface RequestConfig<
  TRequest extends z.Schema | null = null,
  TResponse extends z.Schema | null = null,
> {
  method: HttpMethod;
  url: string;
  requestSchema?: TRequest;
  responseSchema?: TResponse;
  paramType?: ParamType;
}

/**
 * Extract path parameter names from a URL pattern
 * @example extractPathParamsFromUrl("/users/:userId/skills") => ["userId"]
 */
function extractPathParamsFromUrl(url: string): string[] {
  const matches = url.match(/:(\w+)/g);
  return matches ? matches.map(m => m.substring(1)) : [];
}

/**
 * Separate data into path parameters and body/query parameters
 */
function separatePathAndBodyParams(
  data: Record<string, any>,
  pathParamNames: string[]
): { pathParams: Record<string, any>; remainingParams: Record<string, any> } {
  const pathParams: Record<string, any> = {};
  const remainingParams: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (pathParamNames.includes(key)) {
      pathParams[key] = value;
    } else {
      remainingParams[key] = value;
    }
  }

  return { pathParams, remainingParams };
}

/**
 * Replace path parameters in URL
 */
function replacePathParams(url: string, pathParams: Record<string, any>): string {
  let parsedUrl = url;
  for (const [key, value] of Object.entries(pathParams)) {
    parsedUrl = parsedUrl.replace(`:${key}`, String(value));
  }
  return parsedUrl;
}

/**
 * Build query string from parameters
 */
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Validate data with Zod schema
 */
function validateWithZod<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formattedErrors = formatZodErrors(result.error);
    throw new Error(`Validation Error: ${JSON.stringify(formattedErrors)}`);
  }
  return result.data;
}

/**
 * Format Zod errors into a readable object
 */
function formatZodErrors(error: z.ZodError): Record<string, string> {
  return error.errors.reduce<Record<string, string>>((acc, curr) => {
    const path = curr.path.join('.');
    const key = path.length > 0 ? path : 'general';
    acc[key] = curr.message;
    return acc;
  }, {});
}

/**
 * Make an authenticated API request with automatic Zod validation.
 * 
 * This function handles:
 * - URL path parameter replacement
 * - Query parameter serialization
 * - Request body serialization
 * - Bearer token authentication
 * - Zod request/response validation
 * - Error handling
 * 
 * @example
 * // GET request with path params
 * const skills = await apiFetch({
 *   method: 'GET',
 *   url: '/users/:userId/skills',
 *   paramType: 'Path',
 *   responseSchema: GetUserSkillsResponseSchema,
 * }, { userId: 'uuid-here' });
 * 
 * @example
 * // POST request with body
 * const result = await apiFetch({
 *   method: 'POST',
 *   url: '/answer',
 *   paramType: 'Body',
 *   requestSchema: SubmitAnswerSchema,
 *   responseSchema: SubmitAnswerResponseSchema,
 * }, { challengeId: 'uuid', selectedOption: 2 });
 */
export async function apiFetch<
  TRequest extends z.Schema | null = null,
  TResponse extends z.Schema | null = null,
>(
  config: RequestConfig<TRequest, TResponse>,
  data?: TRequest extends z.Schema ? z.infer<TRequest> : undefined
): Promise<TResponse extends z.Schema ? z.infer<TResponse> : any> {
  const { method, url, requestSchema, responseSchema, paramType } = config;

  // Validate request data if schema provided
  if (paramType && data && requestSchema) {
    validateWithZod(requestSchema, data);
  }

  let requestUrl = url;
  let requestBody: string | undefined;
  let queryString = '';

  // Handle parameter types
  if (paramType && data) {
    switch (paramType) {
      case 'Path': {
        // All data goes to URL path
        requestUrl = replacePathParams(url, data as Record<string, any>);
        break;
      }

      case 'PathAndBody': {
        // Separate path params from body params
        const pathParamNames = extractPathParamsFromUrl(url);
        const { pathParams, remainingParams } = separatePathAndBodyParams(
          data as Record<string, any>,
          pathParamNames
        );
        requestUrl = replacePathParams(url, pathParams);
        if (Object.keys(remainingParams).length > 0) {
          requestBody = JSON.stringify(remainingParams);
        }
        break;
      }

      case 'PathAndQuery': {
        // Separate path params from query params
        const pathNames = extractPathParamsFromUrl(url);
        const { pathParams, remainingParams } = separatePathAndBodyParams(
          data as Record<string, any>,
          pathNames
        );
        requestUrl = replacePathParams(url, pathParams);
        queryString = buildQueryString(remainingParams);
        break;
      }

      case 'Body': {
        requestBody = JSON.stringify(data);
        break;
      }

      case 'Query': {
        queryString = buildQueryString(data as Record<string, any>);
        break;
      }
    }
  }

  // Build full URL
  const fullUrl = `${API_URL}${requestUrl}${queryString}`;

  // Log request for debugging
  console.log('[apiFetch] 📤 Request:', {
    method,
    url: fullUrl,
    hasBody: !!requestBody,
  });

  // Make the request
  const response = await fetch(fullUrl, {
    method,
    headers: {
      'Authorization': `Bearer ${API_BEARER_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: requestBody,
  });

  // Handle errors
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[apiFetch] ❌ API Error:', {
      status: response.status,
      statusText: response.statusText,
      url: fullUrl,
      error: errorText,
    });
    throw new Error(`API Error ${response.status}: ${response.statusText}`);
  }

  // Handle 204 No Content - return null without parsing
  if (response.status === 204) {
    console.log('[apiFetch] ✅ Success (204 No Content):', { url: fullUrl });
    return null as any;
  }

  // Parse response for other success codes
  const responseData = await response.json();

  // Validate response if schema provided
  if (responseSchema) {
    try {
      const validatedData = validateWithZod(responseSchema, responseData);
      console.log('[apiFetch] ✅ Success:', { url: fullUrl, status: response.status });
      return validatedData;
    } catch (validationError) {
      console.error('[apiFetch] ❌ Response validation failed:', validationError);
      throw validationError;
    }
  }

  console.log('[apiFetch] ✅ Success:', { url: fullUrl, status: response.status });
  return responseData;
}
