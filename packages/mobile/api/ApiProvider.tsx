import { createContext, use, useEffect, useMemo } from 'react';
import { createAuthenticatedApiClient } from './axios/apiService';
import { ApiServiceName, ApiServiceMap, AuthHandlers } from './types/apiTypes';
import { useAuth } from '@clerk/clerk-expo';

interface IApiProvider {
  children: React.ReactNode;
  serviceUrls: Record<ApiServiceName, string>;
}

export const ApiContext = createContext<ApiServiceMap | null>(null);

export function ApiProvider({ children, serviceUrls }: IApiProvider) {

  const { isSignedIn, getToken} = useAuth();
  const apiInstances: ApiServiceMap = useMemo(() => {
    const authHandlers: AuthHandlers = {
      getAccessToken : getToken,
      isAuthenticated: isSignedIn,
    };
    return {
      backend: createAuthenticatedApiClient({ baseURL: serviceUrls.backend }, authHandlers),
    };
  }, [getToken, isSignedIn, serviceUrls]);

  // Log API initialization for debugging
  useEffect(() => {
    console.log('[ApiProvider] 🚀 Initializing API instances with URLs:', serviceUrls);
    console.log('[ApiProvider] 🔐 Auth state - isSignedIn:', isSignedIn);
  }, [serviceUrls, isSignedIn]);

  return <ApiContext.Provider value={apiInstances}>{children}</ApiContext.Provider>;
}
