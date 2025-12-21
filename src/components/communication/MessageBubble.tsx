/**
 * MessageBubble Component
 * 
 * Displays a single chat message with sender info, timestamp, and attachments
 */

'use client';

import React from 'react';
import { Message } from '@/lib/store/chatStore';
import { Avatar } from './Avatar';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    showAvatar?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function MessageBubble({
    message,
    isOwn,
    showAvatar = true,
    onEdit,
    onDelete,
}: MessageBubbleProps) {
    const [showActions, setShowActions] = React.useState(false);

    const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });

    return (
        <div
            className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'} group`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {showAvatar && !isOwn && (
                <Avatar
                    userId={message.sender_id}
                    name={message.sender_full_name}
                    email={message.sender_email}
                    size="sm"
                />
            )}

            <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                {!isOwn && message.sender_full_name && (
                    <span className="text-xs font-medium text-gray-700 mb-1">
                        {message.sender_full_name}
                    </span>
                )}

                <div
                    className={`relative rounded-2xl px-4 py-2 ${isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                >
                    {message.is_deleted ? (
                        <span className="italic text-gray-500">Message deleted</span>
                    ) : (
                        <>
                            {message.type === 'file' && message.file_name && (
                                <div className="mb-2 flex items-center gap-2 p-2 bg-white/10 rounded">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-sm font-medium">{message.file_name}</span>
                                </div>
                            )}

                            <p className="whitespace-pre-wrap break-words">{message.content}</p>

                            {message.is_edited && (
                                <span className="text-xs opacity-70 ml-2">(edited)</span>
                            )}
                        </>
                    )}
                </div>

                <span className="text-xs text-gray-500 mt-1">{timeAgo}</span>
            </div>

            {showActions && isOwn && !message.is_deleted && (
                <div className="flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Edit message"
                        >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Delete message"
                        >
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
