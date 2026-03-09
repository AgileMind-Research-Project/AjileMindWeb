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
}

export const dailyBlockersApi = {
    /**
     * Get all daily blockers with AI analysis
     */
    getDailyBlockers: async (projectId?: number): Promise<{ success: boolean; data: DailyBlocker[] }> => {
        const params = projectId ? { project_id: projectId } : {};
        return httpClient.get('/task-updates/daily-blockers', { params });
    }
};
