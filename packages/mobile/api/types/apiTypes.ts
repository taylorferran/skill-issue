import { AxiosInstance, ResponseType } from "axios";
import { z } from "zod";

export interface AuthHandlers {
  getAccessToken: () => Promise<string | null>;
  isAuthenticated: boolean | undefined;
}

export type ApiServiceMap = {
  [key in ApiServiceName]: AxiosInstance;
};

export type ApiServiceName = "backend";

export type ApiHookReturnType<
  TResponse extends z.Schema | null,
  TOptions extends { selector?: any },
> = TOptions extends {
  selector: (data: any) => infer TSelected;
}
  ? TSelected | null
  : (TResponse extends z.Schema ? z.infer<TResponse> : any) | null;

export type ApiOptions<
  TRequest extends z.Schema | null = null,
  TResponse extends z.Schema | null = null,
> = (TRequest extends z.Schema
  ? { requestData?: z.infer<TRequest>; autoFetch?: boolean }
  : { requestData?: never; autoFetch?: never }) &
  (TResponse extends z.Schema
    ? {
      selector?: never;
      globalState?: never;
    }
    : {
      selector?: never;
      globalState?: never;
    });
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface NoParams {
  paramType?: never;
}
interface WithParams<T extends z.Schema | null> {
  paramType: T extends z.Schema ? ParamType : never;
}
export type ParamType = "Path" | "Query" | "Body" | "PathAndBody" | "PathAndQuery";

export type BaseRequestOptions = {
  method: HttpMethod;
  apiInstance: ApiServiceName;
  responseType?: ResponseType;
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
};

export type RequestOptions<TRequest extends z.Schema | null = null> =
  BaseRequestOptions &
  (TRequest extends z.Schema ? WithParams<TRequest> : NoParams);
