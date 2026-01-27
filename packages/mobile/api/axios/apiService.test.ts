import { describe, test, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { createAuthenticatedApiClient } from './apiService';
import { AuthHandlers } from '../types/apiTypes';

vi.mock('axios');

describe('Authenticated API Client', () => {
  const mockCreate = vi.fn().mockReturnValue({
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.create).mockImplementation(mockCreate);
  });

  test('should create axios instance with correct config', () => {
    const baseConfig = { baseURL: 'https://api.example.com' };
    const authHandlers: AuthHandlers = {
      isAuthenticated: false,
      getAccessToken: vi.fn(),
    };

    createAuthenticatedApiClient(baseConfig, authHandlers);

    expect(axios.create).toHaveBeenCalledWith({
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      baseURL: 'https://api.example.com',
    });
  });

  test('should add authentication header when user is authenticated', async () => {
    const baseConfig = { baseURL: 'https://api.example.com' };
    const authHandlers: AuthHandlers = {
      isAuthenticated: true,
      getAccessToken: vi.fn().mockResolvedValue('test-token'),
    };

    let requestInterceptor = vi.fn();

    const mockAxiosInstance = {
      interceptors: {
        request: {
          use: (callback: any) => {
            requestInterceptor = callback;
          },
        },
        response: {
          use: () => {},
        },
      },
    };
    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any);

    createAuthenticatedApiClient(baseConfig, authHandlers);
    const config = { headers: {} };
    const modifiedConfig = await requestInterceptor(config);

    expect(authHandlers.getAccessToken).toHaveBeenCalled();
    expect(modifiedConfig.headers).toHaveProperty(
      'Authorization',
      'Bearer test-token',
    );
  });

  test('should not add authentication header when user is not authenticated', async () => {
    const baseConfig = { baseURL: 'https://api.example.com' };
    const authHandlers: AuthHandlers = {
      isAuthenticated: false,
      getAccessToken: vi.fn(),
    };

    let requestInterceptor = vi.fn();

    const mockAxiosInstance = {
      interceptors: {
        request: {
          use: (callback: any) => {
            requestInterceptor = callback;
          },
        },
        response: {
          use: () => {},
        },
      },
    };
    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any);

    createAuthenticatedApiClient(baseConfig, authHandlers);
    const config = { headers: {} };
    const modifiedConfig = await requestInterceptor(config);

    expect(authHandlers.getAccessToken).not.toHaveBeenCalled();
    expect(modifiedConfig.headers).not.toHaveProperty('Authorization');
  });

  test('should handle error in getAccessToken', async () => {
    const baseConfig = { baseURL: 'https://api.example.com' };
    const authHandlers: AuthHandlers = {
      isAuthenticated: true,
      getAccessToken: vi.fn().mockRejectedValue(new Error('Token error')),
    };

    let requestInterceptor = vi.fn();

    const mockAxiosInstance = {
      interceptors: {
        request: {
          use: (callback: any) => {
            requestInterceptor = callback;
          },
        },
        response: {
          use: () => {},
        },
      },
    };
    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any);

    createAuthenticatedApiClient(baseConfig, authHandlers);
    const config = { headers: {} };
    const modifiedConfig = await requestInterceptor(config);

    expect(authHandlers.getAccessToken).toHaveBeenCalled();
    expect(modifiedConfig).toEqual(config);
  });

  test('should handle API error responses correctly', async () => {
    const baseConfig = { baseURL: 'https://api.example.com' };
    const authHandlers: AuthHandlers = {
      isAuthenticated: false,
      getAccessToken: vi.fn(),
    };

    let responseErrorInterceptor = vi.fn();
    const mockAxiosInstance = {
      interceptors: {
        request: {
          use: () => {},
        },
        response: {
          // @ts-ignore
          use: (onSuccess: any, onError: any) => {
            responseErrorInterceptor = onError;
          },
        },
      },
    };
    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any);

    createAuthenticatedApiClient(baseConfig, authHandlers);

    const mockAxiosError = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
    };

    let errorThrown = false;
    try {
      await responseErrorInterceptor(mockAxiosError);
    } catch (error) {
      errorThrown = true;
      expect(error).toBe(mockAxiosError);
    }

    expect(errorThrown).toBe(true);
  });
});
