'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_CONFIG } from '@/lib/config/api.config';

interface Project {
    project_id: number;
    project_name: string;
}

interface Sprint {
    sprint_id: number;
    sprint_name: string;
    sprint_status: string;
}

interface Meeting {
    meeting_id: string;
    title: string;
    meeting_category: string;
    meeting_date: string;
    start_time: string;
}

interface Transcript {
    meeting_id: string;
    transcript_content: string;
    title: string;
}

const MEETING_CATEGORIES = [
    { id: 'Sprint Planning', label: 'Sprint Planning', icon: '📋' },
    { id: 'Sprint Review', label: 'Sprint Review', icon: '👁️' },
    { id: 'Technical Design Meeting', label: 'Brainstorming', icon: '💡' },
    { id: 'Sprint Retrospective', label: 'Retro Meeting', icon: '♻️' },
    { id: 'Daily Standup', label: 'Daily Scrum', icon: '⏱️' },
];

export default function ProjectEventBoard() {
    const searchParams = useSearchParams();
    const initialProjectId = searchParams ? searchParams.get('project_id') : null;

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
        initialProjectId ? parseInt(initialProjectId) : null
    );
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Filter sprints based on category
    const visibleSprints = React.useMemo(() => {
        if (selectedCategory === 'Sprint Planning') {
            return sprints.filter(s => s.sprint_status.toLowerCase() === 'future');
        }
        return sprints;
    }, [sprints, selectedCategory]);

    // Handle category change to auto-select valid sprint
    useEffect(() => {
        if (selectedCategory === 'Sprint Planning') {
            const firstFuture = sprints.find(s => s.sprint_status.toLowerCase() === 'future');
            if (firstFuture) {
                setSelectedSprintId(firstFuture.sprint_id);
            }
        }
    }, [selectedCategory, sprints]);

    const fetchWithAuth = useCallback(async (url: string, options: any = {}) => {
        const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
            },
        });
    }, []);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetchWithAuth(`${API_CONFIG.baseURL}/api/v1/projects/`);
                const data = await res.json();
                setProjects(data.data || []);
            } catch (err) {
                console.error('Failed to fetch projects', err);
            }
        };
        fetchProjects();
    }, [fetchWithAuth]);

    useEffect(() => {
        if (selectedProjectId) {
            const fetchSprints = async () => {
                try {
                    const res = await fetchWithAuth(`${API_CONFIG.baseURL}/api/v1/projects/${selectedProjectId}/sprints`);
                    const data = await res.json();
                    const sprintList = data.data?.sprints || [];
                    setSprints(sprintList);

                    // Default to first 'Future' sprint if available
                    const futureSprint = sprintList.find((s: Sprint) => s.sprint_status.toLowerCase() === 'future');
                    if (futureSprint) {
                        setSelectedSprintId(futureSprint.sprint_id);
                    } else if (sprintList.length > 0) {
                        setSelectedSprintId(sprintList[0].sprint_id);
                    }
                } catch (err) {
                    console.error('Failed to fetch sprints', err);
                }
            };
            fetchSprints();
        }
    }, [selectedProjectId, fetchWithAuth]);

    useEffect(() => {
        if (selectedProjectId && selectedSprintId && selectedCategory) {
            const fetchMeetings = async () => {
                setIsLoading(true);
                setMeetings([]);
                setSelectedMeetingId(null);
                setTranscript(null);

                try {
                    const res = await fetchWithAuth(`${API_CONFIG.baseURL}/api/v1/scheduled-meetings/sprint/${selectedProjectId}/${selectedSprintId}`);
                    const data = await res.json();

                    const filtered = (data.data?.meetings || []).filter(
                        (m: Meeting) => m.meeting_category === selectedCategory
                    );

                    setMeetings(filtered);
                    if (filtered.length > 0) {
                        setSelectedMeetingId(filtered[0].meeting_id);
                    } else {
                        setSelectedMeetingId(null);
                        setTranscript(null);
                    }
                } catch (err) {
                    console.error('Failed to fetch meetings', err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMeetings();
        }
    }, [selectedProjectId, selectedSprintId, selectedCategory, fetchWithAuth]);

    useEffect(() => {
        if (selectedMeetingId) {
            const fetchTranscript = async () => {
                setTranscript(null);
                setEditedContent('');
                try {
                    const res = await fetchWithAuth(`${API_CONFIG.baseURL}/api/v1/meetings/${selectedMeetingId}/transcripts`);
                    if (res.ok) {
                        const data = await res.json();
                        setTranscript(data.data);
                        setEditedContent(data.data.content || '');
                    }
                } catch (err) {
                    console.error('Failed to fetch transcript', err);
                }
            };
            fetchTranscript();
        } else {
            setTranscript(null);
            setEditedContent('');
        }
    }, [selectedMeetingId, fetchWithAuth]);

    const handleUpdateTranscript = async () => {
        if (!selectedMeetingId) return;
        try {
            const res = await fetchWithAuth(`${API_CONFIG.baseURL}/api/v1/meetings/${selectedMeetingId}/transcripts`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editedContent }),
            });
            if (res.ok) {
                const data = await res.json();
                setTranscript(data.data);
                setIsEditing(false);
                alert('Transcript updated successfully!');
            }
        } catch (err) {
            console.error('Failed to update transcript', err);
            alert('Failed to update transcript');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header & Project Selector */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Project Events</h1>
                    <p className="text-gray-500 text-sm">Review and edit meeting transcripts for your team ceremonies.</p>
                </div>
                <div className="w-full md:w-64">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Selected Project</label>
                    <select
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={selectedProjectId || ''}
                        onChange={(e) => setSelectedProjectId(parseInt(e.target.value))}
                    >
                        <option value="">Select a project</option>
                        {projects.map(p => (
                            <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedProjectId ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500">Please select a project to view events</p>
                </div>
            ) : (
                <>
                    {/* Main Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {MEETING_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex flex-col items-center justify-center p-8 rounded-2xl transition-all h-48 border-2 group
                  ${selectedCategory === cat.id
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105'
                                        : 'bg-white border-gray-100 text-gray-700 hover:border-blue-400 hover:shadow-md'}`}
                            >
                                <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">{cat.icon}</span>
                                <span className="font-bold text-center leading-tight">{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Detailed View Section */}
                    {selectedCategory && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
                            <div className="p-6 bg-gray-50 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="min-w-[200px]">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sprint</label>
                                        <select
                                            className="w-full p-2 bg-white border border-gray-200 rounded shadow-sm outline-none"
                                            value={selectedSprintId || ''}
                                            onChange={(e) => setSelectedSprintId(parseInt(e.target.value))}
                                        >
                                            {visibleSprints.map(s => (
                                                <option key={s.sprint_id} value={s.sprint_id}>{s.sprint_name} ({s.sprint_status})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {meetings.length > 0 && (
                                        <div className="min-w-[200px]">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Meeting Date</label>
                                            <select
                                                className="w-full p-2 bg-white border border-gray-200 rounded shadow-sm outline-none"
                                                value={selectedMeetingId || ''}
                                                onChange={(e) => setSelectedMeetingId(e.target.value)}
                                            >
                                                {meetings.map(m => (
                                                    <option key={m.meeting_id} value={m.meeting_id}>
                                                        {m.title} ({new Date(m.meeting_date).toLocaleDateString()})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) || <p className="text-sm italic text-gray-400 mt-5">No meetings found for this sprint/category</p>}
                                </div>

                                <h2 className="text-xl font-bold text-blue-600 capitalize">
                                    {MEETING_CATEGORIES.find(c => c.id === selectedCategory)?.label}
                                </h2>
                            </div>

                            <div className="p-8">
                                {isLoading ? (
                                    <div className="flex justify-center items-center h-64">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : transcript ? (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-bold text-gray-800">Transcript for: {transcript.title}</h3>
                                            <button
                                                onClick={() => {
                                                    if (isEditing) handleUpdateTranscript();
                                                    else setIsEditing(true);
                                                }}
                                                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2
                          ${isEditing
                                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                            >
                                                {isEditing ? (
                                                    <>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Save Changes
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit Transcript
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <div className="relative group">
                                            {isEditing ? (
                                                <textarea
                                                    className="w-full h-96 p-6 border-2 border-blue-400 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none font-mono text-sm leading-relaxed"
                                                    value={editedContent}
                                                    onChange={(e) => setEditedContent(e.target.value)}
                                                    placeholder="Edit transcript content..."
                                                />
                                            ) : (
                                                <div className="w-full h-96 p-6 bg-gray-50 border border-gray-200 rounded-xl overflow-y-auto whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed shadow-inner">
                                                    {transcript.content}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : selectedMeetingId ? (
                                    <div className="text-center py-20 bg-yellow-50 rounded-2xl border border-yellow-100">
                                        <p className="text-yellow-700">No transcript available for this meeting yet.</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <p className="text-gray-400">Select a meeting to view its transcript</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
