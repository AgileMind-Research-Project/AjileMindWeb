/**
 * Avatar Component
 * 
 * Displays user avatar with online status indicator
 */

'use client';

import React from 'react';
import { usePresenceStore } from '@/lib/store/presenceStore';

interface AvatarProps {
    userId?: string;
    name?: string;
    email?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    showOnline?: boolean;
    className?: string;
}

const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl',
};

const onlineIndicatorSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
};

export function Avatar({
    userId,
    name,
    email,
    size = 'md',
    showOnline = true,
    className = '',
}: AvatarProps) {
    const getUserPresence = usePresenceStore((state) => state.getUserPresence);
    const presence = userId ? getUserPresence(userId) : null;

    const displayName = name || email || 'User';
    const initials = displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const statusColors = {
        online: 'bg-green-500',
        away: 'bg-yellow-500',
        busy: 'bg-red-500',
        dnd: 'bg-red-600',
        offline: 'bg-gray-400',
    };

    const bgColors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-red-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
    ];

    const colorIndex = displayName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % bgColors.length;
    const bgColor = bgColors[colorIndex];

    return (
        <div className={`relative inline-block ${className}`}>
            <div
                className={`${sizeClasses[size]} rounded-full ${bgColor} flex items-center justify-center text-white font-semibold`}
            >
                {initials}
            </div>

            {showOnline && presence && presence.status !== 'offline' && (
                <span
                    className={`absolute bottom-0 right-0 block ${onlineIndicatorSizes[size]} rounded-full ${statusColors[presence.status]
                        } ring-2 ring-white`}
                />
            )}
        </div>
    );
}
