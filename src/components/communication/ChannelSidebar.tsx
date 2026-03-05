/**
 * ChannelSidebar Component
 * 
 * Displays list of channels with unread indicators, search, and team grouping
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore, Channel } from '@/lib/store/chatStore';
import { Avatar } from './Avatar';

interface ChannelSidebarProps {
    onCreateChannel?: () => void;
    onBack?: () => void;
}

export function ChannelSidebar({ onCreateChannel, onBack }: ChannelSidebarProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const channels = useChatStore((state) => state.channels);
    const activeChannelId = useChatStore((state) => state.activeChannelId);
    const setActiveChannelId = useChatStore((state) => state.setActiveChannelId);

    const filteredChannels = channels.filter((channel) =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group channels by team/project
    const groupedChannels = useMemo(() => {
        const groups: Record<string, { channels: Channel[], isProject: boolean }> = {};

        filteredChannels.forEach((channel) => {
            const teamKey = channel.team_name || 'General';
            if (!groups[teamKey]) {
                groups[teamKey] = { channels: [], isProject: !!channel.team_id };
            }
            groups[teamKey].channels.push(channel);
        });

        return groups;
    }, [filteredChannels]);

    const handleChannelClick = (channelId: string) => {
        setActiveChannelId(channelId);
    };

    const getChannelIcon = (type: Channel['type'], isProject?: boolean) => {
        if (isProject) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
            );
        }
        switch (type) {
            case 'dm':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                );
            case 'group':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                );
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
            {/* Header */}
            <div className="border-b border-gray-200">
                {/* Back Button Row */}
                <div className="px-3 pt-3 pb-2">
                    <button
                        onClick={() => onBack ? onBack() : router.push('/dashboard')}
                        className="group flex items-center gap-2 px-3 py-2 w-full rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                        title="Back to main menu"
                    >
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors duration-200">
                            <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </span>
                        <span className="text-sm font-medium">Back to Dashboard</span>
                    </button>
                </div>

                <div className="px-4 pb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Channels</h2>
                        {onCreateChannel && (
                            <button
                                onClick={onCreateChannel}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Create channel"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search channels..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <svg
                            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Channel List with Team Grouping */}
            <div className="flex-1 overflow-y-auto">
                {Object.keys(groupedChannels).length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        <p className="text-sm">No channels found</p>
                        {onCreateChannel && (
                            <button
                                onClick={onCreateChannel}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Create your first channel
                            </button>
                        )}
                    </div>
                ) : (
                    <div>
                        {Object.entries(groupedChannels).map(([teamName, group], index) => (
                            <div key={teamName}>
                                {/* Team / Project Label */}
                                <div className={`px-4 py-3 border-b ${group.isProject
                                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'
                                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
                                    }`}>
                                    <div className="flex items-center gap-2">
                                        {group.isProject ? (
                                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        )}
                                        <h3 className={`text-sm font-bold uppercase tracking-wide ${group.isProject ? 'text-indigo-900' : 'text-blue-900'
                                            }`}>
                                            {teamName}
                                        </h3>
                                        {group.isProject && (
                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded uppercase tracking-wider">Project</span>
                                        )}
                                        <span className={`ml-auto px-2 py-0.5 text-xs font-medium rounded-full ${group.isProject ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {group.channels.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Channels in this group */}
                                <ul>
                                    {group.channels.map((channel) => (
                                        <li key={channel.id}>
                                            <button
                                                onClick={() => handleChannelClick(channel.id)}
                                                className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${activeChannelId === channel.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                                                    }`}
                                            >
                                                <div className={channel.team_id ? 'text-indigo-500' : 'text-gray-600'}>
                                                    {getChannelIcon(channel.type, !!channel.team_id)}
                                                </div>

                                                <div className="flex-1 text-left">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-gray-900">{channel.name}</span>
                                                        {channel.unread_count && channel.unread_count > 0 && (
                                                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                                                                {channel.unread_count > 99 ? '99+' : channel.unread_count}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {channel.description && (
                                                        <p className="text-xs text-gray-500 truncate">{channel.description}</p>
                                                    )}
                                                </div>

                                                {channel.is_private && (
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                {/* Separator between groups (not after last group) */}
                                {index < Object.keys(groupedChannels).length - 1 && (
                                    <div className="border-b-2 border-gray-200 my-1" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
