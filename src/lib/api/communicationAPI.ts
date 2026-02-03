/**
 * Communication API Utilities
 * 
 * API client for communication endpoints
 */

import { API_CONFIG } from '@/lib/config/api.config';

const API_BASE_URL = `${API_CONFIG.baseURL}/api/v1`;

const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('access_token');
    }
    return null;
};

const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || 'Request failed');
    }

    return response.json();
};

// Channel APIs
export const chatAPI = {
    // Get all channels
    getChannels: async () => {
        return fetchAPI('/chat/channels');
    },

    // Get channel by ID
    getChannel: async (channelId: string) => {
        return fetchAPI(`/chat/channels/${channelId}`);
    },

    // Create channel
    createChannel: async (data: {
        name: string;
        description?: string;
        type: 'dm' | 'group' | 'channel';
        is_private?: boolean;
        member_ids?: string[];
    }) => {
        return fetchAPI('/chat/channels', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Get channel messages
    getMessages: async (channelId: string, limit: number = 50, before?: string) => {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (before) params.append('before', before);

        return fetchAPI(`/chat/channels/${channelId}/messages?${params}`);
    },

    // Update message
    updateMessage: async (messageId: string, content: string) => {
        return fetchAPI(`/chat/messages/${messageId}`, {
            method: 'PATCH',
            body: JSON.stringify({ content }),
        });
    },

    // Delete message
    deleteMessage: async (messageId: string) => {
        return fetchAPI(`/chat/messages/${messageId}`, {
            method: 'DELETE',
        });
    },
};

// Meeting APIs
export const meetingAPI = {
    // Get meetings
    getMeetings: async (status?: string) => {
        const params = status ? `?status_filter=${status}` : '';
        return fetchAPI(`/meeting/${params}`);
    },

    // Get meeting by ID
    getMeeting: async (meetingId: string) => {
        return fetchAPI(`/meeting/${meetingId}`);
    },

    // Create meeting
    createMeeting: async (data: {
        title: string;
        description?: string;
        scheduled_start?: string;
        scheduled_end?: string;
        max_participants?: number;
    }) => {
        return fetchAPI('/meeting/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Join meeting
    joinMeeting: async (meetingId: string, data: { audio_enabled?: boolean; video_enabled?: boolean }) => {
        return fetchAPI(`/meeting/${meetingId}/join`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Leave meeting
    leaveMeeting: async (meetingId: string) => {
        return fetchAPI(`/meeting/${meetingId}/leave`, {
            method: 'POST',
        });
    },
};

// Presence APIs
export const presenceAPI = {
    // Get user presences
    getUserPresences: async (userIds: string[]) => {
        return fetchAPI(`/presence/users?user_ids=${userIds.join(',')}`);
    },

    // Update own presence
    updatePresence: async (data: {
        status: 'online' | 'offline' | 'away' | 'busy' | 'dnd';
        custom_status?: string;
        custom_emoji?: string;
    }) => {
        return fetchAPI('/presence/status', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },
};

// File APIs
export const fileAPI = {
    // Upload file
    uploadFile: async (file: File, channelId?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (channelId) formData.append('channel_id', channelId);

        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/files/upload`, {
            method: 'POST',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('File upload failed');
        }

        return response.json();
    },

    // Get file metadata
    getFileMetadata: async (fileId: string) => {
        return fetchAPI(`/files/${fileId}/metadata`);
    },

    // Get download URL
    getDownloadUrl: (fileId: string) => {
        const token = getAuthToken();
        return `${API_BASE_URL}/files/${fileId}?token=${token}`;
    },
};

// WebSocket URLs
export const getWebSocketURL = (type: 'chat' | 'meeting' | 'presence', id?: string) => {
    const wsBase = API_BASE_URL.replace('http', 'ws');

    switch (type) {
        case 'chat':
            return `${wsBase}/chat/ws/${id}`;
        case 'meeting':
            return `${wsBase}/meeting/ws/${id}`;
        case 'presence':
            return `${wsBase}/presence/ws`;
        default:
            throw new Error('Invalid WebSocket type');
    }
};
