/**
 * Chat Page
 * 
 * Main chat interface with channel sidebar and message view
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useChatStore } from '@/lib/store/chatStore';
import { useChat } from '@/lib/hooks/useChat';
import { chatAPI, fileAPI } from '@/lib/api/communicationAPI';
import { ChannelSidebar } from '@/components/communication/ChannelSidebar';
import { MessageList } from '@/components/communication/MessageList';
import { MessageInput } from '@/components/communication/MessageInput';
import { WebSocketProvider } from '@/lib/websocket/WebSocketContext';

function ChatContent() {
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const channels = useChatStore((state) => state.channels);
    const activeChannelId = useChatStore((state) => state.activeChannelId);
    const setChannels = useChatStore((state) => state.setChannels);
    const setLoadingChannels = useChatStore((state) => state.setLoadingChannels);
    const activeChannel = useChatStore((state) => state.getActiveChannel());

    const { sendMessage, startTyping, stopTyping, loadMessages, isConnected } = useChat(
        activeChannelId,
        !!activeChannelId
    );

    // Load channels on mount
    useEffect(() => {
        loadChannels();

        // Get current user ID from token or user context
        const userId = localStorage.getItem('user_id') || '';
        setCurrentUserId(userId);
    }, []);

    // Load messages when channel changes
    useEffect(() => {
        if (activeChannelId) {
            loadMessages();
        }
    }, [activeChannelId, loadMessages]);

    const loadChannels = async () => {
        setLoadingChannels(true);
        try {
            const response = await chatAPI.getChannels();
            if (response.success && response.data) {
                setChannels(response.data.channels);
            }
        } catch (error) {
            console.error('Failed to load channels:', error);
        } finally {
            setLoadingChannels(false);
        }
    };

    const handleSendMessage = async (content: string, fileId?: string) => {
        sendMessage(content, fileId);
    };

    const handleFileUpload = async (file: File): Promise<string> => {
        const response = await fileAPI.uploadFile(file, activeChannelId || undefined);
        if (response.success && response.data) {
            return response.data.id;
        }
        throw new Error('File upload failed');
    };

    const handleEditMessage = async (messageId: string) => {
        const newContent = prompt('Edit message:');
        if (newContent) {
            try {
                await chatAPI.updateMessage(messageId, newContent);
            } catch (error) {
                console.error('Failed to edit message:', error);
                alert('Failed to edit message');
            }
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (confirm('Delete this message?')) {
            try {
                await chatAPI.deleteMessage(messageId);
            } catch (error) {
                console.error('Failed to delete message:', error);
                alert('Failed to delete message');
            }
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Channel Sidebar */}
            <div className="w-80 flex-shrink-0">
                <ChannelSidebar />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
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
                                    {/* Connection status */}
                                    <span
                                        className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-600' : 'text-gray-400'
                                            }`}
                                    >
                                        <span
                                            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-gray-400'
                                                }`}
                                        />
                                        {isConnected ? 'Connected' : 'Connecting...'}
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
                            onTypingStart={startTyping}
                            onTypingStop={stopTyping}
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
