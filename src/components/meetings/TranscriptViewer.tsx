/**
 * TranscriptViewer Component
 * Displays meeting transcripts in Microsoft Teams style
 * Supports both live (during meeting) and historical transcripts
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { TranscriptMessage } from './TranscriptMessage';

interface TranscriptSegment {
    user_id: string;
    username: string;
    role?: string;
    timestamp: string;
    messages: string[];
    type?: string;
}

interface TranscriptViewerProps {
    segments: TranscriptSegment[];
    currentUserId?: string;
    isLive?: boolean;
    onExport?: (format: 'txt' | 'json') => void;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
    segments,
    currentUserId,
    isLive = false,
    onExport,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = React.useState(true);

    // Auto-scroll to bottom when new messages arrive (in live mode)
    useEffect(() => {
        if (isLive && autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [segments, isLive, autoScroll]);

    // Detect if user scrolled up
    const handleScroll = () => {
        if (!scrollRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;

        setAutoScroll(isAtBottom);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Transcript
                    </h3>
                    {isLive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <span className="w-2 h-2 bg-red-600 rounded-full mr-1 animate-pulse"></span>
                            Live
                        </span>
                    )}
                </div>

                {/* Export Options */}
                {onExport && segments.length > 0 && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onExport('txt')}
                            className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            title="Export as Text"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onExport('json')}
                            className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            title="Export as JSON"
                        >
                            JSON
                        </button>
                    </div>
                )}
            </div>

            {/* Transcript Content */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
            >
                {segments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                        <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm font-medium">No transcript yet</p>
                        <p className="text-xs mt-1">
                            {isLive ? 'Messages will appear here as participants speak' : 'This meeting has no transcript'}
                        </p>
                    </div>
                ) : (
                    <>
                        {segments.map((segment, idx) => (
                            <TranscriptMessage
                                key={idx}
                                username={segment.username}
                                role={segment.role}
                                timestamp={segment.timestamp}
                                messages={segment.messages}
                                isCurrentUser={segment.user_id === currentUserId}
                            />
                        ))}
                    </>
                )}
            </div>

            {/* Auto-scroll indicator */}
            {isLive && !autoScroll && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <button
                        onClick={() => {
                            setAutoScroll(true);
                            if (scrollRef.current) {
                                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                            }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        New messages
                    </button>
                </div>
            )}
        </div>
    );
};
