"use client";

import { useState, useEffect } from "react";
import { X, Check, Loader2, Plus, Trash } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";

const API_BASE = 'http://localhost:8000';

interface Task {
    summary: string;
    description: string;
    assignee: string;
    estimate: string;
    type: string;
    priority: string;
}

interface Leave {
    developer_name: string;
    leave_date: string;
    type: string;
    hours: number;
}

interface ParsedDataReviewModalProps {
    transcriptId: number;
    projectId?: number; // Optional, if transcript is linked
    onClose: () => void;
    onSyncComplete: () => void;
}

export default function ParsedDataReviewModal({
    transcriptId,
    projectId: initialProjectId,
    onClose,
    onSyncComplete
}: ParsedDataReviewModalProps) {
    const accessToken = useAuthStore((state) => state.accessToken);

    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(true);
    const [error, setError] = useState("");

    const [tasks, setTasks] = useState<Task[]>([]);
    const [leaves, setLeaves] = useState<Leave[]>([]);

    // Project & Sprint selection (needed for sync)
    const [projectId, setProjectId] = useState<number>(initialProjectId || 0);
    const [sprintId, setSprintId] = useState<number>(0);
    const [projects, setProjects] = useState<any[]>([]);
    const [sprints, setSprints] = useState<any[]>([]);

    // --- Sprint Creation State ---
    const [createSprintMode, setCreateSprintMode] = useState(false);
    const [newSprint, setNewSprint] = useState({
        name: "",
        goal: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 2 weeks default
    });

    useEffect(() => {
        fetchProjects();
        parseTranscript();
    }, []);

    useEffect(() => {
        if (projectId) {
            fetchSprints(projectId);
        }
    }, [projectId]);

    const fetchProjects = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/v1/projects`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success && Array.isArray(result.data)) {
                    setProjects(result.data);
                    if (!projectId && result.data.length > 0) {
                        setProjectId(result.data[0].project_id);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to fetch projects", e);
        }
    };

    const fetchSprints = async (pId: number) => {
        try {
            const response = await fetch(`${API_BASE}/api/v1/projects/${pId}/sprints`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && Array.isArray(result.data.sprints)) {
                    setSprints(result.data.sprints);
                    // Auto-select active sprint if available
                    const active = result.data.sprints.find((s: any) => s.status === 'ACTIVE');
                    if (active) setSprintId(active.sprint_id);
                }
            }
        } catch (e) {
            console.error("Failed to fetch sprints", e);
        }
    };

    const parseTranscript = async () => {
        setParsing(true);
        setError("");
        try {
            const response = await fetch(`${API_BASE}/api/v1/ai/parse_transcript/${transcriptId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
                throw new Error(errorData.detail || `Failed to parse transcript (${response.status})`);
            }

            const result = await response.json();
            if (result.success && result.data) {
                setTasks(result.data.tasks || []);
                setLeaves(result.data.leaves || []);

                // Handle proposed sprint
                if (result.data.sprint_info) {
                    setCreateSprintMode(true);
                    setNewSprint({
                        name: result.data.sprint_info.name || "",
                        goal: result.data.sprint_info.goal || "",
                        start_date: result.data.sprint_info.start_date || new Date().toISOString().split('T')[0],
                        end_date: result.data.sprint_info.end_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    });
                }
            }
        } catch (err: any) {
            setError(err.message || "Failed to parse transcript");
        } finally {
            setParsing(false);
        }
    };

    const handleSync = async () => {
        if (!projectId) {
            setError("Please select a project");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const payload = {
                transcript_id: transcriptId,
                project_id: projectId,
                sprint_id: createSprintMode ? null : (sprintId || null),
                new_sprint: createSprintMode ? newSprint : null,
                tasks: tasks,
                leaves: leaves
            };

            const response = await fetch(`${API_BASE}/api/v1/ai/sync_processed_data`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to sync data");
            }

            const result = await response.json();

            let message = "Sync completed!";
            if (result.sprint_created) message += " New Sprint created.";
            if (result.tasks_created > 0) message += ` ${result.tasks_created} tasks created.`;
            if (result.leaves_added > 0) message += ` ${result.leaves_added} leaves added.`;

            if (result.errors && result.errors.length > 0) {
                setError(`Completed with errors: ${result.errors.join(", ")}`);
            } else {
                alert(message);
                onSyncComplete();
            }
        } catch (err: any) {
            setError(err.message || "Failed to sync data");
        } finally {
            setLoading(false);
        }
    };

    // --- Render Helpers ---

    const TaskRow = ({ task, index }: { task: Task, index: number }) => (
        <div className="grid grid-cols-12 gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded items-center">
            <div className="col-span-3">
                <input
                    value={task.summary}
                    onChange={(e) => updateTask(index, 'summary', e.target.value)}
                    className="w-full text-sm bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                    placeholder="Summary"
                />
            </div>
            <div className="col-span-2">
                <select
                    value={task.type}
                    onChange={(e) => updateTask(index, 'type', e.target.value)}
                    className="w-full text-xs bg-transparent"
                >
                    <option value="Task">Task</option>
                    <option value="Story">Story</option>
                    <option value="Bug">Bug</option>
                </select>
            </div>
            <div className="col-span-2">
                <input
                    value={task.assignee}
                    onChange={(e) => updateTask(index, 'assignee', e.target.value)}
                    className="w-full text-xs bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                    placeholder="Assignee"
                />
            </div>
            <div className="col-span-2">
                <select
                    value={task.priority}
                    onChange={(e) => updateTask(index, 'priority', e.target.value)}
                    className="w-full text-xs bg-transparent"
                >
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Low">Low</option>
                </select>
            </div>
            <div className="col-span-2">
                <input
                    value={task.estimate}
                    onChange={(e) => updateTask(index, 'estimate', e.target.value)}
                    className="w-full text-xs bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                    placeholder="Est"
                />
            </div>
            <div className="col-span-1 text-right">
                <button onClick={() => removeTask(index)} className="text-red-500 hover:text-red-700">
                    <Trash className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    const LeaveRow = ({ leave, index }: { leave: Leave, index: number }) => (
        <div className="grid grid-cols-12 gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded items-center">
            <div className="col-span-4">
                <input
                    value={leave.developer_name}
                    onChange={(e) => updateLeave(index, 'developer_name', e.target.value)}
                    className="w-full text-sm bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                    placeholder="Developer"
                />
            </div>
            <div className="col-span-3">
                <input
                    type="date"
                    value={leave.leave_date}
                    onChange={(e) => updateLeave(index, 'leave_date', e.target.value)}
                    className="w-full text-xs bg-transparent"
                />
            </div>
            <div className="col-span-3">
                <select
                    value={leave.type}
                    onChange={(e) => updateLeave(index, 'type', e.target.value)}
                    className="w-full text-xs bg-transparent"
                >
                    <option value="Full Day">Full Day</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Short Leave">Short Leave</option>
                </select>
            </div>
            <div className="col-span-1">
                <input
                    type="number"
                    value={leave.hours}
                    onChange={(e) => updateLeave(index, 'hours', parseInt(e.target.value))}
                    className="w-full text-xs bg-transparent text-center"
                />
            </div>
            <div className="col-span-1 text-right">
                <button onClick={() => removeLeave(index)} className="text-red-500 hover:text-red-700">
                    <Trash className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    const updateTask = (index: number, field: keyof Task, value: any) => {
        const newTasks = [...tasks];
        (newTasks[index] as any)[field] = value;
        setTasks(newTasks);
    };

    const removeTask = (index: number) => {
        setTasks(tasks.filter((_, i) => i !== index));
    };

    const updateLeave = (index: number, field: keyof Leave, value: any) => {
        const newLeaves = [...leaves];
        (newLeaves[index] as any)[field] = value;
        setLeaves(newLeaves);
    };

    const removeLeave = (index: number) => {
        setLeaves(leaves.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Review AI Parsed Data
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Configuration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Target Project</label>
                            <select
                                value={projectId}
                                onChange={(e) => setProjectId(Number(e.target.value))}
                                className="w-full border rounded p-2 dark:bg-gray-700"
                            >
                                <option value={0}>Select Project</option>
                                {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name} ({p.key})</option>)}
                            </select>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium">Target Sprint (for Leaves)</label>
                                <button
                                    onClick={() => setCreateSprintMode(!createSprintMode)}
                                    className="text-xs text-blue-500 hover:text-blue-700"
                                >
                                    {createSprintMode ? "Select Existing" : "Create New"}
                                </button>
                            </div>

                            {createSprintMode ? (
                                <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800">
                                    <input
                                        placeholder="Sprint Name"
                                        value={newSprint.name}
                                        onChange={(e) => setNewSprint(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full border rounded p-1 mb-1 text-sm text-black"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={newSprint.start_date}
                                            onChange={(e) => setNewSprint(prev => ({ ...prev, start_date: e.target.value }))}
                                            className="w-1/2 border rounded p-1 text-xs text-black"
                                        />
                                        <input
                                            type="date"
                                            value={newSprint.end_date}
                                            onChange={(e) => setNewSprint(prev => ({ ...prev, end_date: e.target.value }))}
                                            className="w-1/2 border rounded p-1 text-xs text-black"
                                        />
                                    </div>
                                    <input
                                        placeholder="Sprint Goal (Optional)"
                                        value={newSprint.goal}
                                        onChange={(e) => setNewSprint(prev => ({ ...prev, goal: e.target.value }))}
                                        className="w-full border rounded p-1 text-sm text-black"
                                    />
                                    <div className="text-xs text-blue-600 italic">
                                        This will create a new Sprint in Jira and sync tasks to it.
                                    </div>
                                </div>
                            ) : (
                                <select
                                    value={sprintId}
                                    onChange={(e) => setSprintId(Number(e.target.value))}
                                    className="w-full border rounded p-2 dark:bg-gray-700"
                                >
                                    <option value={0}>Select Sprint</option>
                                    {sprints.map(s => <option key={s.sprint_id} value={s.sprint_id}>{s.sprint_name} ({s.status})</option>)}
                                </select>
                            )}
                        </div>
                    </div>

                    {parsing ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500 mb-4" />
                            <p>Analyzing transcript with AI...</p>
                        </div>
                    ) : (
                        <>
                            {/* Tasks Section */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-lg">Identified Tasks ({tasks.length})</h3>
                                    <button
                                        onClick={() => setTasks([...tasks, { summary: "", description: "", assignee: "", estimate: "", type: "Task", priority: "Medium" }])}
                                        className="text-sm text-blue-500 flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" /> Add Task
                                    </button>
                                </div>
                                {tasks.length === 0 ? <p className="text-gray-500 italic">No tasks identified.</p> : (
                                    tasks.map((task, i) => <TaskRow key={i} task={task} index={i} />)
                                )}
                            </div>

                            {/* Leaves Section */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-lg">Identified Leaves ({leaves.length})</h3>
                                    <button
                                        onClick={() => setLeaves([...leaves, { developer_name: "", leave_date: new Date().toISOString().split('T')[0], type: "Full Day", hours: 8 }])}
                                        className="text-sm text-blue-500 flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" /> Add Leave
                                    </button>
                                </div>
                                {leaves.length === 0 ? <p className="text-gray-500 italic">No leaves identified.</p> : (
                                    leaves.map((leave, i) => <LeaveRow key={i} leave={leave} index={i} />)
                                )}
                            </div>
                        </>
                    )}

                    {error && <div className="text-red-500 bg-red-50 p-3 rounded">{error}</div>}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={loading || parsing || !projectId}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Confirm & Sync
                    </button>
                </div>
            </div>
        </div>
    );
}
