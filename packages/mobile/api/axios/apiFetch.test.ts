import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { SendRequest } from './apiFetch';

describe('SendRequest', () => {
  const mockAxiosInstance = {
    request: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should make a successful GET request with query parameters', async () => {
    const mockResponse = { data: { id: 1, name: 'Test' } };
    mockAxiosInstance.request.mockResolvedValue(mockResponse);

    const querySchema = z.object({
      id: z.number(),
    });
    const responseSchema = z.object({
      id: z.number(),
      name: z.string(),
    });

    const result = await SendRequest(
      {
        method: 'GET',
        url: '/users',
        paramType: 'Query',
        requestSchema: querySchema,
        apiInstance: 'patient',
        errorMapper: 'default',
        responseSchema: responseSchema,
      },
      mockAxiosInstance as any,
      { id: 1 },
    );

    expect(mockAxiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/users',
        params: { id: 1 },
      }),
    );
    expect(result).toEqual(mockResponse.data);
  });

  it('should make a successful POST request with body', async () => {
    const mockResponse = { data: { success: true } };
    mockAxiosInstance.request.mockResolvedValue(mockResponse);

    const bodySchema = z.object({
      username: z.string(),
      email: z.string().email(),
    });

    const responseSchema = z.object({
      success: z.boolean(),
    });

    const result = await SendRequest(
      {
        method: 'POST',
        url: '/users',
        paramType: 'Body',
        apiInstance: 'patient',
        requestSchema: bodySchema,
        errorMapper: 'default',
        responseSchema: responseSchema,
      },
      mockAxiosInstance as any,
      { username: 'testuser', email: 'test@example.com' },
    );

    expect(mockAxiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/users',
        data: { username: 'testuser', email: 'test@example.com' },
      }),
    );
    expect(result).toEqual(mockResponse.data);
  });

  it('should replace path parameters correctly', async () => {
    const mockResponse = { data: { id: 1, name: 'User' } };
    mockAxiosInstance.request.mockResolvedValue(mockResponse);

    const pathSchema = z.object({
      id: z.number(),
    });

    await SendRequest(
      {
        method: 'GET',
        url: '/users/:id',
        paramType: 'Path',
        apiInstance: 'patient',
        errorMapper: 'default',
        requestSchema: pathSchema,
      },
      mockAxiosInstance as any,
      { id: 1 },
    );

    expect(mockAxiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/users/1',
      }),
    );
  });

  it('should throw a formatted error for Axios errors', async () => {
    const mockError = {
      isAxiosError: true,
      response: {
        data: { message: 'Not Found' },
        status: 404,
      },
    };
    mockAxiosInstance.request.mockRejectedValue(mockError);

    await expect(
      SendRequest(
        {
          method: 'GET',
          apiInstance: 'patient',
          errorMapper: 'default',
          url: '/users/1',
        },
        mockAxiosInstance as any,
      ),
    ).rejects.toThrow();
  });

  it('should make a request without validation schemas', async () => {
    const mockResponse = { data: { message: 'Success' } };
    mockAxiosInstance.request.mockResolvedValue(mockResponse);

    const result = await SendRequest(
      {
        method: 'GET',
        url: '/test',
        errorMapper: 'default',
        apiInstance: 'patient',
      },
      mockAxiosInstance as any,
    );

    expect(mockAxiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/test',
      }),
    );
    expect(result).toEqual(mockResponse.data);
  });

  it('should be able to handle response if no respeonse schema is set', async () => {
    const mockResponse = { data: 'Success' };
    mockAxiosInstance.request.mockResolvedValue(mockResponse);

    const result = await SendRequest(
      {
        method: 'GET',
        url: '/test',
        apiInstance: 'patient',
        errorMapper: 'default',
      },
      mockAxiosInstance as any,
    );

    expect(mockAxiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/test',
      }),
    );
    expect(result).toEqual(mockResponse.data);
  });

  it('should fail on zod validation if response is not in the correct response schema format', async () => {
    const mockResponse = { data: 'Success' };
    mockAxiosInstance.request.mockResolvedValue(mockResponse);

    await expect(
      SendRequest(
        {
          method: 'GET',
          url: '/test',
          apiInstance: 'patient',
          errorMapper: 'default',
          responseSchema: z.object({
            id: z.number(),
          }),
        },
        mockAxiosInstance as any,
      ),
    ).rejects.toThrow(
      'Validation Error : {"general":"Expected object, received string"}',
    );
  });
});
