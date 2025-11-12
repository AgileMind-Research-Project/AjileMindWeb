/**
 * Authentication API Service
 * 
 * API calls for authentication, registration, and user management
 */

import { httpClient } from './http-client';
import { API_ENDPOINTS } from '@/lib/config/api.config';

export interface TenantRegisterRequest {
  company_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface TenantRegisterResponse {
  success: boolean;
  message: string;
  data: {
    tenant_id: string;
    company_name: string;
    user: {
      user_id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      role: string;
    };
    tokens: {
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
    };
    redirect_url: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      user_id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      role: string;
      tenant_id: string;
      tenant_name: string | null;
    };
    tokens: {
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
    };
    password_change_required: boolean;
  };
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface InviteUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

export interface ValidatePasswordRequest {
  password: string;
}

export interface ValidatePasswordResponse {
  success: boolean;
  data: {
    is_valid: boolean;
    requirements: {
      min_length: boolean;
      has_uppercase: boolean;
      has_lowercase: boolean;
      has_number: boolean;
      has_symbol: boolean;
    };
    errors?: string[];
  };
}

export const authApi = {
  // Tenant Registration (Platform Home)
  registerTenant: async (data: TenantRegisterRequest): Promise<TenantRegisterResponse> => {
    return httpClient.post(API_ENDPOINTS.REGISTER_TENANT, data);
  },

  // Authentication
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return httpClient.post(API_ENDPOINTS.LOGIN, data);
  },

  logout: async (): Promise<void> => {
    return httpClient.post(API_ENDPOINTS.LOGOUT);
  },

  getCurrentUser: async (): Promise<any> => {
    return httpClient.get(API_ENDPOINTS.ME);
  },

  changePassword: async (data: ChangePasswordRequest): Promise<any> => {
    return httpClient.post(API_ENDPOINTS.CHANGE_PASSWORD, data);
  },

  verifyCurrentPassword: async (currentPassword: string): Promise<any> => {
    return httpClient.post(API_ENDPOINTS.VERIFY_CURRENT_PASSWORD, { 
      current_password: currentPassword 
    });
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<any> => {
    return httpClient.post(API_ENDPOINTS.FORGOT_PASSWORD, data);
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<any> => {
    return httpClient.post(API_ENDPOINTS.RESET_PASSWORD, data);
  },

  validatePassword: async (data: ValidatePasswordRequest): Promise<ValidatePasswordResponse> => {
    return httpClient.post(API_ENDPOINTS.VALIDATE_PASSWORD, data);
  },

  // User Management
  inviteUser: async (data: InviteUserRequest): Promise<any> => {
    return httpClient.post(API_ENDPOINTS.INVITE_USER, data);
  },

  listUsers: async (params?: any): Promise<any> => {
    return httpClient.get(API_ENDPOINTS.LIST_USERS, { params });
  },

  getUser: async (userId: string): Promise<any> => {
    return httpClient.get(API_ENDPOINTS.GET_USER(userId));
  },

  updateUser: async (userId: string, data: any): Promise<any> => {
    return httpClient.put(API_ENDPOINTS.UPDATE_USER(userId), data);
  },

  deleteUser: async (userId: string): Promise<any> => {
    return httpClient.delete(API_ENDPOINTS.DELETE_USER(userId));
  },

  // Roles
  listRoles: async (): Promise<any> => {
    return httpClient.get(API_ENDPOINTS.LIST_ROLES);
  },

  createRole: async (data: any): Promise<any> => {
    return httpClient.post(API_ENDPOINTS.CREATE_ROLE, data);
  },
};
