/**
 * MessageList Component
 * 
 * Displays list of messages with scroll handling and typing indicators
 */

'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { useChatStore } from '@/lib/store/chatStore';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
    channelId: string;
    currentUserId: string;
    onEdit?: (messageId: string) => void;
    onDelete?: (messageId: string) => void;
    onLoadMore?: () => void;
}

export function MessageList({
    channelId,
    currentUserId,
    onEdit,
    onDelete,
    onLoadMore,
}: MessageListProps) {
    const messagesRecord = useChatStore((state) => state.messages);
    const typingUsersRecord = useChatStore((state) => state.typingUsers);

    const messages = useMemo(() => messagesRecord[channelId] || [], [messagesRecord, channelId]);
    const typingUsers = useMemo(() => typingUsersRecord[channelId] || [], [typingUsersRecord, channelId]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleScroll = () => {
        if (containerRef.current) {
            const { scrollTop } = containerRef.current;
            if (scrollTop === 0 && onLoadMore) {
                onLoadMore();
            }
        }
    };

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>No messages yet</p>
                    <p className="text-sm mt-2">Start the conversation!</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
            onScroll={handleScroll}
        >
            {messages.map((message, index) => {
                const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                const isOwn = message.sender_id === currentUserId;

                return (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        onEdit={isOwn && onEdit ? () => onEdit(message.id) : undefined}
                        onDelete={isOwn && onDelete ? () => onDelete(message.id) : undefined}
                    />
                );
            })}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>
                        {typingUsers.length === 1
                            ? '1 person is typing...'
                            : `${typingUsers.length} people are typing...`}
                    </span>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
}
