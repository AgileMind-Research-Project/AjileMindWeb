/**
 * Release Notes API Service
 * 
 * API calls for release note management
 */

import { httpClient } from './http-client';

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
    start_sprint?: number | null;
    end_sprint?: number | null;
    content: ReleaseNoteContent;
    summary?: string | null;
}

export interface UpdateReleaseNoteRequest {
    version?: string;
    title?: string;
    release_date?: string | null;
    release_type?: 'MAJOR' | 'MINOR' | 'PATCH' | 'HOTFIX';
    start_sprint?: number | null;
    end_sprint?: number | null;
    content?: ReleaseNoteContent;
    summary?: string | null;
}

export interface GenerateReleaseNoteRequest {
    project_id: number;
    version?: string;
    include_tasks?: boolean;
    since_date?: string | null;
    start_sprint?: number | null;
    end_sprint?: number | null;
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
    created_by: string;
    created_at: string;
    updated_at: string;
    published_at: string | null;
    published_by: string | null;
}

export interface BacklogRelease {
    id: string;
    project_id: number;
    sprint_id: number | null;
    summary: string;
    description: string | null;
    issue_type: string;
    status: string;
    priority: string | null;
    created_at: string;
    updated_at: string;
    start_date: string | null;
    end_date: string | null;
}

export const releaseNotesApi = {
    create: (data: CreateReleaseNoteRequest) =>
        httpClient.post('/release-notes', data),

    list: (params?: { project_id?: number; status?: string; page?: number; page_size?: number }) =>
        httpClient.get('/release-notes', { params }),

    getById: (id: number) =>
        httpClient.get(`/release-notes/${id}`),

    update: (id: number, data: UpdateReleaseNoteRequest) =>
        httpClient.put(`/release-notes/${id}`, data),

    delete: (id: number) =>
        httpClient.delete(`/release-notes/${id}`),

    publish: (id: number) =>
        httpClient.post(`/release-notes/${id}/publish`),

    generateAI: (data: GenerateReleaseNoteRequest) =>
        httpClient.post('/release-notes/generate', data),

    listBacklogReleases: (projectId: number) =>
        httpClient.get(`/release-notes/backlog-releases/${projectId}`),

    listAllBacklogReleases: () =>
        httpClient.get('/release-notes/backlog-releases'),

    getLatestVersion: (projectId: number): Promise<{ version: string | null }> =>
        httpClient.get(`/release-notes/latest-version/${projectId}`),
};
