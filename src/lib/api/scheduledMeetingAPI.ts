/**
 * Scheduled Meeting API Helper
 *
 * Typed fetch utilities for the /api/v1/scheduled-meetings backend.
 */

import { API_CONFIG } from '@/lib/config/api.config';

const BASE = `${API_CONFIG.baseURL}/api/v1/scheduled-meetings`;

function authHeaders(): HeadersInit {
    // Read token from Zustand auth-storage (same pattern as rest of app)
    try {
        const raw = localStorage.getItem('auth-storage');
        if (raw) {
            const parsed = JSON.parse(raw);
            const token = parsed?.state?.accessToken;
            if (token) return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        }
    } catch (_) { }
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token ?? ''}`, 'Content-Type': 'application/json' };
}

export interface ScheduledMeeting {
    meeting_id: string;
    project_id: number;
    sprint_id: number;
    title: string;
    meeting_category: string;
    meeting_date: string;
    start_time: string;
    end_time: string;
    meeting_link: string;
    status: string;
    created_by?: string;
    attendees?: string[];
    created_at?: string;
    updated_at?: string;
}

export interface ScheduleMeetingPayload {
    project_id: number;
    sprint_id: number;
    title: string;
    meeting_category: string;
    meeting_date: string;         // YYYY-MM-DD
    start_time: string;           // HH:MM
    end_time: string;             // HH:MM
    meeting_link?: string;
    attendees?: string[];
}

export const SCRUM_MEETING_CATEGORIES = [
    'Daily Standup',
    'Sprint Planning',
    'Sprint Review',
    'Sprint Retrospective',
    'Backlog Refinement / Grooming',
    'Release Planning',
    'Stakeholder Review',
    'Technical Design Meeting',
    'Incident / Post-Mortem',
    'One-on-One',
    'Other',
] as const;

// ── CRUD ──────────────────────────────────────────────────────────────────────

export const scheduledMeetingAPI = {
    /** Create a new scheduled meeting */
    async create(payload: ScheduleMeetingPayload): Promise<{ success: boolean; data?: ScheduledMeeting; detail?: string }> {
        const res = await fetch(BASE, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        return res.json();
    },

    /** Get all meetings for a project */
    async getByProject(projectId: number): Promise<{ success: boolean; data?: { meetings: ScheduledMeeting[]; total: number } }> {
        const res = await fetch(`${BASE}/project/${projectId}`, { headers: authHeaders() });
        return res.json();
    },

    /** Get all meetings for a sprint */
    async getBySprint(projectId: number, sprintId: number): Promise<{ success: boolean; data?: { meetings: ScheduledMeeting[]; total: number } }> {
        const res = await fetch(`${BASE}/sprint/${projectId}/${sprintId}`, { headers: authHeaders() });
        return res.json();
    },

    /** Get a single meeting */
    async getById(meetingId: string): Promise<{ success: boolean; data?: ScheduledMeeting }> {
        const res = await fetch(`${BASE}/${meetingId}`, { headers: authHeaders() });
        return res.json();
    },

    /** Delete a meeting */
    async delete(meetingId: string): Promise<{ success: boolean; message?: string }> {
        const res = await fetch(`${BASE}/${meetingId}`, {
            method: 'DELETE',
            headers: authHeaders(),
        });
        return res.json();
    },

    /** Update meeting status */
    async updateStatus(meetingId: string, status: string): Promise<{ success: boolean }> {
        const res = await fetch(`${BASE}/${meetingId}/status`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ status }),
        });
        return res.json();
    },

    /** Update meeting attendees */
    async updateAttendees(meetingId: string, attendees: string[]): Promise<{ success: boolean }> {
        const res = await fetch(`${BASE}/${meetingId}/attendees`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ attendees }),
        });
        return res.json();
    },

    /** Extend meeting end time */
    async extendEndTime(meetingId: string, newEndTime: string): Promise<{ success: boolean; message?: string }> {
        const res = await fetch(`${BASE}/${meetingId}/extend`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ new_end_time: newEndTime }),
        });
        return res.json();
    },
};
