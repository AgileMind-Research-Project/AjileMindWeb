import { httpClient } from '@/lib/api/http-client';

export interface Transcript {
    id: number;
    title: string;
    category: 'daily_standup' | 'sprint_meeting' | 'retrospective';
    transcript_content: string;
    transcript_date: string;
    tags?: string[];
    file_name?: string;
    project_id?: number | null;
    created_at: string;
}

export interface TranscriptListResponse {
    transcripts: Transcript[];
    total: number;
    page: number;
    page_size: number;
}

export interface DailyStandupParams {
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    page_size?: number;
}

export const transcriptsApi = {
    // List daily standups
    listDailyStandups: async (params?: DailyStandupParams): Promise<TranscriptListResponse> => {
        const queryParams = new URLSearchParams();
        if (params?.date_from) queryParams.append('date_from', params.date_from);
        if (params?.date_to) queryParams.append('date_to', params.date_to);
        if (params?.search) queryParams.append('search', params.search);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

        return httpClient.get(`/ai/transcripts/daily-standups?${queryParams.toString()}`);
    },

    // Upload transcript
    uploadTranscript: async (formData: FormData): Promise<Transcript> => {
        return httpClient.post('/ai/transcripts/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // Get transcript
    getTranscript: async (id: number): Promise<Transcript> => {
        return httpClient.get(`/ai/transcripts/${id}`);
    }
};
