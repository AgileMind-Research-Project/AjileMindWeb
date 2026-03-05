/**
 * Chat Hook - Manages chat WebSocket and state
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useWebSocket } from '../websocket/WebSocketContext';
import { useChatStore } from '../store/chatStore';
import { chatAPI, getWebSocketURL } from '../api/communicationAPI';

export function useChat(channelId: string | null, enabled: boolean = true) {
    const { sendMessage, subscribe, connect, disconnect, isConnected } = useWebSocket();
    const addMessage = useChatStore((state) => state.addMessage);
    const updateMessage = useChatStore((state) => state.updateMessage);
    const removeMessage = useChatStore((state) => state.removeMessage);
    const addTypingUser = useChatStore((state) => state.addTypingUser);
    const removeTypingUser = useChatStore((state) => state.removeTypingUser);

    // Connect to WebSocket - read token from auth-storage (Zustand) first, then fallback
    useEffect(() => {
        if (!enabled || !channelId) return;

        let token: string | null = null;
        try {
            const authStorage = localStorage.getItem('auth-storage');
            if (authStorage) {
                const parsed = JSON.parse(authStorage);
                token = parsed.state?.accessToken || null;
            }
        } catch (e) { /* ignore */ }

        if (!token) {
            token = localStorage.getItem('access_token');
        }

        if (!token) return;

        const wsUrl = getWebSocketURL('chat', channelId);
        connect(wsUrl, token);

        return () => disconnect();
    }, [channelId, enabled, connect, disconnect]);

    // Subscribe to messages
    useEffect(() => {
        if (!channelId) return;

        const unsubscribers = [
            // New message
            subscribe('message', (payload) => {
                if (payload.data && payload.data.channel_id === channelId) {
                    addMessage(channelId, payload.data);
                }
            }),

            // Message edit
            subscribe('message_edit', (payload) => {
                if (payload.data && payload.data.channel_id === channelId) {
                    updateMessage(channelId, payload.data.id, payload.data);
                }
            }),

            // Message delete
            subscribe('message_delete', (payload) => {
                if (payload.message_id && payload.channel_id === channelId) {
                    removeMessage(channelId, payload.message_id);
                }
            }),

            // Typing indicators
            subscribe('typing_start', (payload) => {
                if (payload.channel_id === channelId && payload.user_id) {
                    addTypingUser(channelId, payload.user_id);
                }
            }),

            subscribe('typing_stop', (payload) => {
                if (payload.channel_id === channelId && payload.user_id) {
                    removeTypingUser(channelId, payload.user_id);
                }
            }),
        ];

        return () => {
            unsubscribers.forEach((unsub) => unsub());
        };
    }, [channelId, subscribe, addMessage, updateMessage, removeMessage, addTypingUser, removeTypingUser]);

    // Send message
    const sendChatMessage = useCallback(
        (content: string, fileId?: string) => {
            if (!channelId) return;

            sendMessage({
                type: 'message',
                content,
                message_type: fileId ? 'file' : 'text',
                file_id: fileId,
            });
        },
        [channelId, sendMessage]
    );

    // Typing indicators
    const startTyping = useCallback(() => {
        sendMessage({ type: 'typing_start' });
    }, [sendMessage]);

    const stopTyping = useCallback(() => {
        sendMessage({ type: 'typing_stop' });
    }, [sendMessage]);

    // Load messages
    const loadMessages = useCallback(async () => {
        if (!channelId) return;

        try {
            const response = await chatAPI.getMessages(channelId);
            if (response.success && response.data) {
                useChatStore.getState().setMessages(channelId, response.data.messages);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }, [channelId]);

    return {
        isConnected,
        sendMessage: sendChatMessage,
        startTyping,
        stopTyping,
        loadMessages,
    };
}
