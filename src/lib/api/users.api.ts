/**
 * Users API Service
 * 
 * API calls for user management
 */

import { httpClient } from './http-client';
import { API_ENDPOINTS } from '@/lib/config/api.config';

export interface User {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    tenant_name?: string;
    created_at?: string;
}

export interface UserListResponse {
    success: boolean;
    message: string;
    data: User[];
}

export const usersApi = {
    // Get all users
    listUsers: async (): Promise<UserListResponse> => {
        return httpClient.get(API_ENDPOINTS.LIST_USERS);
    },
};
