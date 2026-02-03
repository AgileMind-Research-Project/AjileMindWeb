/**
 * TranscriptMessage Component
 * Displays a single conversation segment with speaker info and messages
 */

import React from 'react';

interface TranscriptMessageProps {
    username: string;
    role?: string;
    timestamp: string;
    messages: string[];
    isCurrentUser?: boolean;
}

export const TranscriptMessage: React.FC<TranscriptMessageProps> = ({
    username,
    role,
    timestamp,
    messages,
    isCurrentUser = false,
}) => {
    // Generate initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Generate color based on username
    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-orange-500',
            'bg-teal-500',
            'bg-cyan-500',
        ];
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    };

    return (
        <div className={`flex gap-3 mb-4 ${isCurrentUser ? 'opacity-90' : ''}`}>
            {/* Avatar */}
            <div className="flex-shrink-0">
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(username)}`}
                >
                    {getInitials(username)}
                </div>
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
                {/* Header: Name, Role, Time */}
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {username}
                    </span>
                    {role && role !== 'Participant' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {role}
                        </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {timestamp}
                    </span>
                </div>

                {/* Messages */}
                <div className="space-y-1">
                    {messages.map((message, idx) => (
                        <div
                            key={idx}
                            className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                        >
                            {message}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
