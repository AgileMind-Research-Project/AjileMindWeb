/**
 * Backlog API Client
 * 
 * API functions for backlog management
 */

import { httpClient } from './http-client';
import { API_ENDPOINTS } from '@/lib/config/api.config';

export interface BacklogItem {
    id: string; // Jira issue key
    project_id: number;
    summary: string;
    description?: string;
    issue_type: 'story' | 'feature' | 'change' | 'bug';
    status: 'todo' | 'in_progress' | 'done';
    priority?: 'high' | 'medium' | 'low';
    assignee?: string;
    tags?: string[];
    severity?: string;
    created_at: string;
    updated_at: string;
}

export interface UploadBacklogResponse {
    success: boolean;
    message: string;
    items_processed: number;
    items_created: number;
    jira_issues_created: string[];
    errors?: string[];
}

export interface BacklogListResponse {
    success: boolean;
    data: BacklogItem[];
    total: number;
}

export const backlogApi = {
    // Upload Excel/CSV file to create backlog
    uploadFile: async (projectId: number, file: File): Promise<UploadBacklogResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('project_id', projectId.toString());

        return httpClient.post('/backlog/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // List backlog items for a project
    listByProject: async (projectId: number): Promise<BacklogListResponse> => {
        return httpClient.get(`/backlog/project/${projectId}`);
    },
};
