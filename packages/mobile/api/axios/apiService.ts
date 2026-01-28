import axios, {
  AxiosRequestConfig,
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  CreateAxiosDefaults,
} from 'axios';
import { AuthHandlers } from '../types/apiTypes';

const defaultConfig: CreateAxiosDefaults = {
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

export function createAuthenticatedApiClient(
  baseConfig: AxiosRequestConfig,
  authHandlers: AuthHandlers,
): AxiosInstance {
  const axiosInstance = axios.create({
    ...defaultConfig,
    ...baseConfig,
  });

  axiosInstance.interceptors.request.use(async (config) => {
    if (authHandlers.isAuthenticated) {
      try {
        const token = await authHandlers.getAccessToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting access token:', error);
      }
    }
    return config;
  });

  // Add response interceptor for error handling
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      if (error.response) {
        console.log(`Api Error: ${error.response.status}`, error.response.data);
      }
      return Promise.reject(error);
    },
  );

  return axiosInstance;
}
