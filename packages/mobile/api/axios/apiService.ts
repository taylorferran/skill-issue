import axios, {
  AxiosRequestConfig,
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  CreateAxiosDefaults,
} from "axios";
import { AuthHandlers } from "../types/apiTypes";

const defaultConfig: CreateAxiosDefaults = {
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
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
    try {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer whiteclaw`;
      console.log("[apiService] ✅ Authorization header added");
    } catch (error) {
      console.error("[apiService] ❌ Error getting access token:", error);
    }

    // CRITICAL: Must return config, otherwise axios receives undefined
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
