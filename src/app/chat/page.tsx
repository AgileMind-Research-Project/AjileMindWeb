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
import { API_CONFIG } from '@/lib/config/api.config';

// Redis Chat API Configuration
const API_URL = `${API_CONFIG.baseURL}/api/v1`;

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
    createChannel: async (name: string, description?: string, projectId?: number, projectName?: string) => {
        const token = redisChatAPI.getToken();
        if (!token) throw new Error('Not authenticated');

        const body: any = {
            name,
            description: description || '',
            is_private: false
        };
        if (projectId) {
            body.project_id = projectId;
            body.team_name = projectName || '';
        }

        const response = await fetch(`${API_URL}/chat/channels`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error('Failed to create channel');
        return await response.json();
    },

    // Get all projects
    getProjects: async () => {
        const token = redisChatAPI.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/projects/?page=1&limit=100`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch projects');
        return await response.json();
    },

    // Get project details (includes lead & managers)
    getProjectDetails: async (projectId: number) => {
        const token = redisChatAPI.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/projects/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch project details');
        return await response.json();
    },

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
    },

    // Delete channel
    deleteChannel: async (channelId: string) => {
        const token = redisChatAPI.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_URL}/chat/channels/${channelId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete channel');
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
    unread_count: 0,
    team_name: redisChannel.team_name || undefined,
    team_id: redisChannel.project_id ? String(redisChannel.project_id) : undefined,
    is_member: redisChannel.is_member
});

interface Project {
    project_id: number;
    project_name: string;
    key: string;
    project_type: string;
    start_date: string;
    end_date: string;
    description?: string;
    project_lead?: string;
    project_manager?: string[];
}

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
    const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [channelCreationType, setChannelCreationType] = useState<'chat' | 'project'>('chat');
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelDesc, setNewChannelDesc] = useState('');
    const [creating, setCreating] = useState(false);
    // Project channel state
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [projectMembers, setProjectMembers] = useState<string[]>([]); // emails/names of project members
    const [showAddMembersModal, setShowAddMembersModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [addingMembers, setAddingMembers] = useState(false);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [startingMeeting, setStartingMeeting] = useState(false);

    // Transcripts State
    const [showTranscriptsModal, setShowTranscriptsModal] = useState(false);
    const [transcriptsList, setTranscriptsList] = useState<any[]>([]);
    const [selectedTranscript, setSelectedTranscript] = useState<any>(null);
    const [loadingTranscripts, setLoadingTranscripts] = useState(false);

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
                    const roles = payload.roles || [];
                    setCurrentUserRoles(roles);
                    console.log('Current user ID:', userId);
                }
            }
        } catch (error) {
            console.error('Failed to decode token:', error);
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

            // Get user's project IDs from auth storage
            let myProjectIds: number[] = [];
            try {
                const authStorage = localStorage.getItem('auth-storage');
                if (authStorage) {
                    const parsed = JSON.parse(authStorage);
                    const storedProjects = parsed.state?.user?.projects;
                    if (Array.isArray(storedProjects)) {
                        myProjectIds = storedProjects;
                    }
                }
            } catch (e) {
                console.warn('Failed to parse auth storage for projects', e);
            }

            // Trigger project load for UI but don't wait
            loadProjects();

            if (response.success && response.data?.channels) {
                const allChannels = response.data.channels.map(transformRedisChannel);

                // Filter: Show if (I am a member) OR (Is a project channel AND I have access)
                const visibleChannels = allChannels.filter((ch: Channel) => {
                    // 1. If I am a member (joined), always show
                    if (ch.is_member) return true;

                    // 2. If it is a project channel, show if I have access to the project
                    const pId = ch.project_id || (ch.team_id ? parseInt(ch.team_id) : null);
                    if (pId !== null && !isNaN(pId)) {
                        return myProjectIds.includes(pId);
                    }

                    // 3. Otherwise (Public generic channel I haven't joined) -> Hide
                    return false;
                });

                setChannels(visibleChannels);
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

    const loadProjects = async () => {
        setLoadingProjects(true);
        try {
            const response = await redisChatAPI.getProjects();
            if (response.data) {
                setProjects(response.data);
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoadingProjects(false);
        }
    };

    const handleProjectSelect = async (projectId: number) => {
        setSelectedProjectId(projectId);
        const project = projects.find(p => p.project_id === projectId);
        if (project) {
            // Auto-fill channel name with project name
            setNewChannelName(project.project_name);
            // Build project members list from lead + managers
            const members: string[] = [];
            if (project.project_lead) members.push(project.project_lead);
            if (project.project_manager) members.push(...project.project_manager);
            setProjectMembers(members);
        }
    };

    const handleOpenCreateModal = () => {
        setChannelCreationType('chat');
        setNewChannelName('');
        setNewChannelDesc('');
        setSelectedProjectId(null);
        setProjectMembers([]);
        setShowCreateModal(true);
    };

    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return;
        if (channelCreationType === 'project' && !selectedProjectId) return;

        setCreating(true);
        try {
            const selectedProject = channelCreationType === 'project'
                ? projects.find(p => p.project_id === selectedProjectId)
                : undefined;

            const response = await redisChatAPI.createChannel(
                newChannelName,
                newChannelDesc,
                selectedProject?.project_id,
                selectedProject?.project_name
            );

            if (response.success && response.data) {
                // Inject team_name so sidebar grouping works
                const rawData = {
                    ...response.data,
                    team_name: selectedProject?.project_name || undefined
                };
                const transformedChannel = transformRedisChannel(rawData);
                addChannel(transformedChannel);
                setNewChannelName('');
                setNewChannelDesc('');
                setSelectedProjectId(null);
                setProjectMembers([]);
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
                let users = response.data;
                // If active channel is a project channel, filter to project members only
                if (activeChannel?.team_id && activeChannel?.team_name) {
                    const projId = parseInt(activeChannel.team_id);
                    if (!isNaN(projId)) {
                        // Load project details to get lead & managers
                        try {
                            const projResp = await redisChatAPI.getProjectDetails(projId);
                            const proj = projResp.data || projResp;
                            const members: string[] = [];
                            if (proj.project_lead) members.push(proj.project_lead);
                            if (proj.project_manager) members.push(...proj.project_manager);
                            // Filter users whose email or full name is in project members
                            users = users.filter((u: any) => {
                                const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                                return members.some(m =>
                                    (u.email && u.email.toLowerCase() === m.toLowerCase()) ||
                                    (fullName && fullName.toLowerCase() === m.toLowerCase())
                                );
                            });
                        } catch (e) {
                            console.warn('Could not load project details for member filter:', e);
                        }
                    }
                }
                setAvailableUsers(users);
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
            // Import meeting API
            const { meetingAPI } = await import('@/lib/api/meetingAPI');

            // Create meeting via API
            const response = await meetingAPI.createMeeting(
                activeChannelId!,
                `${activeChannel.name} Meeting`,
                `Instant meeting in ${activeChannel.name}`
            );

            if (response.success && response.data) {
                const meetingId = response.data.id;

                // Start the meeting immediately
                await meetingAPI.startMeeting(meetingId);

                // Redirect to meeting page
                const meetingUrl = `/meetings/${meetingId}?channel=${activeChannelId}&title=${encodeURIComponent(activeChannel.name)}`;

                // Open in new tab (Teams-like behavior)
                window.open(meetingUrl, '_blank');

                setShowMeetingModal(false);

                // Send notification message to channel
                await handleSendMessage(`📹 Meeting started! Join here: /meetings/${meetingId}`);
            }
        } catch (error) {
            console.error('Failed to start meeting:', error);
            alert('Failed to start meeting: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setStartingMeeting(false);
        }
    };

    const handleOpenTranscripts = async () => {
        if (!activeChannelId) return;

        setShowTranscriptsModal(true);
        setLoadingTranscripts(true);
        setTranscriptsList([]); // Clear previous

        try {
            // Import meeting API dynamically
            const { meetingAPI } = await import('@/lib/api/meetingAPI');

            const response = await meetingAPI.getChannelTranscripts(activeChannelId);

            if (response.success && response.data?.transcripts) {
                setTranscriptsList(response.data.transcripts);
            }
        } catch (error) {
            console.error('Failed to load transcripts:', error);
            alert('Failed to load transcripts');
        } finally {
            setLoadingTranscripts(false);
        }
    };

    const handleDeleteChannel = async () => {
        if (!activeChannelId) return;

        if (confirm(`Are you sure you want to delete channel "${activeChannel?.name}"? This cannot be undone.`)) {
            try {
                await redisChatAPI.deleteChannel(activeChannelId);
                // Remove from store
                useChatStore.getState().removeChannel(activeChannelId);
                alert('Channel deleted successfully');
            } catch (error) {
                console.error('Failed to delete channel:', error);
                alert('Failed to delete channel');
            }
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Channel Sidebar */}
            <div className="w-80 flex-shrink-0">
                <ChannelSidebar onCreateChannel={handleOpenCreateModal} />
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
                                    {/* Transcripts Button */}
                                    <button
                                        onClick={handleOpenTranscripts}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                                        title="View meeting transcripts"
                                    >
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Transcripts
                                    </button>

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

                                    {/* Delete Channel Button (Super Admin Only) */}
                                    {currentUserRoles.includes('SUPER_ADMIN') && (
                                        <button
                                            onClick={handleDeleteChannel}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                            title="Delete Channel"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete
                                        </button>
                                    )}

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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Create Channel</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Channel Type Selector */}
                        <div className="px-6 pt-4">
                            <p className="text-sm font-medium text-gray-600 mb-3">Select channel type</p>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Chat Channel */}
                                <button
                                    onClick={() => {
                                        setChannelCreationType('chat');
                                        setNewChannelName('');
                                        setSelectedProjectId(null);
                                        setProjectMembers([]);
                                    }}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${channelCreationType === 'chat'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span className="text-sm font-semibold">Chat Channel</span>
                                    <span className="text-xs text-center opacity-70">General purpose channel for any team</span>
                                </button>

                                {/* Project Channel */}
                                <button
                                    onClick={() => {
                                        setChannelCreationType('project');
                                        setNewChannelName('');
                                        setSelectedProjectId(null);
                                        setProjectMembers([]);
                                        if (projects.length === 0) loadProjects();
                                    }}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${channelCreationType === 'project'
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    <span className="text-sm font-semibold">Project Channel</span>
                                    <span className="text-xs text-center opacity-70">Linked to a project, access restricted to project members</span>
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4 space-y-4">

                            {/* Project Selector (only for Project Channel) */}
                            {channelCreationType === 'project' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Project *
                                    </label>
                                    {loadingProjects ? (
                                        <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                                            Loading projects...
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedProjectId ?? ''}
                                            onChange={(e) => {
                                                const pid = parseInt(e.target.value);
                                                if (!isNaN(pid)) handleProjectSelect(pid);
                                                else {
                                                    setSelectedProjectId(null);
                                                    setNewChannelName('');
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                        >
                                            <option value="">-- Select a project --</option>
                                            {projects.map(p => (
                                                <option key={p.project_id} value={p.project_id}>
                                                    {p.project_name} ({p.key})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {projects.length === 0 && !loadingProjects && (
                                        <p className="text-xs text-amber-600 mt-1">No projects found. Please create a project first.</p>
                                    )}
                                </div>
                            )}

                            {/* Channel Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Channel Name *
                                </label>
                                <input
                                    type="text"
                                    value={newChannelName}
                                    onChange={(e) => setNewChannelName(e.target.value)}
                                    placeholder={channelCreationType === 'project' ? 'Auto-filled from project' : 'engineering'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus={channelCreationType === 'chat'}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={newChannelDesc}
                                    onChange={(e) => setNewChannelDesc(e.target.value)}
                                    placeholder={channelCreationType === 'project' ? 'Project discussion channel' : 'Engineering team discussions'}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            {/* Project members info badge */}
                            {channelCreationType === 'project' && selectedProjectId && projectMembers.length > 0 && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-sm text-indigo-700">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span className="font-medium">{projectMembers.length} project member{projectMembers.length !== 1 ? 's' : ''} will have access:</span>
                                    </div>
                                    <p className="text-xs text-indigo-600 mt-1 ml-6">{projectMembers.join(', ')}</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    disabled={creating}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateChannel}
                                    disabled={
                                        !newChannelName.trim() || creating ||
                                        (channelCreationType === 'project' && !selectedProjectId)
                                    }
                                    className={`px-4 py-2 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${channelCreationType === 'project' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
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

                                {activeChannel?.team_id && activeChannel?.team_name && (
                                    <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                                        <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                        <span className="text-sm text-indigo-700">
                                            <span className="font-medium">Project Channel</span> — showing only members of <span className="font-semibold">{activeChannel.team_name}</span>
                                        </span>
                                    </div>
                                )}
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

            {/* Transcripts Modal */}
            {showTranscriptsModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                {selectedTranscript && (
                                    <button
                                        onClick={() => setSelectedTranscript(null)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                )}
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {selectedTranscript ? selectedTranscript.title || 'Meeting Transcript' : 'Meeting Transcripts'}
                                </h2>
                            </div>
                            <button
                                onClick={() => {
                                    setShowTranscriptsModal(false);
                                    setSelectedTranscript(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden">
                            {loadingTranscripts ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : selectedTranscript ? (
                                // Detail View
                                <div className="h-full flex flex-col">
                                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between text-sm text-gray-500">
                                        <div>
                                            {new Date(selectedTranscript.stored_at).toLocaleString()} • {selectedTranscript.metadata?.duration || 'Unknown duration'}
                                        </div>
                                        <div>
                                            Participants: {selectedTranscript.metadata?.participants?.join(', ') || 'Unknown'}
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 bg-white font-mono text-sm whitespace-pre-wrap">
                                        {selectedTranscript.content}
                                    </div>
                                </div>
                            ) : (
                                // List View
                                <div className="h-full overflow-y-auto p-6">
                                    {transcriptsList.length === 0 ? (
                                        <div className="text-center text-gray-500 py-12">
                                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <h3 className="text-lg font-medium text-gray-900">No transcripts found</h3>
                                            <p className="mt-1">Meeting transcripts will appear here after meetings referencing this channel end.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {transcriptsList.map((transcript) => (
                                                <div
                                                    key={transcript.meeting_id}
                                                    onClick={() => setSelectedTranscript(transcript)}
                                                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                                                                {transcript.title || 'Untitled Meeting'}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                {new Date(transcript.stored_at).toLocaleString(undefined, {
                                                                    dateStyle: 'full',
                                                                    timeStyle: 'short'
                                                                })}
                                                            </p>
                                                        </div>
                                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                            Detailed
                                                        </span>
                                                    </div>
                                                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                            </svg>
                                                            {transcript.metadata?.participants?.length || 0} participants
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                                            </svg>
                                                            {transcript.metadata?.message_count || 0} messages
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Start Meeting Modal */}
            {showMeetingModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
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
