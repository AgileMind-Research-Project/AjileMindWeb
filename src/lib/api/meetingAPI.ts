/**
 * Meeting API Client
 * 
 * Handles all meeting-related API calls:
 * - Meeting creation and management
 * - Join requests
 * - Participant management
 * - Transcript storage
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Get JWT token from storage
const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;

    try {
        // Try Zustand auth storage first
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            const parsed = JSON.parse(authStorage);
            if (parsed.state?.accessToken) {
                return parsed.state.accessToken;
            }
        }

        // Fallback to direct access_token
        const directToken = localStorage.getItem('access_token');
        if (directToken) {
            return directToken;
        }
    } catch (error) {
        console.error('Failed to get auth token:', error);
    }

    return null;
};

// Helper to make authenticated requests
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || 'Request failed');
    }

    return response.json();
};

// Meeting API
export const meetingAPI = {
    /**
     * Create an instant meeting
     */
    createMeeting: async (channelId: string, title?: string, description?: string) => {
        return fetchAPI('/meetings', {
            method: 'POST',
            body: JSON.stringify({
                channel_id: channelId,
                title,
                description,
            }),
        });
    },

    /**
     * Get meeting details
     */
    getMeeting: async (meetingId: string) => {
        return fetchAPI(`/meetings/${meetingId}`);
    },

    /**
     * Start a meeting (change status to live)
     */
    startMeeting: async (meetingId: string) => {
        return fetchAPI(`/meetings/${meetingId}/start`, {
            method: 'PATCH',
        });
    },

    /**
     * End a meeting
     */
    endMeeting: async (meetingId: string) => {
        return fetchAPI(`/meetings/${meetingId}/end`, {
            method: 'PATCH',
        });
    },

    /**
     * Get all meetings for a channel
     */
    getChannelMeetings: async (channelId: string, includeEnded: boolean = false) => {
        const params = new URLSearchParams();
        if (includeEnded) params.append('include_ended', 'true');
        return fetchAPI(`/meetings/channels/${channelId}/meetings?${params}`);
    },

    /**
     * Create a join request
     */
    createJoinRequest: async (meetingId: string, message?: string) => {
        return fetchAPI(`/meetings/${meetingId}/join-requests`, {
            method: 'POST',
            body: JSON.stringify({ message }),
        });
    },

    /**
     * Get pending join requests (host only)
     */
    getJoinRequests: async (meetingId: string) => {
        return fetchAPI(`/meetings/${meetingId}/join-requests`);
    },

    /**
     * Approve or reject a join request
     */
    processJoinRequest: async (meetingId: string, requestId: string, action: 'approve' | 'reject') => {
        return fetchAPI(`/meetings/${meetingId}/join-requests/${requestId}`, {
            method: 'PATCH',
            body: JSON.stringify({ action }),
        });
    },

    /**
     * Add participant directly (bypasses join request)
     */
    addParticipant: async (meetingId: string, userId: string, username: string) => {
        return fetchAPI(`/meetings/${meetingId}/participants`, {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                username,
            }),
        });
    },

    /**
     * Remove participant
     */
    removeParticipant: async (meetingId: string, userId: string) => {
        return fetchAPI(`/meetings/${meetingId}/participants/${userId}`, {
            method: 'DELETE',
        });
    },

    /**
     * Get all participants
     */
    getParticipants: async (meetingId: string) => {
        return fetchAPI(`/meetings/${meetingId}/participants`);
    },

    /**
     * Store meeting transcript
     */
    storeTranscript: async (
        meetingId: string,
        content: string,
        format: string = 'text',
        metadata?: Record<string, any>
    ) => {
        return fetchAPI(`/meetings/${meetingId}/transcripts`, {
            method: 'POST',
            body: JSON.stringify({
                content,
                format,
                metadata,
            }),
        });
    },

    /**
     * Get meeting transcript
     */
    getTranscript: async (meetingId: string) => {
        return fetchAPI(`/meetings/${meetingId}/transcripts`);
    },
};
