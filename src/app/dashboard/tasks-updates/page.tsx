'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { meetingsApi, Meeting } from '@/lib/api/meetings.api';
import { taskUpdatesApi, TaskUpdate } from '@/lib/api/task-updates.api';
import ViewMeetingModal from '@/components/meetings/ViewMeetingModal';
import { toast } from 'sonner';

export default function TaskUpdatesPage() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [pendingUpdates, setPendingUpdates] = useState<TaskUpdate[]>([]);
    const [extracting, setExtracting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedUpdate, setSelectedUpdate] = useState<TaskUpdate | null>(null);
    const [viewingMeeting, setViewingMeeting] = useState<Meeting | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [meetingsData, pendingData] = await Promise.all([
                meetingsApi.listMeetings(),
                taskUpdatesApi.listPendingApprovals()
            ]);
            // Filter: Show only meetings that are currently IN_PROGRESS
            const relevantMeetings = meetingsData.filter(m => m.status === 'IN_PROGRESS');
            setMeetings(relevantMeetings);
            setPendingUpdates(pendingData);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleExtract = async (meeting: Meeting) => {
        setExtracting(true);
        setSelectedMeeting(meeting);

        // Simulate thinking phase
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const result = await taskUpdatesApi.extractFromMeeting(meeting.meeting_id, true);
            toast.success(`✓ Extracted ${result.total_extracted} task updates in ${result.processing_time_ms.toFixed(0)}ms`);
            loadData();
        } catch (error: any) {
            console.error('Extraction failed:', error);
            toast.error(error.response?.data?.detail || 'Extraction failed');
        } finally {
            setExtracting(false);
            setSelectedMeeting(null);
        }
    };

    const handleApprove = async (update: TaskUpdate) => {
        try {
            await taskUpdatesApi.approveUpdate(update.id);
            toast.success(`Approved ${update.ticket_id}`);
            loadData();
            setSelectedUpdate(null);
        } catch (error) {
            toast.error('Failed to approve');
        }
    };

    const handleReject = async (update: TaskUpdate, remark?: string) => {
        try {
            await taskUpdatesApi.rejectUpdate(update.id, remark);
            toast.success(`Rejected ${update.ticket_id}`);
            loadData();
            setSelectedUpdate(null);
        } catch (error) {
            toast.error('Failed to reject');
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'TODO': 'bg-gray-100 text-gray-700',
            'IN_PROGRESS': 'bg-blue-100 text-blue-700',
            'DONE': 'bg-green-100 text-green-700',
            'BLOCKED': 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getParticipantCount = (meeting: Meeting) => {
        if (Array.isArray(meeting.attendees)) return meeting.attendees.length;
        return 0;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">AI Task Updates</h1>
                    <p className="text-gray-600 mt-2">Extract and approve task status updates from meeting transcripts using AI. Select a meeting to begin.</p>
                </div>

                {/* Main Content: Full Width Meeting List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-gray-900">Started Meetings</h2>
                            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-0.5 rounded-full font-medium">{meetings.length}</span>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {meetings.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl">📅</span>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">No started meetings found</h3>
                                <p className="text-gray-500 mt-2">Start a meeting from the Calendar to see it here.</p>
                            </div>
                        ) : (
                            meetings.map((meeting) => {
                                const meetingUpdates = pendingUpdates.filter(u => u.meeting_id === meeting.meeting_id);
                                return (
                                    <div
                                        key={meeting.meeting_id}
                                        onClick={() => setViewingMeeting(meeting)}
                                        className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </div>

                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold 
                                                ${meeting.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                                    meeting.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {meeting.status}
                                            </span>
                                            {meetingUpdates.length > 0 && (
                                                <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                                    {meetingUpdates.length} Updates
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{meeting.title}</h3>

                                        <div className="space-y-2 text-sm text-gray-500 flex-1">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {meeting.date} • {meeting.start_time}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                                {getParticipantCount(meeting)} Participants
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-gray-100">
                                            <button
                                                className="w-full bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                            >
                                                <span>View & Extract Updates</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Global Extraction Progress Modal */}
                {extracting && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="text-center">
                                <div className="mb-6">
                                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                                        <span className="text-4xl">🧠</span>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Task Extraction</h3>
                                <p className="text-gray-600 mb-6 font-medium">Analyzing meeting data...</p>

                                <div className="space-y-4 text-left">
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping"></div>
                                        <span className="text-sm font-medium text-blue-900">Thinking & Analyzing Context...</span>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                                        <div className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
                                        <span className="text-sm font-medium text-purple-900">Identifying Task Updates...</span>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                        <div className="w-2.5 h-2.5 bg-green-600 rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
                                        <span className="text-sm font-medium text-green-900">Structuring Data for Approval...</span>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 animate-progress origin-left"></div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Powered by Mistral-7B</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enhanced Meeting Details Modal */}
                <ViewMeetingModal
                    isOpen={!!viewingMeeting}
                    onClose={() => {
                        if (!extracting) setViewingMeeting(null);
                    }}
                    meeting={viewingMeeting}
                    onMeetingUpdated={(updated) => {
                        setMeetings(prev => prev.map(m => m.meeting_id === updated.meeting_id ? updated : m));
                        setViewingMeeting(updated);
                    }}
                    // Extraction Features
                    extractionMode={true}
                    tasks={viewingMeeting ? pendingUpdates.filter(u => u.meeting_id === viewingMeeting.meeting_id) : []}
                    onExtract={() => viewingMeeting && handleExtract(viewingMeeting)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isExtracting={extracting}
                />
            </div>
        </DashboardLayout>
    );
}
