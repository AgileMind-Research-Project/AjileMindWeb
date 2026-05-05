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
    start_date?: string | null;
    end_date?: string | null;
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

interface ExtractedTask {
    task_id?: string;
    summary: string;
    description?: string;
    effort?: number;
    assignee?: string;
    tags?: string[];
    meeting_status?: string;
}

interface ExtractedLeave {
    developer_name: string;
    leave_date?: string;
    leave_hours?: number;
    leave_type?: string;
    reason?: string;
}

interface ExtractedBug {
    title: string;
    reporter?: string;
    severity?: string;
    description?: string;
}

interface ProjectUser {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
}

interface TaskEditState {
    editTaskId: string;
    editEffort: string;
    editAssignee: string;
    users: ProjectUser[];
    usersLoaded: boolean;
}

interface LeaveEditState {
    editName: string;
    editDate: string;
    editHours: string;
    editType: string;
    editReason: string;
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
    const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
    const [extractedData, setExtractedData] = useState<{ tasks: ExtractedTask[], leave_info: ExtractedLeave[], bugs: ExtractedBug[] } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [expandedTaskIdx, setExpandedTaskIdx] = useState<number | null>(null);
    const [taskDetails, setTaskDetails] = useState<Record<string, any>>({});
    const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
    const [taskEditStates, setTaskEditStates] = useState<Record<number, TaskEditState>>({});
    const [tasksSynced, setTasksSynced] = useState(false);
    const [leavesSynced, setLeavesSynced] = useState(false);
    const [bugsSynced, setBugsSynced] = useState(false);
    const [expandedLeaveIdx, setExpandedLeaveIdx] = useState<number | null>(null);
    const [leaveEditStates, setLeaveEditStates] = useState<Record<number, LeaveEditState>>({});

    // Filter sprints based on category
    const visibleSprints = React.useMemo(() => {
        if (selectedCategory === 'Sprint Planning') {
            return sprints.filter(s => s.sprint_status.toLowerCase() === 'future');
        }
        if (selectedCategory === 'Sprint Review') {
            return sprints.filter(s => s.sprint_status.toLowerCase() === 'active');
        }
        return sprints;
    }, [sprints, selectedCategory]);

