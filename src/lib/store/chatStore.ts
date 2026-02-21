/**
 * Chat Store - Zustand State Management
 * 
 * Manages chat state including channels, messages, and real-time updates
 */

import { create } from 'zustand';

export interface Channel {
    id: string;
    name: string;
    description?: string;
    type: 'dm' | 'group' | 'channel';
    is_private: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
    member_count?: number;
    unread_count?: number;
    last_message_at?: string;
    team_id?: string;
    team_name?: string;
    is_member?: boolean;
    project_id?: number;
}

export interface Message {
    id: string;
    channel_id: string;
    sender_id: string;
    content?: string;
    type: 'text' | 'file' | 'system';
    file_id?: string;
    parent_message_id?: string;
    is_edited: boolean;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    sender_email?: string;
    sender_full_name?: string;
    file_name?: string;
    file_url?: string;
}

interface ChatState {
    // Channels
    channels: Channel[];
    activeChannelId: string | null;

    // Messages by channel
    messages: Record<string, Message[]>;

    // Typing indicators
    typingUsers: Record<string, string[]>; // channel_id -> user_ids

    // Loading states
    isLoadingChannels: boolean;
    isLoadingMessages: boolean;

    // Actions
    setChannels: (channels: Channel[]) => void;
    addChannel: (channel: Channel) => void;
    updateChannel: (channelId: string, updates: Partial<Channel>) => void;
    removeChannel: (channelId: string) => void;

    setActiveChannelId: (channelId: string | null) => void;

    setMessages: (channelId: string, messages: Message[]) => void;
    addMessage: (channelId: string, message: Message) => void;
    updateMessage: (channelId: string, messageId: string, updates: Partial<Message>) => void;
    removeMessage: (channelId: string, messageId: string) => void;
    prependMessages: (channelId: string, messages: Message[]) => void;

    setTypingUsers: (channelId: string, userIds: string[]) => void;
    addTypingUser: (channelId: string, userId: string) => void;
    removeTypingUser: (channelId: string, userId: string) => void;

    setLoadingChannels: (loading: boolean) => void;
    setLoadingMessages: (loading: boolean) => void;

    // Helpers
    getActiveChannel: () => Channel | null;
    getChannelMessages: (channelId: string) => Message[];
    clearChannel: (channelId: string) => void;
    reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    channels: [],
    activeChannelId: null,
    messages: {},
    typingUsers: {},
    isLoadingChannels: false,
    isLoadingMessages: false,

    setChannels: (channels) => set({ channels }),

    addChannel: (channel) =>
        set((state) => ({
            channels: [channel, ...state.channels],
        })),

    updateChannel: (channelId, updates) =>
        set((state) => ({
            channels: state.channels.map((ch) =>
                ch.id === channelId ? { ...ch, ...updates } : ch
            ),
        })),

    removeChannel: (channelId) =>
        set((state) => ({
            channels: state.channels.filter((ch) => ch.id !== channelId),
            activeChannelId: state.activeChannelId === channelId ? null : state.activeChannelId,
        })),

    setActiveChannelId: (channelId) => set({ activeChannelId: channelId }),

    setMessages: (channelId, messages) =>
        set((state) => {
            // Deduplicate messages based on ID
            const uniqueMessages = Array.from(
                new Map(messages.map((m) => [m.id, m])).values()
            );
            return {
                messages: {
                    ...state.messages,
                    [channelId]: uniqueMessages,
                },
            };
        }),

    addMessage: (channelId, message) =>
        set((state) => {
            const currentMessages = state.messages[channelId] || [];
            if (currentMessages.some((m) => m.id === message.id)) {
                return state;
            }
            return {
                messages: {
                    ...state.messages,
                    [channelId]: [...currentMessages, message],
                },
            };
        }),

    updateMessage: (channelId, messageId, updates) =>
        set((state) => ({
            messages: {
                ...state.messages,
                [channelId]: (state.messages[channelId] || []).map((msg) =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                ),
            },
        })),

    removeMessage: (channelId, messageId) =>
        set((state) => ({
            messages: {
                ...state.messages,
                [channelId]: (state.messages[channelId] || []).filter((msg) => msg.id !== messageId),
            },
        })),

    prependMessages: (channelId, messages) =>
        set((state) => {
            const currentMessages = state.messages[channelId] || [];
            const newMessages = messages.filter(
                (newMsg) => !currentMessages.some((currMsg) => currMsg.id === newMsg.id)
            );

            if (newMessages.length === 0) return state;

            return {
                messages: {
                    ...state.messages,
                    [channelId]: [...newMessages, ...currentMessages],
                },
            };
        }),

    setTypingUsers: (channelId, userIds) =>
        set((state) => ({
            typingUsers: {
                ...state.typingUsers,
                [channelId]: userIds,
            },
        })),

    addTypingUser: (channelId, userId) =>
        set((state) => {
            const current = state.typingUsers[channelId] || [];
            if (!current.includes(userId)) {
                return {
                    typingUsers: {
                        ...state.typingUsers,
                        [channelId]: [...current, userId],
                    },
                };
            }
            return state;
        }),

    removeTypingUser: (channelId, userId) =>
        set((state) => ({
            typingUsers: {
                ...state.typingUsers,
                [channelId]: (state.typingUsers[channelId] || []).filter((id) => id !== userId),
            },
        })),

    setLoadingChannels: (loading) => set({ isLoadingChannels: loading }),
    setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),

    getActiveChannel: () => {
        const state = get();
        return state.channels.find((ch) => ch.id === state.activeChannelId) || null;
    },

    getChannelMessages: (channelId) => {
        const state = get();
        return state.messages[channelId] || [];
    },

    clearChannel: (channelId) =>
        set((state) => {
            const newMessages = { ...state.messages };
            delete newMessages[channelId];

            const newTypingUsers = { ...state.typingUsers };
            delete newTypingUsers[channelId];

            return {
                messages: newMessages,
                typingUsers: newTypingUsers,
            };
        }),

    reset: () =>
        set({
            channels: [],
            activeChannelId: null,
            messages: {},
            typingUsers: {},
            isLoadingChannels: false,
            isLoadingMessages: false,
        }),
}));
