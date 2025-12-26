"use client";

/**
 * Chat Page - Redis-Backed Real-Time Chat
 * 
 * Uses:
 * - Zustand chatStore for state management
 * - WebSocket for real-time updates
 * - Existing chat components
 * - Redis backend API (/api/v1/chat)
 */

import React, { useEffect, useState } from 'react';
import { useChatStore, Channel, Message } from '@/lib/store/chatStore';
import { ChannelSidebar } from '@/components/communication/ChannelSidebar';
import { MessageList } from '@/components/communication/MessageList';
import { MessageInput } from '@/components/communication/MessageInput';
import { WebSocketProvider } from '@/lib/websocket/WebSocketContext';
import { useChat } from '@/lib/hooks/useChat';

// Redis Chat API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Redis Chat API Service
const redisChatAPI = {
    // Get JWT token from auth storage
    getToken: () => {
        if (typeof window !== 'undefined') {
            try {
                // Try Zustand auth storage first (main auth system)
                const authStorage = localStorage.getItem('auth-storage');
                if (authStorage) {
                    const parsed = JSON.parse(authStorage);
                    if (parsed.state?.accessToken) {
                        return parsed.state.accessToken;
                    }
                }

                // Fallback to direct access_token (OTP registration)
                const directToken = localStorage.getItem('access_token');
                if (directToken) {
                    return directToken;
                }
            } catch (error) {
                console.error('Failed to get auth token:', error);
            }
        }
        return null;
    },

    // Get all channels
    getChannels: async () => {
        const token = redisChatAPI.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/chat/channels`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch channels');
        return await response.json();
    },

    // Create channel
    createChannel: async (name: string, description?: string) => {
        const token = redisChatAPI.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/chat/channels`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                description: description || '',
                is_private: false
            })
        });

        if (!response.ok) throw new Error('Failed to create channel');
        return await response.json();
    },

    // Get messages
    getMessages: async (channelId: string, limit: number = 50) => {
        const token = redisChatAPI.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/chat/channels/${channelId}/messages?limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch messages');
        return await response.json();
    },

    // Send message
    sendMessage: async (channelId: string, content: string) => {
        const token = redisChatAPI.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/chat/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content,
                message_type: 'text'
            })
        });

        if (!response.ok) throw new Error('Failed to send message');
        return await response.json();
    },

    // Update message
    updateMessage: async (channelId: string, messageId: string, content: string) => {
        const token = redisChatAPI.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/chat/channels/${channelId}/messages/${messageId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });

        if (!response.ok) throw new Error('Failed to update message');
        return await response.json();
    },

    // Delete message  
    deleteMessage: async (channelId: string, messageId: string) => {
        const token = redisChatAPI.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/chat/channels/${channelId}/messages/${messageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to delete message');
        return await response.json();
    },

    // Get available users (for adding to channel)
    getUsers: async () => {
        const token = redisChatAPI.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch users');
        return await response.json();
    },

    // Add members to channel
    addMembers: async (channelId: string, userIds: string[], usernames: string[]) => {
        const token = redisChatAPI.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/chat/channels/${channelId}/members`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_ids: userIds,
                usernames: usernames
            })
        });

        if (!response.ok) throw new Error('Failed to add members');
        return await response.json();
    }
};

// Transform Redis channel to store format
const transformRedisChannel = (redisChannel: any): Channel => ({
    id: redisChannel.id,
    name: redisChannel.name,
    description: redisChannel.description || '',
    type: 'channel',
    is_private: redisChannel.is_private || false,
    created_by: redisChannel.created_by_user_id,
    created_at: redisChannel.created_at,
    updated_at: redisChannel.updated_at || redisChannel.created_at,
    member_count: redisChannel.member_count || 1,
    unread_count: 0
});

// Transform Redis message to store format
const transformRedisMessage = (redisMessage: any): Message => ({
    id: redisMessage.id,
    channel_id: redisMessage.channel_id,
    sender_id: redisMessage.user_id,
    content: redisMessage.content,
    type: redisMessage.type || 'text',
    is_edited: redisMessage.edited || false,
    is_deleted: redisMessage.deleted || false,
    created_at: redisMessage.created_at,
    updated_at: redisMessage.updated_at || redisMessage.created_at,
    sender_email: redisMessage.username,
    sender_full_name: redisMessage.username
});

function ChatContent() {
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelDesc, setNewChannelDesc] = useState('');
    const [creating, setCreating] = useState(false);
    const [showAddMembersModal, setShowAddMembersModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [addingMembers, setAddingMembers] = useState(false);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [startingMeeting, setStartingMeeting] = useState(false);

    const channels = useChatStore((state) => state.channels);
    const activeChannelId = useChatStore((state) => state.activeChannelId);
    const setChannels = useChatStore((state) => state.setChannels);
    const addChannel = useChatStore((state) => state.addChannel);
    const setMessages = useChatStore((state) => state.setMessages);
    const addMessage = useChatStore((state) => state.addMessage);
    const updateMessage = useChatStore((state) => state.updateMessage);
    const removeMessage = useChatStore((state) => state.removeMessage);
    const setLoadingChannels = useChatStore((state) => state.setLoadingChannels);
    const setLoadingMessages = useChatStore((state) => state.setLoadingMessages);

    // Get active channel using a stable selector
    const activeChannel = useChatStore((state) =>
        state.channels.find((ch) => ch.id === state.activeChannelId) || null
    );

    const { isConnected } = useChat(activeChannelId, !!activeChannelId);

    // Load channels on mount
    useEffect(() => {
        loadChannels();

        // Get current user ID from JWT token
        try {
            const token = redisChatAPI.getToken();
            if (token) {
                // Decode JWT to get user_id
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    // Try user_id first, then fall back to sub
                    const userId = payload.user_id || payload.sub || '';
                    setCurrentUserId(userId);
                    console.log('Current user ID:', userId);
                }
            }
        } catch (error) {
            console.error('Failed to decode token:', error);
            // Fallback to localStorage
            const userId = localStorage.getItem('user_id') || '';
            setCurrentUserId(userId);
        }
    }, []);

    // Load messages when channel changes
    useEffect(() => {
        if (activeChannelId) {
            loadMessages(activeChannelId);
        }
    }, [activeChannelId]);

    const loadChannels = async () => {
        setLoadingChannels(true);
        setError(null);
        try {
            const response = await redisChatAPI.getChannels();
            if (response.success && response.data?.channels) {
                const transformedChannels = response.data.channels.map(transformRedisChannel);
                setChannels(transformedChannels);
            }
        } catch (error: any) {
            console.error('Failed to load channels:', error);
            setError(error.message || 'Failed to load channels');
        } finally {
            setLoadingChannels(false);
        }
    };

    const loadMessages = async (channelId: string) => {
        setLoadingMessages(true);
        try {
            const response = await redisChatAPI.getMessages(channelId);
            if (response.success && response.data?.messages) {
                const transformedMessages = response.data.messages
                    .map(transformRedisMessage)
                    .reverse(); // Redis returns newest first, we want oldest first
                setMessages(channelId, transformedMessages);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return;

        setCreating(true);
        try {
            const response = await redisChatAPI.createChannel(newChannelName, newChannelDesc);
            if (response.success && response.data) {
                const transformedChannel = transformRedisChannel(response.data);
                addChannel(transformedChannel);
                setNewChannelName('');
                setNewChannelDesc('');
                setShowCreateModal(false);
            }
        } catch (error) {
            console.error('Failed to create channel:', error);
            alert('Failed to create channel');
        } finally {
            setCreating(false);
        }
    };

    const handleSendMessage = async (content: string) => {
        if (!activeChannelId) return;

        try {
            const response = await redisChatAPI.sendMessage(activeChannelId, content);
            if (response.success && response.data) {
                const transformedMessage = transformRedisMessage(response.data);
                addMessage(activeChannelId, transformedMessage);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message');
        }
    };

    const handleEditMessage = async (messageId: string) => {
        if (!activeChannelId) return;

        const newContent = prompt('Edit message:');
        if (newContent) {
            try {
                const response = await redisChatAPI.updateMessage(activeChannelId, messageId, newContent);
                if (response.success) {
                    updateMessage(activeChannelId, messageId, {
                        content: newContent,
                        is_edited: true
                    });
                }
            } catch (error) {
                console.error('Failed to edit message:', error);
                alert('Failed to edit message');
            }
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!activeChannelId) return;

        if (confirm('Delete this message?')) {
            try {
                const response = await redisChatAPI.deleteMessage(activeChannelId, messageId);
                if (response.success) {
                    removeMessage(activeChannelId, messageId);
                }
            } catch (error) {
                console.error('Failed to delete message:', error);
                alert('Failed to delete message');
            }
        }
    };

    const handleFileUpload = async (file: File): Promise<string> => {
        // TODO: Implement file upload to Redis backend
        throw new Error('File upload not implemented yet');
    };

    const handleOpenAddMembers = async () => {
        setShowAddMembersModal(true);
        setSelectedUsers([]);
        await loadAvailableUsers();
    };

    const loadAvailableUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await redisChatAPI.getUsers();
            if (response.success && response.data) {
                setAvailableUsers(response.data);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            alert('Failed to load users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleToggleUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAddMembers = async () => {
        if (!activeChannelId || selectedUsers.length === 0) return;

        setAddingMembers(true);
        try {
            const selectedUserObjects = availableUsers.filter(u => selectedUsers.includes(u.user_id));
            const userIds = selectedUserObjects.map(u => u.user_id);
            const usernames = selectedUserObjects.map(u => u.email || `${u.first_name} ${u.last_name}`);

            const response = await redisChatAPI.addMembers(activeChannelId, userIds, usernames);
            if (response.success) {
                alert(`${response.data.added_count} member(s) added successfully!`);
                setShowAddMembersModal(false);
                setSelectedUsers([]);
            }
        } catch (error) {
            console.error('Failed to add members:', error);
            alert('Failed to add members');
        } finally {
            setAddingMembers(false);
        }
    };

    const handleOpenMeetingModal = () => {
        setShowMeetingModal(true);
    };

    const handleStartInstantMeeting = async () => {
        if (!activeChannel) return;

        setStartingMeeting(true);
        try {
            // Generate a unique meeting ID
            const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // In a real implementation, you would:
            // 1. Create the meeting in the backend
            // 2. Get a proper meeting ID
            // 3. Redirect to the meeting room

            // For now, we'll redirect to a meeting page with channel context
            const meetingUrl = `/meetings/${meetingId}?channel=${activeChannelId}&title=${encodeURIComponent(activeChannel.name)}`;

            // Open in new tab (Teams-like behavior)
            window.open(meetingUrl, '_blank');

            setShowMeetingModal(false);
        } catch (error) {
            console.error('Failed to start meeting:', error);
            alert('Failed to start meeting');
        } finally {
            setStartingMeeting(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Channel Sidebar */}
            <div className="w-80 flex-shrink-0">
                <ChannelSidebar onCreateChannel={() => setShowCreateModal(true)} />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeChannel ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900">{activeChannel.name}</h1>
                                    {activeChannel.description && (
                                        <p className="text-sm text-gray-500">{activeChannel.description}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Start Meeting Button */}
                                    <button
                                        onClick={handleOpenMeetingModal}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                        title="Start instant meeting"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Meet Now
                                    </button>

                                    {/* Add Members Button */}
                                    <button
                                        onClick={handleOpenAddMembers}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Add members to channel"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        Add Members
                                    </button>

                                    {/* Connection status */}
                                    <span className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
                                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-gray-400'}`} />
                                        {isConnected ? 'Connected' : 'Redis'}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {activeChannel.member_count} members
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <MessageList
                            channelId={activeChannelId!}
                            currentUserId={currentUserId}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                        />

                        {/* Message Input */}
                        <MessageInput
                            onSendMessage={handleSendMessage}
                            onTypingStart={() => { }}
                            onTypingStop={() => { }}
                            onFileUpload={handleFileUpload}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <svg
                                className="w-24 h-24 mx-auto mb-4 text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                            <h2 className="text-2xl font-semibold mb-2">Welcome to Chat</h2>
                            <p>Select a channel to start messaging</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Channel Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Create Channel</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Channel Name *
                                </label>
                                <input
                                    type="text"
                                    value={newChannelName}
                                    onChange={(e) => setNewChannelName(e.target.value)}
                                    placeholder="engineering"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={newChannelDesc}
                                    onChange={(e) => setNewChannelDesc(e.target.value)}
                                    placeholder="Engineering team discussions"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    disabled={creating}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateChannel}
                                    disabled={!newChannelName.trim() || creating}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {creating ? 'Creating...' : 'Create Channel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Members Modal */}
            {showAddMembersModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Add Members to Channel</h2>
                            <button
                                onClick={() => setShowAddMembersModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {loadingUsers ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600">
                                        Select users to add to <span className="font-semibold">{activeChannel?.name}</span>
                                    </p>
                                </div>

                                <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-lg">
                                    {availableUsers.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">
                                            No users available
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-200">
                                            {availableUsers.map((user) => (
                                                <label
                                                    key={user.user_id}
                                                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.includes(user.user_id)}
                                                        onChange={() => handleToggleUser(user.user_id)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                                                    />
                                                    <div className="ml-3 flex-1">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.first_name} {user.last_name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                        {user.role && (
                                                            <div className="text-xs text-blue-600 mt-0.5">{user.role}</div>
                                                        )}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <div className="text-sm text-gray-600">
                                        {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowAddMembersModal(false)}
                                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                            disabled={addingMembers}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddMembers}
                                            disabled={selectedUsers.length === 0 || addingMembers}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                        >
                                            {addingMembers ? 'Adding...' : `Add ${selectedUsers.length || ''} Member${selectedUsers.length !== 1 ? 's' : ''}`}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Start Meeting Modal */}
            {showMeetingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Start Meeting</h2>
                            <button
                                onClick={() => setShowMeetingModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Meeting Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 mb-1">
                                            {activeChannel?.name} Meeting
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Start an instant video meeting for this channel. All members will be able to join.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Meeting Features */}
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Meeting features:</p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-gray-600">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Video & Audio calling
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-600">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Screen sharing
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-600">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Real-time chat
                                    </li>
                                </ul>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setShowMeetingModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    disabled={startingMeeting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStartInstantMeeting}
                                    disabled={startingMeeting}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {startingMeeting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Start Meeting
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ChatPage() {
    return (
        <WebSocketProvider>
            <ChatContent />
        </WebSocketProvider>
    );
}
