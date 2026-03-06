'use client';

/**
 * ScheduledMeetingsList
 *
 * Table of scheduled meetings for a project with delete support.
 */

import React from 'react';
import { ScheduledMeeting, scheduledMeetingAPI } from '@/lib/api/scheduledMeetingAPI';

interface Props {
    meetings: ScheduledMeeting[];
    loading?: boolean;
    currentUserEmail?: string;
    onDeleted: (meetingId: string) => void;
    onSchedule: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
    'Daily Standup': 'bg-sky-100 text-sky-700 border-sky-200',
    'Sprint Planning': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Sprint Review': 'bg-violet-100 text-violet-700 border-violet-200',
    'Sprint Retrospective': 'bg-pink-100 text-pink-700 border-pink-200',
    'Backlog Refinement / Grooming': 'bg-amber-100 text-amber-700 border-amber-200',
    'Release Planning': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Stakeholder Review': 'bg-teal-100 text-teal-700 border-teal-200',
    'Technical Design Meeting': 'bg-blue-100 text-blue-700 border-blue-200',
    'Incident / Post-Mortem': 'bg-red-100 text-red-700 border-red-200',
    'One-on-One': 'bg-orange-100 text-orange-700 border-orange-200',
    'Other': 'bg-gray-100 text-gray-700 border-gray-200',
};

const STATUS_COLORS: Record<string, string> = {
    SCHEDULED: 'bg-blue-50 text-blue-700',
    ONGOING: 'bg-green-50 text-green-700',
    COMPLETED: 'bg-gray-100 text-gray-500',
    CANCELLED: 'bg-red-50 text-red-600',
};

function formatTime(t: string): string {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
}

function formatDate(d: string): string {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
}

export function ScheduledMeetingsList({
    meetings,
    loading,
    currentUserEmail,
    onDeleted,
    onSchedule,
}: Props) {
    const [deleting, setDeleting] = React.useState<string | null>(null);

    const handleDelete = async (meetingId: string) => {
        if (!confirm('Delete this meeting?')) return;
        setDeleting(meetingId);
        try {
            await scheduledMeetingAPI.delete(meetingId);
            onDeleted(meetingId);
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <svg className="w-8 h-8 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm">Loading meetings…</span>
            </div>
        );
    }

    if (meetings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <p className="text-base font-medium text-gray-600 mb-1">No meetings scheduled</p>
                <p className="text-sm text-gray-400 mb-5">Plan your next Scrum ceremony</p>
                <button
                    onClick={onSchedule}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition"
                >
                    + Schedule Meeting
                </button>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Title</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Category</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Time</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Link</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {meetings.map((m) => {
                        const catClass = CATEGORY_COLORS[m.meeting_category] ?? 'bg-gray-100 text-gray-700 border-gray-200';
                        const statusClass = STATUS_COLORS[m.status] ?? 'bg-gray-100 text-gray-500';
                        const canDelete = !currentUserEmail || m.created_by === currentUserEmail;

                        return (
                            <tr key={m.meeting_id} className="hover:bg-gray-50/60 transition-colors">
                                {/* Title */}
                                <td className="px-4 py-3 font-medium text-gray-800 max-w-xs">
                                    <span className="block truncate">{m.title}</span>
                                    {m.created_by && (
                                        <span className="text-xs text-gray-400">{m.created_by}</span>
                                    )}
                                </td>

                                {/* Category */}
                                <td className="px-4 py-3">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${catClass}`}>
                                        {m.meeting_category}
                                    </span>
                                </td>

                                {/* Date */}
                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                    {formatDate(m.meeting_date)}
                                </td>

                                {/* Time */}
                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                    {formatTime(m.start_time)} – {formatTime(m.end_time)}
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusClass}`}>
                                        {m.status}
                                    </span>
                                </td>

                                {/* Link */}
                                <td className="px-4 py-3">
                                    <a
                                        href={m.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition text-xs"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Join
                                    </a>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3 text-right">
                                    {canDelete && (
                                        <button
                                            disabled={deleting === m.meeting_id}
                                            onClick={() => handleDelete(m.meeting_id)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                                            title="Delete meeting"
                                        >
                                            {deleting === m.meeting_id ? (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            )}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
