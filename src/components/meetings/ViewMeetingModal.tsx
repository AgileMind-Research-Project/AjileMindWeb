import React, { useState, useRef, useEffect } from 'react';
import { Meeting, meetingsApi } from '@/lib/api/meetings.api';
import { toast } from 'sonner';

interface ViewMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    meeting: Meeting | null;
    onMeetingUpdated?: (meeting: Meeting) => void;
}

export default function ViewMeetingModal({ isOpen, onClose, meeting, onMeetingUpdated }: ViewMeetingModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [transcriptText, setTranscriptText] = useState('');
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when meeting changes
    useEffect(() => {
        if (meeting) {
            setTranscriptText(meeting.meeting_transcript || '');
            setIsEditing(false);
        }
    }, [meeting]);

    if (!isOpen || !meeting) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setTranscriptText(text);
            toast.success('Transcript loaded from file');
        };
        reader.onerror = () => {
            toast.error('Failed to read file');
        };
        reader.readAsText(file);
    };

    const handleSaveTranscript = async () => {
        setSaving(true);
        try {
            const updatedMeeting = await meetingsApi.updateMeeting(meeting.meeting_id, {
                meeting_transcript: transcriptText
            });
            toast.success('Transcript saved successfully');
            setIsEditing(false);
            if (onMeetingUpdated) {
                onMeetingUpdated(updatedMeeting);
            }
        } catch (error) {
            console.error('Failed to save transcript:', error);
            toast.error('Failed to save transcript');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden flex items-center justify-center p-4">
            {/* Backdrop with blur and transparency */}
            <div className="fixed inset-0 bg-white/40 backdrop-blur-md transition-opacity" onClick={onClose} />

            {/* Modal Container - Maximize Size */}
            <div className="relative z-20 w-[95vw] h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200 flex flex-col">

                {/* Header */}
                <div className="border-b border-gray-100 bg-gray-50/50 px-8 py-5 flex justify-between items-center shrink-0">
                    <div>
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight truncate max-w-2xl">{meeting.title}</h2>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                ${meeting.status === 'SCHEDULED' ? 'bg-green-100 text-green-700' :
                                    meeting.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                                        meeting.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                {meeting.status}
                            </span>
                        </div>
                        <div className="mt-1 flex items-center gap-6 text-sm text-gray-500">
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {meeting.date}
                            </span>
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {meeting.start_time} - {meeting.end_time}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Main Content Split View */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Left Panel: Description, Attendees, Metadata */}
                    <div className="w-1/3 border-r border-gray-100 bg-gray-50/30 flex flex-col overflow-y-auto">
                        <div className="p-8 space-y-8">

                            {/* Description */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Description</h3>
                                <div className="prose prose-sm max-w-none text-gray-700 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                    {meeting.description || <span className="italic text-gray-400">No description provided.</span>}
                                </div>
                            </div>

                            {/* Attendees */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Attendees</h3>
                                {meeting.attendees && meeting.attendees.length > 0 ? (
                                    <div className="space-y-2">
                                        {meeting.attendees.map((attendee, index) => {
                                            const colors = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700'];
                                            const colorClass = colors[index % colors.length];
                                            return (
                                                <div key={index} className="flex items-center gap-3 p-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${colorClass}`}>
                                                        {attendee.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700 truncate">{attendee}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-400 italic bg-white border border-gray-100 p-4 rounded-lg">No attendees listed.</div>
                                )}
                            </div>

                            {/* Metadata */}
                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Details</h3>
                                <dl className="grid grid-cols-1 gap-4 text-sm">
                                    <div>
                                        <dt className="text-gray-500 text-xs">Category</dt>
                                        <dd className="font-medium text-gray-900 mt-1">{meeting.category}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 text-xs">Project ID</dt>
                                        <dd className="font-medium text-gray-900 mt-1">{meeting.project_id || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 text-xs">Created By</dt>
                                        <dd className="font-medium text-gray-900 mt-1">{meeting.created_by}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Transcript (Main Focus) */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                            <h3 className="text-lg font-bold text-gray-900">Transcript</h3>

                            <div className="flex items-center gap-2">
                                {isEditing ? (
                                    <>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept=".txt,.json"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            Upload
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveTranscript}
                                            disabled={saving}
                                            className="text-sm bg-blue-600 text-white hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1 shadow-sm disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : 'Save Transcript'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {meeting.meeting_transcript && (
                                            <button
                                                onClick={() => navigator.clipboard.writeText(meeting.meeting_transcript || '')}
                                                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 font-medium flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                Copy
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            {meeting.meeting_transcript ? 'Edit' : 'Add Transcript'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                            {isEditing ? (
                                <textarea
                                    value={transcriptText}
                                    onChange={(e) => setTranscriptText(e.target.value)}
                                    className="w-full h-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm leading-relaxed"
                                    placeholder="Paste transcript text here or upload a file..."
                                    autoFocus
                                />
                            ) : (
                                <>
                                    {meeting.meeting_transcript ? (
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-full">
                                            <div className="prose max-w-none prose-slate prose-p:leading-relaxed">
                                                {meeting.meeting_transcript.split('\n').map((line, i) => (
                                                    <p key={i} className="mb-4 text-gray-700">
                                                        {line}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-white group hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setIsEditing(true)}>
                                            <div className="w-16 h-16 bg-gray-50 group-hover:bg-blue-50 rounded-full flex items-center justify-center mb-4 transition-colors">
                                                <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                            </div>
                                            <h4 className="text-lg font-medium text-gray-900 mb-1">Add Transcript</h4>
                                            <p className="text-gray-500 max-w-sm mb-4">
                                                Upload or paste the meeting transcript here.
                                            </p>
                                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                                                Add Transcript
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
