/**
 * API Client utility with integrated logging and error handling
 */

import { logger } from './logger';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  details?: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = DEFAULT_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Perform a GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Perform a POST request
   */
  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Perform a PUT request
   */
  async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Perform a DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Core request method with error handling and logging
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    const startTime = performance.now();

    try {
      // Add auth token if available
      const headers = new Headers(options.headers || {});
      if (!headers.has('Content-Type') && options.method !== 'GET') {
        headers.set('Content-Type', 'application/json');
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Log request
      logger.logApiRequest(method, url, options.body);

      // Setup timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // Make request
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - startTime);

      // Parse response
      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Log response
      if (response.ok) {
        logger.logApiResponse(method, url, response.status, duration, data);
      } else {
        logger.logApiError(method, url, response.status, data);
      }

      // Handle successful response
      if (response.ok) {
        return {
          success: true,
          data: data as T,
          status: response.status,
        };
      }

      // Handle error response
      const errorMessage = typeof data === 'object' && data?.message 
        ? data.message 
        : data || 'Unknown error';

      throw {
        message: errorMessage,
        status: response.status,
        details: data,
      } as ApiError;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      // Handle different error types
      if (error instanceof TypeError) {
        // Network error
        logger.error('Network error', {
          method,
          url,
          message: error.message,
        });
        return {
          success: false,
          error: 'Network error. Please check your connection.',
          status: 0,
        };
      }

      if ((error as any).name === 'AbortError') {
        // Timeout
        logger.warn('Request timeout', { method, url, timeout: this.timeout });
        return {
          success: false,
          error: 'Request timed out. Please try again.',
          status: 408,
        };
      }

      if (error && typeof error === 'object' && 'message' in error) {
        // API error
        const apiError = error as ApiError;
        logger.logApiError(method, url, apiError.status, apiError.message);
        return {
          success: false,
          error: apiError.message,
          status: apiError.status,
        };
      }

      // Unknown error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Unexpected error', { method, url, error: errorMessage });
      return {
        success: false,
        error: 'An unexpected error occurred',
        status: 500,
      };
    }
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Set a new base URL
   */
  setBaseUrl(url: string) {
    this.baseUrl = url;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