    // Handle category change to auto-select valid sprint
    useEffect(() => {
        if (selectedCategory === 'Sprint Planning') {
            const firstFuture = sprints.find(s => s.sprint_status.toLowerCase() === 'future');
            if (firstFuture) {
                setSelectedSprintId(firstFuture.sprint_id);
            } else {
                setSelectedSprintId(null);
            }
        } else if (selectedCategory === 'Sprint Review') {
            const firstActive = sprints.find(s => s.sprint_status.toLowerCase() === 'active');
            if (firstActive) {
                setSelectedSprintId(firstActive.sprint_id);
            } else {
                setSelectedSprintId(null);
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
            // Ensure sprint is compatible with category
            const currentSprint = sprints.find(s => s.sprint_id === selectedSprintId);
            const isPlanning = selectedCategory === 'Sprint Planning';
            const isReview = selectedCategory === 'Sprint Review';
            const isFuture = currentSprint?.sprint_status.toLowerCase() === 'future';
            const isActive = currentSprint?.sprint_status.toLowerCase() === 'active';

            if ((isPlanning && !isFuture) || (isReview && !isActive)) {
                setMeetings([]);
                setSelectedMeetingId(null);
                setTranscript(null);
                return;
            }

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
    }, [selectedProjectId, selectedSprintId, selectedCategory, fetchWithAuth, sprints]);

    useEffect(() => {
        if (selectedMeetingId) {
            const fetchTranscript = async () => {
                setTranscript(null);
                setEditedContent('');
                setExtractedData(null);
                setIsTranscriptExpanded(false);
                setIsEditing(false);
                // Always run analysis — backend fetches transcript independently
                autoRunAnalysis(selectedMeetingId);
                try {
                    const res = await fetchWithAuth(`${API_CONFIG.baseURL}/api/v1/meetings/${selectedMeetingId}/transcripts`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data?.data) {
                            setTranscript(data.data);
                            setEditedContent(data.data?.content || '');
                        }
                    }
                } catch (err) {
                    console.error('Failed to fetch transcript', err);
                }
            };
            fetchTranscript();
        } else {
            setTranscript(null);
            setEditedContent('');
            setExtractedData(null);
            setTasksSynced(false);
            setLeavesSynced(false);
            setBugsSynced(false);
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

    const isSprintReview = selectedCategory === 'Sprint Review';

    const cleanAnalysisData = (data: any) => {
        const review = selectedCategory === 'Sprint Review';
        // Sprint Review: filter tasks with no summary OR no assignee (junk/placeholder rows)
        // Sprint Planning: only filter tasks with no summary (assignees may be unset for new tasks)
        const validTasks = (data.tasks || []).filter((t: ExtractedTask) => {
            if (!t.summary || t.summary.trim() === '') return false;
            if (review && (!t.assignee || t.assignee.trim() === '')) return false;
            return true;
        });
        // Filter out placeholder/no-bug messages (only relevant for Sprint Review)
        const validBugs = review
            ? (data.bugs || []).filter((b: ExtractedBug) =>
                b.title && !b.title.toLowerCase().includes('no bugs') && !b.title.toLowerCase().includes('no bug found')
            )
            : [];
        return { tasks: validTasks, leave_info: data.leave_info || [], bugs: validBugs };
    };

    const autoRunAnalysis = async (meetingId: string) => {
        setIsAnalyzing(true);
        try {
            const res = await fetchWithAuth(`${API_CONFIG.baseURL}/api/v1/meetings/${meetingId}/analyze-tasks`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setExtractedData(cleanAnalysisData(data));
            }
        } catch (err) {
            console.error('Auto-analysis failed', err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAnalyzeTranscript = async () => {
        if (!selectedMeetingId) return;
        setIsAnalyzing(true);
        try {
            const res = await fetchWithAuth(`${API_CONFIG.baseURL}/api/v1/meetings/${selectedMeetingId}/analyze-tasks`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setExtractedData(cleanAnalysisData(data));
            }
        } catch (err) {
            console.error('Failed to analyze transcript', err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSyncTasks = async () => {
        if (!selectedMeetingId || !extractedData || extractedData.tasks.length === 0) return;
        setIsSyncing(true);
        try {
            if (isSprintReview) {
                // ── Sprint Review: update statuses + close sprint ──────────────
                // 1. Send tasks to sync-review-tasks (Completed → done in Jira/DB, others unchanged)
                const reviewRes = await fetchWithAuth(
                    `${API_CONFIG.baseURL}/api/v1/meetings/${selectedMeetingId}/sync-review-tasks`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tasks: extractedData.tasks,
                            project_id: selectedProjectId,
                            sprint_id: selectedSprintId,
                        }),
                    }
                );
                if (!reviewRes.ok) {
                    throw new Error('Failed to sync review task statuses');
                }
                setTasksSynced(true);

                // 2. Close the sprint in Jira + mark DB status = 'Completed'
                if (selectedProjectId && selectedSprintId) {
                    try {
                        const closeRes = await fetchWithAuth(
                            `${API_CONFIG.baseURL}/api/v1/projects/${selectedProjectId}/sprints/${selectedSprintId}/close`,
                            { method: 'POST' }
                        );
                        if (closeRes.ok) {
                            const closeData = await closeRes.json();
                            const updatedSprint = closeData?.data;
                            setSprints(prev =>
                                prev.map(s =>
                                    s.sprint_id === selectedSprintId
                                        ? { ...s, sprint_status: updatedSprint?.sprint_status ?? 'Closed' }
                                        : s
                                )
                            );
                        }
                    } catch {
                        // non-fatal — statuses were already updated
                    }
                }
            } else {
                // ── Sprint Planning: automated sprint preparation + sync ────────
                let targetSprintId = selectedSprintId;

                // 1. If no sprint is selected, automatically identify or create the next one
                if (!targetSprintId && selectedProjectId) {
                    try {
                        const prepareRes = await fetchWithAuth(
                            `${API_CONFIG.baseURL}/api/v1/projects/${selectedProjectId}/sprints/prepare`,
                            { method: 'POST' }
                        );
                        if (prepareRes.ok) {
                            const prepareData = await prepareRes.json();
                            const nextSprint = prepareData.data;
                            if (nextSprint) {
                                targetSprintId = nextSprint.id;
                                setSelectedSprintId(targetSprintId);
                                
                                // Update local sprints list so the UI reflects the new sprint
                                setSprints(prev => {
                                    if (prev.some(s => s.sprint_id === nextSprint.id)) return prev;
                                    return [{
                                        sprint_id: nextSprint.id,
                                        sprint_name: nextSprint.name,
                                        sprint_status: nextSprint.state || 'Future'
                                    }, ...prev];
                                });
                            }
                        } else {
                            const errData = await prepareRes.json();
                            alert(`Sprint Preparation Failed: ${errData.detail || 'Unknown error'}`);
                        }
                    } catch (err) {
                        console.error('Failed to auto-prepare next sprint:', err);
                        alert('Failed to automatically identify or create the next sprint. Please ensure Jira integration is active.');
                    }
                }

                if (!targetSprintId) {
                    alert('Please select a sprint or ensure Jira integration is active.');
                    setIsSyncing(false);
                    return;
                }

                // 2. Sync tasks to the identified sprint
                const res = await fetchWithAuth(
                    `${API_CONFIG.baseURL}/api/v1/meetings/${selectedMeetingId}/sync-tasks`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tasks: extractedData.tasks,
                            project_id: selectedProjectId,
                            sprint_id: targetSprintId,
                        }),
                    }
                );
                
                if (res.ok) {
                    setTasksSynced(true);
                    
                    // Collect Jira keys from the response (especially important for NEW tasks)
                    const syncData = await res.json();
                    const syncedResults = syncData.results || [];
                    const allTaskIds = syncedResults
                        .map((r: any) => r.jira_key)
                        .filter((id: string) => Boolean(id));

                    // 3. Activate the sprint in Jira and DB
                    if (selectedProjectId && targetSprintId) {
                        try {
                            const startRes = await fetchWithAuth(
                                `${API_CONFIG.baseURL}/api/v1/projects/${selectedProjectId}/sprints/${targetSprintId}/start`,
                                {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ task_ids: allTaskIds }),
                                }
                            );
                            if (startRes.ok) {
                                const startData = await startRes.json();
                                const updatedSprint = startData?.data;
                                const nextSprint = startData?.next_sprint;

                                setSprints(prev => {
                                    // 1. Update the current active sprint
                                    let newSprints = prev.map(s =>
                                        s.sprint_id === targetSprintId
                                            ? {
                                                ...s,
                                                sprint_status: updatedSprint?.sprint_status ?? 'Active',
                                                start_date: updatedSprint?.start_date ?? s.start_date,
                                                end_date: updatedSprint?.end_date ?? s.end_date,
                                            }
                                            : s
                                    );

                                    // 2. Add the next prepared sprint if it's missing
                                    if (nextSprint && !newSprints.find(s => s.sprint_id === nextSprint.id)) {
                                        newSprints.push({
                                            sprint_id: nextSprint.id,
                                            project_id: selectedProjectId,
                                            sprint_name: nextSprint.name,
                                            sprint_status: 'Future',
                                            start_date: '', // Will be updated on actual load
                                            end_date: ''
                                        });
                                    }
                                    return newSprints;
                                });
                            }
                        } catch (err) {
                            console.error('Non-fatal: failed to start sprint in Jira', err);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Failed to sync tasks', err);
            alert('Failed to sync tasks');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncLeaves = async () => {
        if (!selectedMeetingId || !extractedData || extractedData.leave_info.length === 0) return;
        setIsSyncing(true);
        try {
            const res = await fetchWithAuth(`${API_CONFIG.baseURL}/api/v1/meetings/${selectedMeetingId}/sync-leaves`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leaves: extractedData.leave_info,
                    project_id: selectedProjectId,
                    sprint_id: selectedSprintId
                }),
            });
            if (res.ok) {
                setLeavesSynced(true);
            }
        } catch (err) {
            console.error('Failed to sync leaves', err);
            alert('Failed to sync leaves');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncBugs = async () => {
        if (!selectedMeetingId || !extractedData || (extractedData.bugs || []).length === 0) return;
        setIsSyncing(true);
        try {
            const res = await fetchWithAuth(`${API_CONFIG.baseURL}/api/v1/meetings/${selectedMeetingId}/sync-bugs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bugs: extractedData.bugs,
                    project_id: selectedProjectId,
                    sprint_id: selectedSprintId,
                }),
            });
            if (res.ok) {
                setBugsSynced(true);
            }
        } catch (err) {
            console.error('Failed to sync bugs', err);
            alert('Failed to save bugs to database');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleToggleLeave = (idx: number) => {
        const next = expandedLeaveIdx === idx ? null : idx;
        setExpandedLeaveIdx(next);
        if (next !== null) {
            const leave = extractedData?.leave_info[idx];
            setLeaveEditStates(prev => ({
                ...prev,
                [idx]: {
                    editName: leave?.developer_name ?? '',
                    editDate: leave?.leave_date ?? '',
                    editHours: leave?.leave_hours != null ? String(leave.leave_hours) : '',
                    editType: leave?.leave_type ?? '',
                    editReason: leave?.reason ?? '',
                },
            }));
        }
    };

    const applyLeaveEdit = (idx: number) => {
        const s = leaveEditStates[idx];
        if (!s || !extractedData) return;
        const hoursVal = s.editHours !== '' ? Number(s.editHours) : undefined;
        setExtractedData(prev => {
            if (!prev) return prev;
            const leave_info = prev.leave_info.map((l, i) =>
                i === idx
                    ? {
                        ...l,
                        developer_name: s.editName || l.developer_name,
                        leave_date: s.editDate || l.leave_date,
                        leave_hours: Number.isFinite(hoursVal as number) ? hoursVal : l.leave_hours,
                        leave_type: s.editType || l.leave_type,
                        reason: s.editReason,
                    }
                    : l
            );
            return { ...prev, leave_info };
        });
        setExpandedLeaveIdx(null);
    };

    const discardLeaveEdit = (idx: number) => {
        setExtractedData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                leave_info: prev.leave_info.filter((_, i) => i !== idx)
            };
        });
        setExpandedLeaveIdx(null);
    };

    const loadProjectUsers = async (idx: number) => {
        if (!selectedProjectId) return;
        try {
            const res = await fetchWithAuth(`${API_CONFIG.baseURL}/api/v1/projects/${selectedProjectId}/users`);
            if (res.ok) {
                const json = await res.json();
                const users: ProjectUser[] = json.data?.users ?? json.data ?? [];
                setTaskEditStates(prev => ({ ...prev, [idx]: { ...prev[idx], users, usersLoaded: true } }));
            } else {
                setTaskEditStates(prev => ({ ...prev, [idx]: { ...prev[idx], users: [], usersLoaded: true } }));
            }
        } catch {
            setTaskEditStates(prev => ({ ...prev, [idx]: { ...prev[idx], users: [], usersLoaded: true } }));
        }
    };

    const applyTaskEdit = (idx: number) => {
        const s = taskEditStates[idx];
        if (!s || !extractedData) return;
        const effortVal = s.editEffort !== '' ? Number(s.editEffort) : undefined;
        setExtractedData(prev => {
            if (!prev) return prev;
            const tasks = prev.tasks.map((t, i) =>
                i === idx
                    ? { ...t, task_id: s.editTaskId || t.task_id, assignee: s.editAssignee || t.assignee, effort: Number.isFinite(effortVal as number) ? effortVal : t.effort }
                    : t
            );
            return { ...prev, tasks };
        });
        setExpandedTaskIdx(null);
    };

    const discardTaskEdit = (idx: number) => {
        setExtractedData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                tasks: prev.tasks.filter((_, i) => i !== idx)
            };
        });
        setExpandedTaskIdx(null);
    };

    const fetchTaskDetail = async (taskId: string) => {
        if (taskDetails[taskId] !== undefined) return; // already cached
        setLoadingTaskId(taskId);
        try {
            const res = await fetchWithAuth(`${API_CONFIG.baseURL}/api/v1/backlog/${encodeURIComponent(taskId)}`);
            if (res.ok) {
                const json = await res.json();
                setTaskDetails(prev => ({ ...prev, [taskId]: json.data }));
            } else {
                setTaskDetails(prev => ({ ...prev, [taskId]: null }));
            }
        } catch {
            setTaskDetails(prev => ({ ...prev, [taskId]: null }));
        } finally {
            setLoadingTaskId(null);
        }
    };

    const handleToggleTask = (idx: number, taskId?: string) => {
        const next = expandedTaskIdx === idx ? null : idx;
        setExpandedTaskIdx(next);
        if (next !== null) {
            if (taskId) fetchTaskDetail(taskId);
            const task = extractedData?.tasks[idx];
            setTaskEditStates(prev => ({
                ...prev,
                [idx]: {
                    editTaskId: task?.task_id ?? '',
                    editEffort: task?.effort != null ? String(task.effort) : '',
                    editAssignee: task?.assignee ?? '',
                    users: prev[idx]?.users ?? [],
                    usersLoaded: prev[idx]?.usersLoaded ?? false,
                },
            }));
            if (selectedProjectId && !taskEditStates[idx]?.usersLoaded) {
                loadProjectUsers(idx);
            }
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
                                onClick={() => {
                                    if (cat.id === 'Technical Design Meeting' || cat.id === 'Sprint Retrospective') {
                                        const url = `http://localhost:3008/transcripts?project_id=${selectedProjectId}&category=${encodeURIComponent(cat.id)}`;
                                        window.location.href = url;
                                    } else {
                                        setSelectedCategory(cat.id);
                                    }
                                }}
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
                                        {visibleSprints.length > 0 ? (
                                            <select
                                                className="w-full p-2 bg-white border border-gray-200 rounded shadow-sm outline-none"
                                                value={selectedSprintId || ''}
                                                onChange={(e) => setSelectedSprintId(parseInt(e.target.value))}
                                            >
                                                {visibleSprints.map(s => (
                                                    <option key={s.sprint_id} value={s.sprint_id}>{s.sprint_name} ({s.sprint_status})</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="p-2 bg-amber-50 border border-amber-200 text-amber-700 rounded text-xs font-medium italic">
                                                {selectedCategory === 'Sprint Planning'
                                                    ? 'No sprint planning event yet'
                                                    : selectedCategory === 'Sprint Review'
                                                        ? 'No sprint review event yet'
                                                        : 'No sprints found'}
                                            </div>
                                        )}
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

                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-bold text-blue-600 capitalize">
                                        {MEETING_CATEGORIES.find(c => c.id === selectedCategory)?.label}
                                    </h2>
                                </div>
                            </div>

                            <div className="p-8">
                                {isLoading ? (
                                    <div className="flex justify-center items-center h-64">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : selectedMeetingId ? (
                                    <div className="space-y-6">
                                        {/* Transcript header + collapsible — only when transcript is available */}
                                        {transcript && (<>
                                        <div className="flex justify-between items-center border-b pb-4">
                                            <div>
                                                <div className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1 mb-1">
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                                    {sprints.find(s => s.sprint_id === selectedSprintId)?.sprint_name || 'Current Sprint'}
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-800">Transcript for: {transcript.title}</h3>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* Generate Report button */}
                                                <button
                                                    onClick={() => {
                                                        const url = `http://localhost:3008/transcripts?project_id=${selectedProjectId}&category=${encodeURIComponent(selectedCategory || '')}&autoOpen=true`;
                                                        window.location.href = url;
                                                    }}
                                                    disabled={!extractedData || extractedData.tasks.length === 0}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all ${!extractedData || extractedData.tasks.length === 0
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                                                        }`}
                                                    title={!extractedData || extractedData.tasks.length === 0 ? 'Wait for task analysis to complete' : 'Generate and view report'}
                                                >
                                                    <span>📊</span> Generate Report
                                                </button>

                                                {/* Re-run Analysis button */}
                                                <button
                                                    onClick={handleAnalyzeTranscript}
                                                    disabled={isAnalyzing}
                                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 disabled:bg-purple-300 flex items-center gap-2 shadow-sm transition-all"
                                                >
                                                    {isAnalyzing ? (
                                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                    ) : '✨'}
                                                    {isAnalyzing ? 'Analysing…' : 'Re-run Analysis'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Transcript collapsible section — label + expand icon only by default */}
                                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                                            {/* Clickable header row */}
                                            <button
                                                onClick={() => {
                                                    setIsTranscriptExpanded(v => !v);
                                                    if (isEditing) setIsEditing(false);
                                                }}
                                                className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                            >
                                                <span className="flex items-center gap-2 font-semibold text-gray-700 text-sm">
                                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Transcript Content
                                                    <span className="text-xs font-normal text-gray-400">
                                                        ({(transcript.content || '').length.toLocaleString()} chars)
                                                    </span>
                                                </span>
                                                <svg
                                                    className={`w-5 h-5 text-gray-400 transition-transform ${isTranscriptExpanded ? 'rotate-180' : ''}`}
                                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {/* Expanded content + edit controls */}
                                            {isTranscriptExpanded && (
                                                <div className="p-5 border-t border-gray-100 space-y-3">
                                                    {/* Edit / Save toggle */}
                                                    <div className="flex justify-end">
                                                        <button
                                                            onClick={() => {
                                                                if (isEditing) handleUpdateTranscript();
                                                                else setIsEditing(true);
                                                            }}
                                                            className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2
                                                                ${isEditing
                                                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                                        >
                                                            {isEditing ? (
                                                                <>
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    Save Changes
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                    Edit Transcript
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>

                                                    {isEditing ? (
                                                        <textarea
                                                            className="w-full h-96 p-6 border-2 border-blue-400 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none font-mono text-sm leading-relaxed"
                                                            value={editedContent}
                                                            onChange={(e) => setEditedContent(e.target.value)}
                                                            placeholder="Edit transcript content..."
                                                        />
                                                    ) : (
                                                        <div className="h-[400px] p-6 bg-gray-50 border border-gray-200 rounded-xl overflow-y-auto whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed shadow-inner">
                                                            {transcript.content}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* End of transcript section */}
                                        </>)}

                                        {/* Full-panel spinner while analysis runs */}
                                        {isAnalyzing && (
                                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                                <div className="animate-spin rounded-full h-14 w-14 border-4 border-purple-200 border-t-purple-600"></div>
                                                <p className="text-purple-700 font-semibold">Running AI Analysis…</p>
                                                <p className="text-gray-400 text-sm">{isSprintReview ? 'Analysing Sprint Review transcript…' : 'Extracting tasks and leave information'}</p>
                                            </div>
                                        )}

                                        {/* Extracted Data View */}
                                        {!isAnalyzing && extractedData && (
                                            <div className="mt-4 space-y-8 animate-fadeIn border-t pt-8">
                                                <div className="flex justify-between items-end flex-wrap gap-3">
                                                    <div>
                                                        <h4 className="text-xl font-extrabold text-gray-900">AI Analysis Results</h4>
                                                        <p className="text-sm text-gray-500">
                                                            {isSprintReview
                                                                ? `Sprint Review · ${extractedData.tasks.length} tasks · ${(extractedData.bugs || []).length} bug${(extractedData.bugs || []).length !== 1 ? 's' : ''} detected`
                                                                : 'Extracted tasks, leave info, and team sentiment from the transcript.'}
                                                        </p>
                                                    </div>
                                                    {extractedData && (
                                                        <div className="flex gap-3 flex-wrap">
                                                            {/* Sync Tasks */}
                                                            {tasksSynced ? (
                                                                <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-50 border border-blue-200">
                                                                    <span className="text-blue-700 font-bold text-sm">✓ Tasks Synced</span>
                                                                    {isSprintReview
                                                                        ? <span className="text-[11px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">Sprint Closed</span>
                                                                        : <span className="text-[11px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">Sprint Active</span>}
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={handleSyncTasks}
                                                                    disabled={isSyncing || extractedData.tasks.length === 0}
                                                                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 shadow-lg shadow-blue-100 transition-all flex items-center gap-2"
                                                                >
                                                                    {isSyncing ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : '🚀'}
                                                                    {isSprintReview ? 'Save Review Results' : 'Sync Tasks to Jira/DB'}
                                                                </button>
                                                            )}

                                                            {/* Sprint Review: Sync Bugs | Planning: Sync Leaves */}
                                                            {isSprintReview ? (
                                                                (extractedData.bugs || []).length > 0 && (
                                                                    bugsSynced ? (
                                                                        <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 border border-red-200">
                                                                            <span className="text-red-700 font-bold text-sm">✓ Bugs Saved to Database</span>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={handleSyncBugs}
                                                                            disabled={isSyncing}
                                                                            className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 disabled:bg-gray-300 shadow-lg shadow-red-100 transition-all flex items-center gap-2"
                                                                        >
                                                                            {isSyncing ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : '🐛'}
                                                                            Save Bugs to DB
                                                                        </button>
                                                                    )
                                                                )
                                                            ) : (
                                                                leavesSynced ? (
                                                                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-50 border border-green-200">
                                                                        <span className="text-green-700 font-bold text-sm">✓ Leaves Saved to Database</span>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={handleSyncLeaves}
                                                                        disabled={isSyncing || extractedData.leave_info.length === 0}
                                                                        className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-300 shadow-lg shadow-green-100 transition-all flex items-center gap-2"
                                                                    >
                                                                        {isSyncing ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : '💾'}
                                                                        Sync Leaves to DB
                                                                    </button>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tasks + Right-panel grid */}
                                                {extractedData && (
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                        {/* ── Tasks Section ── */}
                                                        <div className="space-y-3">
                                                            <h5 className="font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider text-xs">
                                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                                {isSprintReview ? 'Sprint Review Tasks' : 'Detected Tasks'} ({extractedData.tasks.length})
                                                            </h5>
                                                            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                                                                {extractedData.tasks.length === 0 ? (
                                                                    <p className="text-sm text-gray-400 italic text-center py-10">No tasks identified.</p>
                                                                ) : (
                                                                    <div className="divide-y divide-gray-100 overflow-y-auto max-h-[560px] custom-scrollbar">
                                                                        {extractedData.tasks.map((task, idx) => {
                                                                            const isExpanded = expandedTaskIdx === idx;
                                                                            const detail = task.task_id ? taskDetails[task.task_id] : undefined;
                                                                            const isLoadingThis = loadingTaskId === task.task_id;
                                                                            return (
                                                                                <div key={idx} className="bg-white">
                                                                                    {/* Row */}
                                                                                    <button
                                                                                        type="button"
                                                                                        className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors text-left ${isExpanded ? 'bg-blue-50' : ''}`}
                                                                                        onClick={() => handleToggleTask(idx, task.task_id)}
                                                                                    >
                                                                                        {/* Chevron */}
                                                                                        <svg
                                                                                            className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                                                            fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                                                                                        >
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                                                        </svg>

                                                                                        {/* ID badge */}
                                                                                        <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                                                                                            {task.task_id || 'NEW'}
                                                                                        </span>

                                                                                        {/* Summary */}
                                                                                        <span className="flex-1 text-sm font-semibold text-gray-800 truncate">{task.summary}</span>

                                                                                        {/* Assignee */}
                                                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold flex items-center justify-center shrink-0" title={task.assignee || 'Unassigned'}>
                                                                                                {task.assignee ? task.assignee[0].toUpperCase() : '?'}
                                                                                            </div>
                                                                                            <span className="text-xs text-gray-500 hidden sm:inline max-w-[90px] truncate">{task.assignee || 'Unassigned'}</span>
                                                                                        </div>

                                                                                        {/* Sprint Review: editable meeting_status dropdown | Planning: effort badge */}
                                                                                        {isSprintReview ? (
                                                                                            <select
                                                                                                value={task.meeting_status || 'Incomplete'}
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                                onChange={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    const newStatus = e.target.value;
                                                                                                    setExtractedData(prev => {
                                                                                                        if (!prev) return prev;
                                                                                                        const tasks = prev.tasks.map((t, i) =>
                                                                                                            i === idx ? { ...t, meeting_status: newStatus } : t
                                                                                                        );
                                                                                                        return { ...prev, tasks };
                                                                                                    });
                                                                                                }}
                                                                                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 cursor-pointer outline-none border-0 appearance-none ${
                                                                                                    task.meeting_status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                                                                    task.meeting_status === 'Partially Complete' ? 'bg-amber-100 text-amber-700' :
                                                                                                    task.meeting_status === 'Moved to Next Sprint' ? 'bg-purple-100 text-purple-700' :
                                                                                                    'bg-red-100 text-red-700'
                                                                                                }`}
                                                                                            >
                                                                                                <option value="Completed">Completed</option>
                                                                                                <option value="Partially Complete">Partially Complete</option>
                                                                                                <option value="Incomplete">Incomplete</option>
                                                                                                <option value="Moved to Next Sprint">Moved to Next Sprint</option>
                                                                                            </select>
                                                                                        ) : task.effort != null ? (
                                                                                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                                                                                                ⏱ {task.effort}h
                                                                                            </span>
                                                                                        ) : null}
                                                                                    </button>

                                                                                    {/* Expanded detail panel */}
                                                                                    {isExpanded && (() => {
                                                                                        const ts = taskEditStates[idx];
                                                                                        return (
                                                                                            <div className="px-6 pb-5 pt-4 bg-blue-50 border-t border-blue-100 space-y-4">
                                                                                                {isLoadingThis ? (
                                                                                                    <div className="flex items-center gap-2 py-4 justify-center">
                                                                                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-600"></div>
                                                                                                        <span className="text-sm text-blue-600">Loading details…</span>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <>
                                                                                                        {/* For Sprint Review: show meeting_status prominently */}
                                                                                                        {isSprintReview && task.meeting_status && (
                                                                                                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                                                                                                task.meeting_status === 'Completed' ? 'bg-green-50 border border-green-200' :
                                                                                                                task.meeting_status === 'Partially Complete' ? 'bg-amber-50 border border-amber-200' :
                                                                                                                task.meeting_status === 'Moved to Next Sprint' ? 'bg-purple-50 border border-purple-200' :
                                                                                                                'bg-red-50 border border-red-200'
                                                                                                            }`}>
                                                                                                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Review Status:</span>
                                                                                                                <span className={`text-sm font-bold ${
                                                                                                                    task.meeting_status === 'Completed' ? 'text-green-700' :
                                                                                                                    task.meeting_status === 'Partially Complete' ? 'text-amber-700' :
                                                                                                                    task.meeting_status === 'Moved to Next Sprint' ? 'text-purple-700' :
                                                                                                                    'text-red-700'
                                                                                                                }`}>
                                                                                                                    {task.meeting_status === 'Completed' ? '✓' : task.meeting_status === 'Partially Complete' ? '◑' : task.meeting_status === 'Moved to Next Sprint' ? '→' : '✗'} {task.meeting_status}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        )}

                                                                                                        {/* Description */}
                                                                                                        <div>
                                                                                                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Description</p>
                                                                                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                                                                                {detail?.description || task.description || <span className="italic text-gray-400">No description available.</span>}
                                                                                                            </p>
                                                                                                        </div>

                                                                                                        {/* Tags */}
                                                                                                        {(() => {
                                                                                                            const tags: string[] = detail?.tags ?? task.tags ?? [];
                                                                                                            return tags.length > 0 ? (
                                                                                                                <div>
                                                                                                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Tags</p>
                                                                                                                    <div className="flex flex-wrap gap-1.5">
                                                                                                                        {tags.map((tag: string, ti: number) => (
                                                                                                                            <span key={ti} className="text-[11px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                                                                                                                        ))}
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            ) : null;
                                                                                                        })()}

                                                                                                        {/* Status / Priority / Type row */}
                                                                                                        {(detail?.status || detail?.priority || detail?.issue_type) && (
                                                                                                            <div className="flex flex-wrap gap-4">
                                                                                                                {detail?.status && (
                                                                                                                    <div>
                                                                                                                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Status</p>
                                                                                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{detail.status}</span>
                                                                                                                    </div>
                                                                                                                )}
                                                                                                                {detail?.priority && (
                                                                                                                    <div>
                                                                                                                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Priority</p>
                                                                                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${detail.priority === 'High' ? 'bg-red-100 text-red-700'
                                                                                                                            : detail.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700'
                                                                                                                                : 'bg-green-100 text-green-700'
                                                                                                                            }`}>{detail.priority}</span>
                                                                                                                    </div>
                                                                                                                )}
                                                                                                                {detail?.issue_type && (
                                                                                                                    <div>
                                                                                                                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Type</p>
                                                                                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{detail.issue_type}</span>
                                                                                                                    </div>
                                                                                                                )}
                                                                                                            </div>
                                                                                                        )}

                                                                                                        {/* ── Edit fields ── */}
                                                                                                        <div className={`grid grid-cols-1 gap-3 pt-3 border-t border-blue-200 ${isSprintReview ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                                                                                                            {/* Task ID */}
                                                                                                            <div>
                                                                                                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Task ID</label>
                                                                                                                <input
                                                                                                                    type="text"
                                                                                                                    value={ts?.editTaskId ?? task.task_id ?? ''}
                                                                                                                    onChange={(e) => setTaskEditStates(prev => ({ ...prev, [idx]: { ...prev[idx], editTaskId: e.target.value } }))}
                                                                                                                    placeholder="e.g. TAM-123"
                                                                                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                                />
                                                                                                            </div>

                                                                                                            {/* Estimated Hours — hidden for Sprint Review (effort is always 0) */}
                                                                                                            {!isSprintReview && (
                                                                                                                <div>
                                                                                                                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Estimated Hours</label>
                                                                                                                    <input
                                                                                                                        type="number"
                                                                                                                        min={0}
                                                                                                                        step={0.5}
                                                                                                                        value={ts?.editEffort ?? (task.effort != null ? String(task.effort) : '')}
                                                                                                                        onChange={(e) => setTaskEditStates(prev => ({ ...prev, [idx]: { ...prev[idx], editEffort: e.target.value } }))}
                                                                                                                        placeholder="e.g. 4"
                                                                                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                                    />
                                                                                                                </div>
                                                                                                            )}

                                                                                                            {/* Assignee */}
                                                                                                            <div>
                                                                                                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Assignee</label>
                                                                                                                {ts?.usersLoaded ? (
                                                                                                                    <select
                                                                                                                        value={ts.editAssignee}
                                                                                                                        onChange={(e) => setTaskEditStates(prev => ({ ...prev, [idx]: { ...prev[idx], editAssignee: e.target.value } }))}
                                                                                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                                    >
                                                                                                                        <option value="">— Unassigned —</option>
                                                                                                                        {ts.users.map((u) => (
                                                                                                                            <option key={u.user_id} value={u.email}>
                                                                                                                                {u.first_name} {u.last_name} ({u.email})
                                                                                                                            </option>
                                                                                                                        ))}
                                                                                                                        {ts.editAssignee && !ts.users.some(u => u.email === ts.editAssignee) && (
                                                                                                                            <option value={ts.editAssignee}>{ts.editAssignee}</option>
                                                                                                                        )}
                                                                                                                    </select>
                                                                                                                ) : (
                                                                                                                    <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                                                                                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-blue-500"></div>
                                                                                                                        Loading members…
                                                                                                                    </div>
                                                                                                                )}
                                                                                                            </div>
                                                                                                        </div>

                                                                                                        {/* Save / Discard */}
                                                                                                        <div className="flex justify-end gap-2">
                                                                                                            <button
                                                                                                                type="button"
                                                                                                                onClick={() => discardTaskEdit(idx)}
                                                                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                                                                                                            >
                                                                                                                ✕ Discard
                                                                                                            </button>
                                                                                                            <button
                                                                                                                type="button"
                                                                                                                onClick={() => applyTaskEdit(idx)}
                                                                                                                className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
                                                                                                            >
                                                                                                                ✓ Apply
                                                                                                            </button>
                                                                                                        </div>
                                                                                                    </>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* ── Right Panel: Bugs (Sprint Review) or Leave (Planning) ── */}
                                                        <div className="space-y-3">
                                                            {isSprintReview ? (
                                                                <>
                                                                    <h5 className="font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider text-xs">
                                                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                                        Bugs Found in Sprint ({(extractedData.bugs || []).length})
                                                                    </h5>
                                                                    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                                                                        {(extractedData.bugs || []).length === 0 ? (
                                                                            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                                                                                <span className="text-3xl">✅</span>
                                                                                <p className="text-sm italic">No bugs reported in this sprint.</p>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="divide-y divide-gray-100 overflow-y-auto max-h-[560px] custom-scrollbar">
                                                                                {(extractedData.bugs || []).map((bug, bi) => (
                                                                                    <div key={bi} className="bg-white px-4 py-3 space-y-1">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                                                                                bug.severity === 'High' ? 'bg-red-100 text-red-700' :
                                                                                                bug.severity === 'Low' ? 'bg-green-100 text-green-700' :
                                                                                                'bg-amber-100 text-amber-700'
                                                                                            }`}>{bug.severity || 'Medium'}</span>
                                                                                            <span className="text-sm font-semibold text-gray-800 flex-1">{bug.title}</span>
                                                                                        </div>
                                                                                        {bug.reporter && (
                                                                                            <p className="text-xs text-gray-400 pl-1">Reported by: {bug.reporter}</p>
                                                                                        )}
                                                                                        {bug.description && (
                                                                                            <p className="text-sm text-gray-600 leading-relaxed pl-1">{bug.description}</p>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                            <h5 className="font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider text-xs">
                                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                                Developer Leave Info ({extractedData.leave_info.length})
                                                            </h5>
                                                            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                                                                {extractedData.leave_info.length === 0 ? (
                                                                    <p className="text-sm text-gray-400 italic text-center py-10">No leave mentions identified.</p>
                                                                ) : (
                                                                    <div className="divide-y divide-gray-100 overflow-y-auto max-h-[560px] custom-scrollbar">
                                                                        {extractedData.leave_info.map((leave, idx) => {
                                                                            const isLeaveExpanded = expandedLeaveIdx === idx;
                                                                            return (
                                                                                <div key={idx} className="bg-white">
                                                                                    {/* Row */}
                                                                                    <button
                                                                                        type="button"
                                                                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${isLeaveExpanded ? 'bg-green-50' : ''}`}
                                                                                        onClick={() => handleToggleLeave(idx)}
                                                                                    >
                                                                                        {/* Chevron */}
                                                                                        <svg
                                                                                            className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isLeaveExpanded ? 'rotate-90' : ''}`}
                                                                                            fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                                                                                        >
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                                                        </svg>

                                                                                        {/* Avatar */}
                                                                                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 text-sm font-bold flex items-center justify-center shrink-0">
                                                                                            {leave.developer_name ? leave.developer_name[0].toUpperCase() : '?'}
                                                                                        </div>

                                                                                        {/* Name */}
                                                                                        <span className="flex-1 text-sm font-semibold text-gray-800 truncate">{leave.developer_name || 'Unknown'}</span>

                                                                                        {/* Leave type badge */}
                                                                                        {leave.leave_type && (
                                                                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap shrink-0">
                                                                                                {leave.leave_type}
                                                                                            </span>
                                                                                        )}

                                                                                        {/* Date */}
                                                                                        <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                                                                                            {leave.leave_date || 'TBD'}
                                                                                        </span>

                                                                                        {/* Hours */}
                                                                                        {leave.leave_hours != null && (
                                                                                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                                                                                                ⏱ {leave.leave_hours}h
                                                                                            </span>
                                                                                        )}
                                                                                    </button>

                                                                                    {/* Expanded edit panel */}
                                                                                    {isLeaveExpanded && (() => {
                                                                                        const ls = leaveEditStates[idx];
                                                                                        return (
                                                                                            <div className="px-6 pb-5 pt-4 bg-green-50 border-t border-green-100 space-y-4">
                                                                                                {leave.reason && (
                                                                                                    <p className="text-sm text-gray-600 italic">"{leave.reason}"</p>
                                                                                                )}
                                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                                                    {/* Developer Name */}
                                                                                                    <div>
                                                                                                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Developer Name</label>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            value={ls?.editName ?? leave.developer_name}
                                                                                                            onChange={(e) => setLeaveEditStates(prev => ({ ...prev, [idx]: { ...prev[idx], editName: e.target.value } }))}
                                                                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                                                                        />
                                                                                                    </div>

                                                                                                    {/* Leave Type */}
                                                                                                    <div>
                                                                                                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Leave Type</label>
                                                                                                        <select
                                                                                                            value={ls?.editType ?? leave.leave_type ?? ''}
                                                                                                            onChange={(e) => setLeaveEditStates(prev => ({ ...prev, [idx]: { ...prev[idx], editType: e.target.value } }))}
                                                                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                                                                        >
                                                                                                            <option value="">— Select —</option>
                                                                                                            <option>Sick Leave</option>
                                                                                                            <option>Annual Leave</option>
                                                                                                            <option>Emergency Leave</option>
                                                                                                            <option>Maternity/Paternity</option>
                                                                                                            <option>Work From Home</option>
                                                                                                            <option>Other</option>
                                                                                                        </select>
                                                                                                    </div>

                                                                                                    {/* Date */}
                                                                                                    <div>
                                                                                                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Date</label>
                                                                                                        <input
                                                                                                            type="date"
                                                                                                            value={ls?.editDate ?? leave.leave_date ?? ''}
                                                                                                            onChange={(e) => setLeaveEditStates(prev => ({ ...prev, [idx]: { ...prev[idx], editDate: e.target.value } }))}
                                                                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                                                                        />
                                                                                                    </div>

                                                                                                    {/* Hours */}
                                                                                                    <div>
                                                                                                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Hours Impact</label>
                                                                                                        <input
                                                                                                            type="number"
                                                                                                            min={0}
                                                                                                            step={0.5}
                                                                                                            value={ls?.editHours ?? (leave.leave_hours != null ? String(leave.leave_hours) : '')}
                                                                                                            onChange={(e) => setLeaveEditStates(prev => ({ ...prev, [idx]: { ...prev[idx], editHours: e.target.value } }))}
                                                                                                            placeholder="e.g. 8"
                                                                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                                                                        />
                                                                                                    </div>
                                                                                                </div>

                                                                                                {/* Reason */}
                                                                                                <div>
                                                                                                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Reason</label>
                                                                                                    <input
                                                                                                        type="text"
                                                                                                        value={ls?.editReason ?? leave.reason ?? ''}
                                                                                                        onChange={(e) => setLeaveEditStates(prev => ({ ...prev, [idx]: { ...prev[idx], editReason: e.target.value } }))}
                                                                                                        placeholder="Optional reason"
                                                                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                                                                    />
                                                                                                </div>

                                                                                                {/* Save / Discard */}
                                                                                                <div className="flex justify-end gap-2">
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => discardLeaveEdit(idx)}
                                                                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                                                                                                    >
                                                                                                        ✕ Discard
                                                                                                    </button>
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => applyLeaveEdit(idx)}
                                                                                                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
                                                                                                    >
                                                                                                        ✓ Apply
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {/* No data fallback — shown when not analyzing and no data yet */}
                                        {!isAnalyzing && !extractedData && (
                                            <div className="text-center py-20 bg-yellow-50 rounded-2xl border border-yellow-100">
                                                <p className="text-yellow-700">No transcript available for this meeting yet.</p>
                                            </div>
                                        )}
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
