/**
 * Presence Store - Zustand State Management
 * 
 * Manages user presence/status tracking
 */

import { create } from 'zustand';

export type PresenceStatus = 'online' | 'offline' | 'away' | 'busy' | 'dnd';

export interface UserPresence {
    user_id: string;
    status: PresenceStatus;
    custom_status?: string;
    custom_emoji?: string;
    last_seen: string;
    last_heartbeat: string;
    user_email?: string;
    user_full_name?: string;
}

interface PresenceState {
    // Presence data
    onlineUsers: Record<string, UserPresence>; // user_id -> presence

    // Current user status
    currentStatus: PresenceStatus;
    currentCustomStatus?: string;
    currentCustomEmoji?: string;

    // Actions
    setUserPresence: (userId: string, presence: UserPresence) => void;
    updateUserPresence: (userId: string, updates: Partial<UserPresence>) => void;
    removeUserPresence: (userId: string) => void;
    setMultiplePresences: (presences: UserPresence[]) => void;

    setCurrentStatus: (status: PresenceStatus, customStatus?: string, customEmoji?: string) => void;

    // Helpers
    getUserPresence: (userId: string) => UserPresence | null;
    isUserOnline: (userId: string) => boolean;
    getOnlineUserIds: () => string[];
    reset: () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
    onlineUsers: {},
    currentStatus: 'offline',
    currentCustomStatus: undefined,
    currentCustomEmoji: undefined,

    setUserPresence: (userId, presence) =>
        set((state) => ({
            onlineUsers: {
                ...state.onlineUsers,
                [userId]: presence,
            },
        })),

    updateUserPresence: (userId, updates) =>
        set((state) => {
            const current = state.onlineUsers[userId];
            if (!current) return state;

            return {
                onlineUsers: {
                    ...state.onlineUsers,
                    [userId]: { ...current, ...updates },
                },
            };
        }),

    removeUserPresence: (userId) =>
        set((state) => {
            const newOnlineUsers = { ...state.onlineUsers };
            delete newOnlineUsers[userId];
            return { onlineUsers: newOnlineUsers };
        }),

    setMultiplePresences: (presences) =>
        set((state) => {
            const newOnlineUsers = { ...state.onlineUsers };
            presences.forEach((presence) => {
                newOnlineUsers[presence.user_id] = presence;
            });
            return { onlineUsers: newOnlineUsers };
        }),

    setCurrentStatus: (status, customStatus, customEmoji) =>
        set({
            currentStatus: status,
            currentCustomStatus: customStatus,
            currentCustomEmoji: customEmoji,
        }),

    getUserPresence: (userId) => {
        const state = get();
        return state.onlineUsers[userId] || null;
    },

    isUserOnline: (userId) => {
        const state = get();
        const presence = state.onlineUsers[userId];
        return presence?.status === 'online' || presence?.status === 'busy' || presence?.status === 'away';
    },

    getOnlineUserIds: () => {
        const state = get();
        return Object.values(state.onlineUsers)
            .filter((p) => p.status === 'online' || p.status === 'busy' || p.status === 'away')
            .map((p) => p.user_id);
    },

    reset: () =>
        set({
            onlineUsers: {},
            currentStatus: 'offline',
            currentCustomStatus: undefined,
            currentCustomEmoji: undefined,
        }),
}));
