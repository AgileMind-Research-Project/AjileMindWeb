/**
 * API Configuration
 * 
 * Centralized API configuration for all HTTP requests
 */

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  version: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
  timeout: 180000, // 3 minutes - increased for large file uploads (backlog)
};

export const API_ENDPOINTS = {
  // Platform Registration
  REGISTER_TENANT: '/platform/register-tenant',

  // Authentication
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
  CHANGE_PASSWORD: '/auth/change-password',
  VERIFY_CURRENT_PASSWORD: '/auth/verify-current-password',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VALIDATE_PASSWORD: '/auth/validate-password',

  // Users
  INVITE_USER: '/users/invite',
  LIST_USERS: '/users',
  GET_USER: (userId: string) => `/users/${userId}`,
  UPDATE_USER: (userId: string) => `/users/${userId}`,
  DELETE_USER: (userId: string) => `/users/${userId}`,

  // Roles
  LIST_ROLES: '/roles',
  CREATE_ROLE: '/roles',

  // Projects (uses existing /api/v1/projects endpoint)
  LIST_PROJECTS: '/projects',
  GET_PROJECT: (projectId: number) => `/projects/${projectId}`,
  GET_PROJECT_SPRINTS: (projectId: number) => `/projects/${projectId}/sprints`,

  // User Project Assignments
  GET_USER_PROJECTS: (userId: string) => `/users/${userId}/projects`,
  UPDATE_USER_PROJECTS: (userId: string) => `/users/${userId}/projects`,
};

export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.baseURL;
  const version = API_CONFIG.version;
  return `${baseUrl}/api/${version}${endpoint}`;
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: process.env.NEXT_PUBLIC_TOKEN_STORAGE_KEY || 'agilemind_access_token',
  REFRESH_TOKEN: process.env.NEXT_PUBLIC_REFRESH_TOKEN_STORAGE_KEY || 'agilemind_refresh_token',
  USER: process.env.NEXT_PUBLIC_USER_STORAGE_KEY || 'agilemind_user',
  TENANT: process.env.NEXT_PUBLIC_TENANT_STORAGE_KEY || 'agilemind_tenant',
};

export const PLATFORM_URLS = {
  HOME: process.env.NEXT_PUBLIC_PLATFORM_HOME_URL || 'http://localhost:3000',
  AGILEMIND: process.env.NEXT_PUBLIC_AGILEMIND_PLATFORM_URL || 'http://localhost:3001',
};
