/**
 * Projects API Service
 * 
 * API calls for project management
 */

import { httpClient } from './http-client';
import { API_ENDPOINTS } from '@/lib/config/api.config';

export interface Project {
    project_id: number;
    project_name: string;
    key: string;
    project_type: string;
    start_date: string;
    end_date: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
    jira_url?: string;
}

export interface ProjectListResponse {
    success: boolean;
    message: string;
    data: Project[];
    total: number;
    page: number;
    limit: number;
}

export interface ProjectResponse {
    success: boolean;
    message: string;
    data: Project;
}

export const projectsApi = {
    // Get all projects
    listProjects: async (params?: { page?: number; limit?: number }): Promise<ProjectListResponse> => {
        return httpClient.get(API_ENDPOINTS.LIST_PROJECTS, { params });
    },

    // Get single project
    getProject: async (projectId: number): Promise<ProjectResponse> => {
        return httpClient.get(API_ENDPOINTS.GET_PROJECT(projectId));
    },
};
