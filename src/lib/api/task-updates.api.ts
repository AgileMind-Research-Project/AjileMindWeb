import { httpClient } from '@/lib/api/http-client';

export interface TaskUpdate {
    id: number;
    meeting_id: string;
    ticket_id: string;
    task_id?: number;
    project_id: number;
    detected_status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
    blocker_description?: string;
    ai_confidence_score: number;
    ai_reasoning?: string;
    extracted_context?: string;
    approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewed_by?: string;
    review_timestamp?: string;
    reviewer_remark?: string;
    jira_sync_status: 'NOT_SYNCED' | 'SYNCED' | 'FAILED';
    jira_sync_timestamp?: string;
    jira_error_message?: string;
    created_at: string;
    updated_at: string;
}

export interface TaskUpdateExtract {
    ticket_id: string;
    detected_status: string;
    blocker_description?: string;
    ai_confidence_score: number;
    ai_reasoning: string;
    extracted_context: string;
}

export interface ExtractionResponse {
    meeting_id: string;
    total_extracted: number;
    extractions: TaskUpdateExtract[];
    processing_time_ms: number;
}

export const taskUpdatesApi = {
    // Extract task updates from a meeting
    extractFromMeeting: async (meetingId: string, forceReextract: boolean = false): Promise<ExtractionResponse> => {
        return httpClient.post<ExtractionResponse>(
            `/task-updates/extract/${meetingId}?force_reextract=${forceReextract}`
        );
    },

    // Get task updates for a meeting
    getMeetingUpdates: async (meetingId: string): Promise<TaskUpdate[]> => {
        return httpClient.get<TaskUpdate[]>(`/task-updates/meeting/${meetingId}`);
    },

    // List pending approvals
    listPendingApprovals: async (projectId?: number): Promise<TaskUpdate[]> => {
        const url = projectId
            ? `/task-updates/pending?project_id=${projectId}`
            : `/task-updates/pending`;
        return httpClient.get<TaskUpdate[]>(url);
    },

    // Approve a task update
    approveUpdate: async (updateId: number, remark?: string): Promise<TaskUpdate> => {
        return httpClient.put<TaskUpdate>(
            `/task-updates/${updateId}/approve`,
            { reviewer_remark: remark }
        );
    },

    // Reject a task update
    rejectUpdate: async (updateId: number, remark?: string): Promise<TaskUpdate> => {
        return httpClient.put<TaskUpdate>(
            `/task-updates/${updateId}/reject`,
            { reviewer_remark: remark }
        );
    }
};
