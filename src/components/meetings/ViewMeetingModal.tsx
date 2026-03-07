import React, { useState, useRef, useEffect } from 'react';
import { Meeting, meetingsApi } from '@/lib/api/meetings.api';
import { TaskUpdate } from '@/lib/api/task-updates.api';
import { projectsApi, Sprint } from '@/lib/api/projects.api';
import { toast } from 'sonner';
import JiraStatusBadge from './JiraTaskUpdate/JiraStatusBadge';
import { useJiraApproval } from '@/hooks/useJiraApproval';

interface ViewMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    meeting: Meeting | null;
    onMeetingUpdated?: (meeting: Meeting) => void;
    // Extraction Mode Props
    extractionMode?: boolean;
    tasks?: TaskUpdate[];
    onExtract?: () => void;
    onApprove?: (task: TaskUpdate) => void;
    onReject?: (task: TaskUpdate) => void;
    isExtracting?: boolean;
}

export default function ViewMeetingModal({
    isOpen,
    onClose,
    meeting,
    onMeetingUpdated,
    extractionMode = false,
    tasks = [],
    onExtract,
    onApprove,
    onReject,
    isExtracting = false
}: ViewMeetingModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [transcriptText, setTranscriptText] = useState('');
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'transcript' | 'tasks' | 'sprint-tasks'>(extractionMode ? 'tasks' : 'transcript');
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [loadingSprints, setLoadingSprints] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize Jira Approval Hook
    const { handleApproveWithCheck, isChecking } = useJiraApproval({
        onApprove: async (task) => {
            if (onApprove) {
                await onApprove(task);
            }
        }
    });

    // Reset state when meeting changes
    useEffect(() => {
        if (meeting) {
            setTranscriptText(meeting.transcript_content || '');
            setIsEditing(false);
            setActiveTab(extractionMode ? 'tasks' : 'transcript');
        }
    }, [meeting, extractionMode]);

    // Fetch sprints if tab is sprint-tasks
    useEffect(() => {
        if (activeTab === 'sprint-tasks' && meeting?.project_id) {
            const fetchSprints = async () => {
                setLoadingSprints(true);
                try {
                    // Use active sprints endpoint to get tasks
                    const response = await projectsApi.getActiveSprints(Number(meeting.project_id), meeting.meeting_date);
                    if (response.success) {
                        setSprints(response.data.sprints || []);
                    }
                } catch (error) {
                    console.error('Failed to fetch sprints:', error);
                    toast.error('Failed to load sprints');
                } finally {
                    setLoadingSprints(false);
                }
            };
            fetchSprints();
        }
    }, [activeTab, meeting?.project_id]);

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

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'TODO': 'bg-gray-100 text-gray-700',
            'IN_PROGRESS': 'bg-blue-100 text-blue-700',
            'DONE': 'bg-green-100 text-green-700',
            'BLOCKED': 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const formatTime = (timeValue: string | number | undefined) => {
        if (!timeValue && timeValue !== 0) return 'N/A';

        if (!isNaN(Number(timeValue))) {
            const totalSeconds = Number(timeValue);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            const formattedMinutes = minutes.toString().padStart(2, '0');
            return `${formattedHours}:${formattedMinutes} ${ampm}`;
        }

        if (typeof timeValue === 'string' && timeValue.includes(':')) {
            const [h, m] = timeValue.split(':');
            const hours = parseInt(h, 10);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            return `${formattedHours}:${m} ${ampm}`;
        }

        return String(timeValue);
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
                                {meeting.meeting_date}
                            </span>
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
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
                                    <span className="italic text-gray-400">No description available.</span>
                                </div>
                            </div>

                            {/* Attendees */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Attendees</h3>
                                {Array.isArray(meeting.attendees) && meeting.attendees.length > 0 ? (
                                    <div className="space-y-2">
                                        {meeting.attendees.map((attendee, index) => {
                                            const colors = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700'];
                                            const colorClass = colors[index % colors.length];
                                            const displayName = typeof attendee === 'string' ? attendee :
                                                (attendee && typeof attendee === 'object' ? ((attendee as any).email || (attendee as any).username || (attendee as any).name || String(attendee)) : 'User');
                                            const safeDisplayName = String(displayName);
                                            return (
                                                <div key={index} className="flex items-center gap-3 p-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${colorClass}`}>
                                                        {safeDisplayName.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700 truncate">{safeDisplayName}</span>
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
                                        <dd className="font-medium text-gray-900 mt-1">{meeting.meeting_category || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 text-xs">Status</dt>
                                        <dd className="mt-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase
                                                ${meeting.status === 'SCHEDULED' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                    meeting.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                                                        meeting.status === 'CANCELLED' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                                                {meeting.status}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 text-xs flex justify-between items-center">
                                            <span>Meeting Link</span>
                                            {meeting.meeting_link && (
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(meeting.meeting_link);
                                                        toast.success('Link copied to clipboard');
                                                    }}
                                                    className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded"
                                                    title="Copy Meeting Link"
                                                >
                                                    Copy Link
                                                </button>
                                            )}
                                        </dt>
                                        <dd className="font-medium text-gray-900 mt-1 truncate">
                                            {meeting.meeting_link ? (
                                                <a href={meeting.meeting_link.startsWith('http') ? meeting.meeting_link : `https://${meeting.meeting_link}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    {meeting.meeting_link}
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 italic font-normal">No link available</span>
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 text-xs">Project ID</dt>
                                        <dd className="font-medium text-gray-900 mt-1">{meeting.project_id || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 text-xs">Created By</dt>
                                        <dd className="font-medium text-gray-900 mt-1 break-all" title={meeting.created_by}>{meeting.created_by}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Tabs for Transcript / Tasks */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden">

                        {/* Tab Bar */}
                        <div className="px-6 border-b border-gray-100 flex items-center gap-6 bg-white z-10">
                            {extractionMode && (
                                <button
                                    onClick={() => setActiveTab('tasks')}
                                    className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Tasks & Approvals
                                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                                        {tasks.length}
                                    </span>
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('transcript')}
                                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transcript' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Transcript
                            </button>
                            <button
                                onClick={() => setActiveTab('sprint-tasks')}
                                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sprint-tasks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Sprint Tasks
                            </button>

                            <div className="ml-auto flex items-center gap-2">
                                {/* Extractions Action (Only if in Extraction Mode and Tasks Tab) */}
                                {extractionMode && activeTab === 'tasks' && onExtract && (
                                    <button
                                        onClick={onExtract}
                                        disabled={isExtracting}
                                        className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 px-4 py-1.5 rounded-lg transition-all font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                                    >
                                        {isExtracting ? (
                                            <>
                                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <span>🤖</span> Run AI Extraction
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto bg-gray-50/50">

                            {/* TASKS TAB */}
                            {activeTab === 'tasks' && extractionMode && (
                                <div className="p-6">
                                    {tasks.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="text-2xl">📋</span>
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900">No updates extracted yet</h3>
                                            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                                                Run AI extraction to identify task updates, blockers, and progress from the meeting transcript.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Sort tasks: IN_PROGRESS -> BLOCKED -> TODO -> DONE */}
                                            {tasks.slice().sort((a, b) => {
                                                const priority = { 'IN_PROGRESS': 1, 'BLOCKED': 2, 'TODO': 3, 'DONE': 4 };
                                                const pA = priority[a.detected_status as keyof typeof priority] || 99;
                                                const pB = priority[b.detected_status as keyof typeof priority] || 99;
                                                return pA - pB;
                                            }).map((task) => (
                                                <div key={task.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="text-lg font-bold text-gray-900">{task.ticket_id}</h4>
                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.detected_status)}`}>
                                                                    {task.detected_status}
                                                                </span>
                                                                <JiraStatusBadge ticketId={task.ticket_id} />
                                                            </div>
                                                            <p className="text-gray-600 mt-2 text-sm italic border-l-2 border-gray-300 pl-3">
                                                                "{task.extracted_context}"
                                                            </p>

                                                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                                                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                                                    <span>🤖 Confidence:</span>
                                                                    <span className="font-medium text-gray-700">{(task.ai_confidence_score * 100).toFixed(0)}%</span>
                                                                </span>
                                                                {task.blocker_description && (
                                                                    <span className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100">
                                                                        <span>⚠️ Blocker Detected</span>
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* AI Reasoning Expander (Simplified) */}
                                                            {/* {task.ai_reasoning && !task.ai_reasoning.includes("No explicit status, defaulting to IN_PROGRESS") && (
                                                                <details className="mt-3 text-xs">
                                                                    <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium select-none">Show AI Reasoning</summary>
                                                                    <div className="mt-2 p-3 bg-blue-50/50 rounded-lg text-gray-700 leading-relaxed border border-blue-100">
                                                                        {task.ai_reasoning}
                                                                    </div>
                                                                </details>
                                                            )} */}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                                                        {onApprove && (
                                                            <button
                                                                onClick={() => handleApproveWithCheck(task)}
                                                                disabled={isChecking}
                                                                className={`flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 ${isChecking ? 'opacity-70 cursor-wait' : ''}`}
                                                            >
                                                                {isChecking ? 'Verifying...' : '✓ Approve Update'}
                                                            </button>
                                                        )}
                                                        {onReject && (
                                                            <button
                                                                onClick={() => onReject(task)}
                                                                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TRANSCRIPT TAB */}
                            {activeTab === 'transcript' && (
                                <div className="flex flex-col h-full bg-white">
                                    <div className="p-4 border-b border-gray-100 flex justify-end items-center bg-gray-50/50">
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
                                                        className="text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                                                    >
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
                                                    {meeting.transcript_content && (
                                                        <button
                                                            onClick={() => navigator.clipboard.writeText(meeting.transcript_content || '')}
                                                            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 font-medium flex items-center gap-1"
                                                        >
                                                            Copy
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setIsEditing(true)}
                                                        className="text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                                                    >
                                                        {meeting.transcript_content ? 'Edit Transcript' : 'Add Transcript'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-8">
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
                                                {meeting.transcript_content ? (
                                                    <div className="prose max-w-none prose-slate prose-p:leading-relaxed">
                                                        {meeting.transcript_content.split('\n').map((line, i) => (
                                                            <p key={i} className="mb-4 text-gray-700">
                                                                {line}
                                                            </p>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 group hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setIsEditing(true)}>
                                                        <div className="w-12 h-12 bg-white text-gray-400 group-hover:text-blue-500 rounded-full flex items-center justify-center mb-4 transition-colors shadow-sm">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                            </svg>
                                                        </div>
                                                        <h4 className="text-base font-medium text-gray-900 mb-1">Add Transcript</h4>
                                                        <p className="text-sm text-gray-500 max-w-xs">
                                                            Transcript is required for AI task extraction.
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* SPRINT TASKS TAB */}
                            {activeTab === 'sprint-tasks' && (
                                <div className="p-6">
                                    {loadingSprints ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : sprints.length === 0 ? (
                                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                                            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="text-2xl">🏃</span>
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900">No Sprints Found</h3>
                                            <p className="text-gray-500 mt-2">There are no sprints associated with this project.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {sprints.map((sprint) => (
                                                <div key={sprint.sprint_id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="text-lg font-bold text-gray-900">{sprint.sprint_name}</h4>
                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold 
                                                                    ${sprint.sprint_status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                                        sprint.sprint_status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                                            sprint.sprint_status === 'Closed' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                    {sprint.sprint_status}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                                                                <span className="flex items-center gap-1">
                                                                    📅 {sprint.start_date} - {sprint.end_date}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-medium text-gray-900">Est. Hours</div>
                                                            <div className="text-lg font-bold text-blue-600">{sprint.total_estimated_hours || 0}h</div>
                                                        </div>
                                                    </div>

                                                    {/* Sprint Tasks */}
                                                    <div className="mt-4 border-t border-gray-100 pt-3">
                                                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                                                            <span>Sprint Tasks ({sprint.tasks?.length || 0})</span>
                                                        </h5>
                                                        <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
                                                            {sprint.tasks && sprint.tasks.length > 0 ? (
                                                                sprint.tasks.map((task: any) => (
                                                                    <div key={task.id} className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 transition-all group">
                                                                        <div className="flex justify-between items-center">
                                                                            <div className="flex items-center gap-2">
                                                                                {/* Issue Type */}
                                                                                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${task.issue_type === 'bug'
                                                                                    ? 'bg-red-50 text-red-700 border-red-100'
                                                                                    : 'bg-blue-50 text-blue-700 border-blue-100'
                                                                                    }`}>
                                                                                    {task.issue_type === 'bug' ? '🐞' : '⚡'} {task.issue_type}
                                                                                </span>
                                                                                {/* Ticket ID */}
                                                                                <span className="font-mono text-xs font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                                                                                    {task.id}
                                                                                </span>
                                                                            </div>

                                                                            {/* Status Badge */}
                                                                            {task.is_jira ? (
                                                                                <JiraStatusBadge ticketId={task.id} />
                                                                            ) : (
                                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border ${task.status === 'done' ? 'bg-green-50 text-green-700 border-green-100' :
                                                                                    task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                                                        task.status === 'blocked' ? 'bg-red-50 text-red-700 border-red-100' :
                                                                                            'bg-gray-50 text-gray-600 border-gray-100'
                                                                                    }`}>
                                                                                    {task.status?.replace('_', ' ') || 'Unknown'}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Summary */}
                                                                        <div className="text-sm font-medium text-gray-900 leading-snug pl-1">
                                                                            {task.summary}
                                                                        </div>

                                                                        {/* Footer: Assignee */}
                                                                        <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-50">
                                                                            <div className="flex items-center gap-2 text-xs text-gray-500" title={`Assigned to: ${task.assignee}`}>
                                                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm ring-1 ring-white ${task.assignee ? 'bg-indigo-500' : 'bg-gray-300'
                                                                                    }`}>
                                                                                    {task.assignee ? task.assignee.charAt(0).toUpperCase() : '?'}
                                                                                </div>
                                                                                <span className="truncate max-w-[180px] font-medium text-gray-600">
                                                                                    {task.assignee || 'Unassigned'}
                                                                                </span>
                                                                            </div>

                                                                            {/* Priority Indicator (optional based on user JSON having priority) */}
                                                                            {task.priority && (
                                                                                <span className={`text-[10px] font-semibold px-1.5 rounded ${task.priority === 'high' ? 'text-orange-700 bg-orange-50' :
                                                                                    task.priority === 'critical' ? 'text-red-700 bg-red-50' : 'text-gray-500'
                                                                                    }`}>
                                                                                    {task.priority}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-sm text-gray-400 italic text-center py-4">No tasks assigned to this sprint</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {sprint.sprint_goal && (
                                                        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-sm text-gray-700">
                                                            <span className="font-semibold text-blue-800">🎯 Goal:</span> {sprint.sprint_goal}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
