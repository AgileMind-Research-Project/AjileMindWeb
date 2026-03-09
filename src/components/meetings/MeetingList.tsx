import React from 'react';
import { Meeting } from '@/lib/api/meetings.api';

interface MeetingListProps {
    meetings: Meeting[];
    onStart: (meeting: Meeting) => void;
    onEdit: (meeting: Meeting) => void;
    onDelete: (meeting: Meeting) => void;
    onView: (meeting: Meeting) => void;
}

export default function MeetingList({ meetings, onStart, onEdit, onDelete, onView }: MeetingListProps) {
    if (meetings.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">No meetings found</h3>
                <p className="text-gray-500 mt-1">Schedule a new meeting to get started.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-200">
            {meetings.map((meeting) => (
                <div
                    key={meeting.meeting_id}
                    onClick={() => onView(meeting)}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            {/* Date Box */}
                            <div className="flex-shrink-0 w-16 h-16 bg-blue-50 rounded-lg flex flex-col items-center justify-center text-blue-700 border border-blue-100">
                                <span className="text-xs font-semibold uppercase">{new Date(meeting.meeting_date).toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-xl font-bold">{new Date(meeting.meeting_date).getDate()}</span>
                            </div>

                            {/* Meeting Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                                <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {meeting.start_time} - {meeting.end_time}
                                    </div>
                                    {/* Category Badge */}
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {meeting.meeting_category}
                                    </span>
                                    {/* Status Badge */}
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${meeting.status === 'SCHEDULED' ? 'bg-green-100 text-green-800' :
                                            meeting.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                                                meeting.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {meeting.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                            {meeting.status === 'SCHEDULED' && (
                                <button
                                    onClick={() => onStart(meeting)}
                                    className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Start Now
                                </button>
                            )}

                            <button
                                onClick={() => onEdit(meeting)}
                                className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Edit"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>

                            <button
                                onClick={() => onDelete(meeting)}
                                className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
