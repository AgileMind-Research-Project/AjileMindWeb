import { httpClient } from '@/lib/api/http-client';

export interface DailyBlocker {
    id: number;
    meeting_id: string;
    ticket_id: string;
    task_id: number | null;
    project_id: number;
    detected_status: string;
    blocker_description: string;
    ai_confidence_score: number;
    ai_reasoning: string;
    extracted_context: string;
    approval_status: string;
    created_at: string;
    meeting_title: string;
    meeting_date: string;
    project_name: string;
    ai_suggestions: string[];
    suggested_mentor_role: string;
    assignee_email?: string;
    assignee_first_name?: string;
    assignee_last_name?: string;
}

export const dailyBlockersApi = {
    /**
     * Get all daily blockers
     */
    getDailyBlockers: async (projectId?: number, includeAi: boolean = false): Promise<{ success: boolean; data: DailyBlocker[] }> => {
        const params: any = { include_ai: includeAi };
        if (projectId) params.project_id = projectId;
        return httpClient.get('/task-updates/daily-blockers', { params });
    },

    /**
     * Analyze a specific blocker
     */
    analyzeBlocker: async (blockerId: number): Promise<{ success: boolean; data: { ai_suggestions: string[]; suggested_mentor_role: string } }> => {
        return httpClient.post(`/task-updates/daily-blockers/${blockerId}/analyze`);
    }
};
