import apiClient from './apiClient';

export interface ReleaseNoteContent {
    features: string[];
    bug_fixes: string[];
    improvements: string[];
    breaking_changes: string[];
    known_issues: string[];
}

export interface CreateReleaseNoteRequest {
    project_id: number;
    version: string;
    title: string;
    release_date?: string | null;
    release_type: 'MAJOR' | 'MINOR' | 'PATCH' | 'HOTFIX';
    content: ReleaseNoteContent;
    summary?: string | null;
}

export interface UpdateReleaseNoteRequest {
    version?: string;
    title?: string;
    release_date?: string | null;
    release_type?: 'MAJOR' | 'MINOR' | 'PATCH' | 'HOTFIX';
    content?: ReleaseNoteContent;
    summary?: string | null;
}

export interface GenerateReleaseNoteRequest {
    project_id: number;
    version: string;
    include_tasks?: boolean;
    since_date?: string | null;
}

export interface ReleaseNote {
    id: number;
    project_id: number;
    version: string;
    title: string;
    release_date: string | null;
    release_type: string;
    content: ReleaseNoteContent;
    summary: string | null;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    created_by: number;
    created_at: string;
    updated_at: string;
    published_at: string | null;
    published_by: number | null;
}

export const releaseNotesApi = {
    create: (data: CreateReleaseNoteRequest) =>
        apiClient.post('/release-notes', data),

    list: (params?: { project_id?: number; status?: string; page?: number; page_size?: number }) =>
        apiClient.get('/release-notes', { params }),

    getById: (id: number) =>
        apiClient.get(`/release-notes/${id}`),

    update: (id: number, data: UpdateReleaseNoteRequest) =>
        apiClient.put(`/release-notes/${id}`, data),

    delete: (id: number) =>
        apiClient.delete(`/release-notes/${id}`),

    publish: (id: number) =>
        apiClient.post(`/release-notes/${id}/publish`),

    generateAI: (data: GenerateReleaseNoteRequest) =>
        apiClient.post('/release-notes/generate', data)
};
