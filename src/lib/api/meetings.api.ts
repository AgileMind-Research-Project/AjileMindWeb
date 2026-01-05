import { httpClient } from '@/lib/api/http-client';
import { API_CONFIG } from '@/lib/config/api.config';

export interface Meeting {
    id: number;
    meeting_id: string;
    project_id: number | null;
    title: string;
    description: string | null;
    date: string;
    start_time: string;
    end_time: string;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    category: string;
    created_at: string;
    created_by: string;
    // Add other fields as needed
}

export interface CreateMeetingRequest {
    title: string;
    description?: string;
    project_id?: number | null;
    date: string;
    start_time: string;
    end_time: string;
    category?: string;
    attendees?: string[];
}

export interface UpdateMeetingRequest {
    title?: string;
    description?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
    status?: string;
    category?: string;
}

export const meetingsApi = {
    // Create new meeting
    createMeeting: async (data: CreateMeetingRequest): Promise<Meeting> => {
        return httpClient.post('/meetings/', data);
    },

    // List meetings
    listMeetings: async (params?: { project_id?: number; date?: string }): Promise<Meeting[]> => {
        return httpClient.get('/meetings/', { params });
    },

    // Get single meeting
    getMeeting: async (meetingId: string): Promise<Meeting> => {
        return httpClient.get(`/meetings/${meetingId}`);
    },

    // Update meeting
    updateMeeting: async (meetingId: string, data: UpdateMeetingRequest): Promise<Meeting> => {
        return httpClient.put(`/meetings/${meetingId}`, data);
    },

    // Delete meeting
    deleteMeeting: async (meetingId: string): Promise<{ success: boolean; message: string }> => {
        return httpClient.delete(`/meetings/${meetingId}`);
    },

    // Get project users
    getProjectUsers: async (projectId: number): Promise<any[]> => {
        const response = await httpClient.get<{ success: boolean; data: any[] }>(`/meetings/project/${projectId}/users`);
        return response.data;
    }
};
