import { httpClient } from '@/lib/api/http-client';

export enum DowntimeType {
    PLANNED_MAINTENANCE = "PLANNED_MAINTENANCE",
    EMERGENCY_OUTAGE = "EMERGENCY_OUTAGE",
    FEATURE_UPGRADE = "FEATURE_UPGRADE",
    SERVICE_DEGRADATION = "SERVICE_DEGRADATION"
}

export enum Priority {
    HIGH = "HIGH",
    MEDIUM = "MEDIUM",
    LOW = "LOW"
}

export enum Audience {
    ALL_USERS = "ALL_USERS",
    INTERNAL_TEAM = "INTERNAL_TEAM",
    PROJECT_MEMBERS = "PROJECT_MEMBERS",
    ADMINS = "ADMINS"
}

export interface Schedule {
    start_time: string; // ISO Date String
    end_time: string;   // ISO Date String
    timezone: string;
}

export interface Content {
    subject: string;
    message_body: string;
}

export interface DowntimeNotificationRequest {
    type: DowntimeType | string;
    priority: Priority | string;
    affected_components: string[];
    schedule: Schedule;
    audience: Audience | string;
    project_id?: number | null;
    target_roles?: string[]; // Filter by roles
    target_emails?: string[]; // Specific recipients list
    content: Content;
    scheduled_at?: string; // ISO String for delayed sending
}

export interface NotificationResponse {
    success: boolean;
    message: string;
    data?: any;
}

export const notificationsApi = {
    // Send downtime notification
    sendDowntimeNotification: async (data: DowntimeNotificationRequest): Promise<NotificationResponse> => {
        return httpClient.post('/notifications/downtime', data);
    },

    // List downtime notifications
    listDowntimeNotifications: async (page = 1, limit = 20): Promise<any> => {
        return httpClient.get('/notifications/downtime', { params: { page, page_size: limit } });
    },

    // Update downtime notification
    updateDowntimeNotification: async (id: number, data: DowntimeNotificationRequest): Promise<NotificationResponse> => {
        return httpClient.put(`/notifications/downtime/${id}`, data);
    },

    // Delete downtime notification
    deleteDowntimeNotification: async (id: number): Promise<NotificationResponse> => {
        return httpClient.delete(`/notifications/downtime/${id}`);
    }
};
