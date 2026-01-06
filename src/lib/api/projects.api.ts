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

    // Get project sprints
    getProjectSprints: async (projectId: number): Promise<SprintListResponse> => {
        return httpClient.get(API_ENDPOINTS.GET_PROJECT_SPRINTS(projectId));
    },

    // Get active sprints with tasks
    getActiveSprints: async (projectId: number, date: string): Promise<ActiveSprintsResponse> => {
        return httpClient.post(API_ENDPOINTS.GET_PROJECT_SPRINTS(projectId).replace('/sprints', '/sprints/active'), { date });
    },
};

export interface Sprint {
    sprint_id: number;
    project_id: number;
    sprint_name: string;
    sprint_goal?: string;
    start_date: string;
    end_date: string;
    sprint_status: 'Not Started' | 'In Progress' | 'Completed' | 'Closed';
    total_estimated_hours?: number;
    total_completed_hours?: number;
    created_at?: string;
    updated_at?: string;
    tasks?: any[];
}

export interface SprintListResponse {
    success: boolean;
    message: string;
    data: Sprint[];
    total: number;
}

export interface ActiveSprintsResponse {
    success: boolean;
    message: string;
    data: {
        sprints: Sprint[];
        total: number;
    };
}
