/**
 * Roles API Client
 * 
 * Handles all role-related API requests
 */

import { httpClient } from './http-client';

export interface Role {
  role_id: string;
  role_name: string;
  description: string;
  created_at: string;
}

export interface RoleCreateRequest {
  role_name: string;
  description: string;
}

export interface RoleUpdateRequest {
  description: string;
}

export interface UpdateUserRoleRequest {
  role_id: string;
}

/**
 * Get all roles (system and custom)
 */
export const getRoles = async (): Promise<Role[]> => {
  return httpClient.get('/roles');
};

/**
 * Create a new custom role
 */
export const createRole = async (data: RoleCreateRequest): Promise<Role> => {
  return httpClient.post('/roles', data);
};

/**
 * Update an existing custom role
 */
export const updateRole = async (roleId: string, data: RoleUpdateRequest): Promise<Role> => {
  return httpClient.put(`/roles/${roleId}`, data);
};

/**
 * Delete a custom role
 */
export const deleteRole = async (roleId: string): Promise<void> => {
  await httpClient.delete(`/roles/${roleId}`);
};

/**
 * Get a user's current role
 */
export const getUserRole = async (userId: string) => {
  return httpClient.get(`/roles/users/${userId}/role`);
};

/**
 * Update a user's role
 */
export const updateUserRole = async (userId: string, data: UpdateUserRoleRequest) => {
  return httpClient.put(`/roles/users/${userId}/role`, data);
};
