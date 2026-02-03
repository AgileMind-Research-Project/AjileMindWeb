/**
 * HTTP Client
 * 
 * Axios instance with interceptors for authentication and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, getApiUrl } from '@/lib/config/api.config';

// Helper to get auth state from Zustand persist storage
const getAuthFromStorage = () => {
  if (typeof window === 'undefined') return null;

  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state || null;
    }
  } catch (error) {
    console.error('Failed to parse auth storage:', error);
  }
  return null;
};

class HttpClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: `${API_CONFIG.baseURL}/api/${API_CONFIG.version}`,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.instance.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const authState = getAuthFromStorage();

          if (authState?.accessToken) {
            config.headers.Authorization = `Bearer ${authState.accessToken}`;
          }

          if (authState?.tenant?.tenant_id) {
            config.headers['X-Tenant-ID'] = authState.tenant.tenant_id;
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - Try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const authState = getAuthFromStorage();
            const refreshToken = authState?.refreshToken;

            if (refreshToken) {
              const response = await axios.post(
                getApiUrl('/auth/refresh'),
                { refresh_token: refreshToken }
              );

              const { access_token } = response.data.data;

              // Update token in storage
              if (typeof window !== 'undefined') {
                const authStorage = localStorage.getItem('auth-storage');
                if (authStorage) {
                  const parsed = JSON.parse(authStorage);
                  if (parsed.state) {
                    parsed.state.accessToken = access_token;
                    localStorage.setItem('auth-storage', JSON.stringify(parsed));
                  }
                }
              }

              // Retry original request
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
              }

              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - logout user
            this.clearAuth();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage');
    }
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.put(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.delete(url, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.patch(url, data, config);
    return response.data;
  }
}

// Export singleton instance
export const httpClient = new HttpClient();
