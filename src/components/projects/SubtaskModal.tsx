'use client';

import { useState, useEffect } from 'react';
import { ToastService } from '@/lib/utils/toast.utils';

interface BacklogItem {
    id: string;
    project_id: number;
    summary: string;
    description: string | null;
    issue_type: string;
    status: string;
    priority: string | null;
    assignee: string | null;
    story_points: number;
    parent_task_id: string | null;
    tags: string[] | null;
    severity: string | null;
}

interface SubtaskModalProps {
    projectId: number;
    projectName: string;
    projectKey: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function SubtaskModal({
    projectId,
    projectName,
    projectKey,
    isOpen,
    onClose
}: SubtaskModalProps) {
    const [items, setItems] = useState<BacklogItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

    // Editing state
    const [editingSubtask, setEditingSubtask] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{
        summary: string;
        description: string;
        priority: string;
        tags: string;
        severity: string;
    }>({
        summary: '',
        description: '',
        priority: '',
        tags: '',
        severity: ''
    });

    // Merging State
    const [selectedSubtasks, setSelectedSubtasks] = useState<Set<string>>(new Set());
    const [mergingSubtasks, setMergingSubtasks] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchBacklog();
            setSelectedSubtasks(new Set());
            setMergingSubtasks([]);
            setEditingSubtask(null);
        }
    }, [isOpen, projectId]);

    const fetchBacklog = async () => {
        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            const response = await fetch(
                `${apiUrl}/api/v1/backlog/project/${projectId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setItems(data.data || []);
                }
            } else {
                throw new Error('Failed to fetch backlog');
            }
        } catch (error) {
            console.error('Error fetching backlog:', error);
            ToastService.showError('Failed to load backlog items');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubtask = async (taskId: string) => {
        if (!confirm('Are you sure you want to delete this subtask?')) return;

        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            const response = await fetch(
                `${apiUrl}/api/v1/backlog/${taskId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.ok) {
                ToastService.showSuccess('Subtask deleted successfully');
                fetchBacklog();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to delete subtask');
            }
        } catch (error: any) {
            console.error('Error deleting subtask:', error);
            ToastService.showError(error.message || 'Failed to delete subtask');
        }
    };

    const toggleExpand = (taskId: string) => {
        const newExpanded = new Set(expandedTasks);
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId);
        } else {
            newExpanded.add(taskId);
        }
        setExpandedTasks(newExpanded);
    };

    const handleEditClick = (subtask: BacklogItem) => {
        setEditingSubtask(subtask.id);
        setEditForm({
            summary: subtask.summary,
            description: subtask.description || '',
            priority: subtask.priority || '',
            tags: subtask.tags ? subtask.tags.join(', ') : '',
            severity: subtask.severity || ''
        });
        setMergingSubtasks([]); // Ensure we are not in merge mode
    };

    const handleCancelEdit = () => {
        setEditingSubtask(null);
        setEditForm({ summary: '', description: '', priority: '', tags: '', severity: '' });
        setMergingSubtasks([]); // Cancel merge if active
    };

    const toggleSelectSubtask = (subtaskId: string) => {
        const newSelected = new Set(selectedSubtasks);
        if (newSelected.has(subtaskId)) {
            newSelected.delete(subtaskId);
        } else {
            newSelected.add(subtaskId);
        }
        setSelectedSubtasks(newSelected);
    };

    const handleMergeClick = () => {
        // Find selected items
        const selectedItems = items.filter(i => selectedSubtasks.has(i.id));
        if (selectedItems.length < 2) return;

        // Sort by ID (User rule: "sub task one to add sub task 3... laver one to big one")
        // Assuming lexical sort implies temporal creation order usually.
        selectedItems.sort((a, b) => a.id.localeCompare(b.id));

        const target = selectedItems[0];
        const sources = selectedItems.slice(1);

        // Concatenate data
        const combinedSummary = selectedItems.map(i => i.summary).join(' | ');
        const combinedDescription = selectedItems
            .map(i => i.description)
            .filter(d => d)
            .join('\n\n---\n\n');

        // Combine unique tags
        const allTags = new Set<string>();
        selectedItems.forEach(i => i.tags?.forEach(t => allTags.add(t)));

        // Setup Edit Form for Merge
        setEditingSubtask(target.id);
        setMergingSubtasks(sources.map(s => s.id));
        setEditForm({
            summary: combinedSummary,
            description: combinedDescription,
            priority: target.priority || '', // Keep primary priority by default
            tags: Array.from(allTags).join(', '),
            severity: target.severity || ''
        });
    };

    const handleUpdateSubtask = async (taskId: string) => {
        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            const tagsArray = editForm.tags.split(',').map(t => t.trim()).filter(t => t);

            const updates = {
                summary: editForm.summary,
                description: editForm.description,
                priority: editForm.priority || null,
                tags: tagsArray,
                severity: editForm.severity || null
            };

            let response;
            if (mergingSubtasks.length > 0) {
                // Perform Merge
                response = await fetch(
                    `${apiUrl}/api/v1/backlog/merge`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            target_item_id: taskId,
                            source_item_ids: mergingSubtasks,
                            updates: updates
                        })
                    }
                );
            } else {
                // Perform Standard Update
                response = await fetch(
                    `${apiUrl}/api/v1/backlog/${taskId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updates)
                    }
                );
            }

            if (response.ok) {
                ToastService.showSuccess(mergingSubtasks.length > 0 ? 'Subtasks combined successfully' : 'Subtask updated successfully');
                setEditingSubtask(null);
                setMergingSubtasks([]);
                setSelectedSubtasks(new Set()); // Clear selection
                fetchBacklog();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to update/merge subtask');
            }
        } catch (error: any) {
            console.error('Error updating subtask:', error);
            ToastService.showError(error.message || 'Failed to update subtask');
        }
    };

    // Group items: Parents (no parent_task_id) and Subtasks (have parent_task_id)
    const subtasksMap = items.reduce((acc, item) => {
        if (item.parent_task_id) {
            if (!acc[item.parent_task_id]) {
                acc[item.parent_task_id] = [];
            }
            acc[item.parent_task_id].push(item);
        }
        return acc;
    }, {} as Record<string, BacklogItem[]>);

    const parentTasks = items.filter(i => !i.parent_task_id && i.issue_type !== 'sub_task' && subtasksMap[i.id]?.length > 0);

    const getIssueTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'bug': return 'bg-red-100 text-red-800';
            case 'feature': return 'bg-purple-100 text-purple-800';
            case 'story': return 'bg-blue-100 text-blue-800';
            case 'sub_task': return 'bg-teal-100 text-teal-800';
            case 'change': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string | null) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'text-red-600';
            case 'medium': return 'text-yellow-600';
            case 'low': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/60 transition-opacity"
                onClick={onClose}
            ></div>

            <div className="flex items-center justify-center min-h-screen px-4 py-8">
                <div
                    className="relative bg-white rounded-xl shadow-2xl transform transition-all w-full max-w-6xl max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Sub Tasks
                            </h2>
                            <p className="text-sm text-gray-600 mt-1 ml-10">
                                <span className="font-semibold text-gray-900">{projectName}</span> ({projectKey})
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50/50">
                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : parentTasks.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                                <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">No Backlog Items</h3>
                                <p className="mt-2 text-gray-500">This project has no backlog items yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {parentTasks.map((task) => {
                                    const subtasks = subtasksMap[task.id] || [];
                                    const isExpanded = expandedTasks.has(task.id);

                                    return (
                                        <div key={task.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden transition-all duration-200">
                                            {/* Parent Task Header */}
                                            <div
                                                className={`p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50 border-b border-gray-100' : ''}`}
                                                onClick={() => toggleExpand(task.id)}
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <button
                                                        className={`p-1 rounded hover:bg-gray-200 text-gray-500 transition-transform duration-200 ${isExpanded ? 'transform rotate-90' : ''}`}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getIssueTypeColor(task.issue_type)}`}>
                                                                {task.issue_type}
                                                            </span>
                                                            <span className="text-sm font-mono text-gray-500">{task.id}</span>
                                                            {subtasks.length > 0 && (
                                                                <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-full font-medium">
                                                                    {subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-base font-semibold text-gray-900 truncate">{task.summary}</h3>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 text-sm text-gray-500 hidden md:flex">
                                                    {/* Merge Button if selections valid */}
                                                    {selectedSubtasks.size >= 2 && !editingSubtask && isExpanded && subtasks.some(s => selectedSubtasks.has(s.id)) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMergeClick();
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                            </svg>
                                                            Merge Selected
                                                        </button>
                                                    )}

                                                    <div className="flex items-center gap-1 min-w-[100px]">
                                                        {task.priority && (
                                                            <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                                                                {task.priority || 'No Priority'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 min-w-[120px]">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === 'done' ? 'bg-green-100 text-green-800' :
                                                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {task.status.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 min-w-[150px] truncate" title={task.assignee || 'Unassigned'}>
                                                        <span>👤 {task.assignee || 'Unassigned'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Subtasks List */}
                                            {isExpanded && (
                                                <div className="bg-gray-50/50 p-4 border-t border-gray-100 animate-fadeIn">
                                                    {subtasks.length > 0 ? (
                                                        <div className="space-y-4 pl-10">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subtasks</p>
                                                            {subtasks.sort((a, b) => {
                                                                const getSuffix = (id: string) => {
                                                                    const parts = id.split('-');
                                                                    const last = parts[parts.length - 1];
                                                                    return isNaN(Number(last)) ? Infinity : Number(last);
                                                                };
                                                                const suffA = getSuffix(a.id);
                                                                const suffB = getSuffix(b.id);

                                                                if (suffA !== Infinity && suffB !== Infinity) {
                                                                    return suffA - suffB;
                                                                }
                                                                return a.id.localeCompare(b.id);
                                                            }).map((subtask) => (
                                                                <div key={subtask.id} className={`bg-white p-4 rounded border shadow-sm transition-all ${selectedSubtasks.has(subtask.id) ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-200'}`}>
                                                                    {editingSubtask === subtask.id ? (
                                                                        <div className="space-y-3">
                                                                            {mergingSubtasks.length > 0 && (
                                                                                <div className="mb-2 p-2 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-100 flex items-center gap-2">
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                    </svg>
                                                                                    Merging with: {mergingSubtasks.join(', ')}
                                                                                </div>
                                                                            )}
                                                                            {/* Edit Form */}
                                                                            <div>
                                                                                <label className="block text-xs font-medium text-gray-700">Summary</label>
                                                                                <input
                                                                                    type="text"
                                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                                                    value={editForm.summary}
                                                                                    onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-xs font-medium text-gray-700">Description</label>
                                                                                <textarea
                                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                                                    rows={4}
                                                                                    value={editForm.description}
                                                                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                                                />
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <label className="block text-xs font-medium text-gray-700">Priority</label>
                                                                                    <select
                                                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                                                        value={editForm.priority}
                                                                                        onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                                                                                    >
                                                                                        <option value="">None</option>
                                                                                        <option value="high">High</option>
                                                                                        <option value="medium">Medium</option>
                                                                                        <option value="low">Low</option>
                                                                                    </select>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-xs font-medium text-gray-700">Severity</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                                                        value={editForm.severity}
                                                                                        onChange={(e) => setEditForm({ ...editForm, severity: e.target.value })}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-xs font-medium text-gray-700">Tags (comma separated)</label>
                                                                                <input
                                                                                    type="text"
                                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                                                                    value={editForm.tags}
                                                                                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                                                                                />
                                                                            </div>
                                                                            <div className="flex justify-end gap-2 pt-2">
                                                                                <button
                                                                                    onClick={handleCancelEdit}
                                                                                    className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleUpdateSubtask(subtask.id)}
                                                                                    className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                                                                                >
                                                                                    {mergingSubtasks.length > 0 ? 'Confirm Merge' : 'Save Changes'}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="flex items-start gap-3 flex-1">
                                                                                {/* Checkbox for merge selection */}
                                                                                <div className="pt-1">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                                                                                        checked={selectedSubtasks.has(subtask.id)}
                                                                                        onChange={(e) => {
                                                                                            e.stopPropagation();
                                                                                            toggleSelectSubtask(subtask.id);
                                                                                        }}
                                                                                    />
                                                                                </div>

                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-2 mb-2">
                                                                                        <span className="text-xs font-mono text-gray-500">{subtask.id}</span>
                                                                                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-teal-50 text-teal-700 rounded border border-teal-100">
                                                                                            SUB-TASK
                                                                                        </span>
                                                                                        {subtask.status && (
                                                                                            <span className={`px-1.5 py-0.5 text-[10px] rounded ${subtask.status === 'done' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                                                {subtask.status}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                    <h4 className="text-sm font-semibold text-gray-900 mb-1">{subtask.summary}</h4>

                                                                                    {subtask.description && (
                                                                                        <p className="text-sm text-gray-600 mb-2 whitespace-pre-line">{subtask.description}</p>
                                                                                    )}

                                                                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-2">
                                                                                        <div className="flex items-center gap-1">
                                                                                            <span className="font-medium text-gray-400">Priority:</span>
                                                                                            <span className={`${getPriorityColor(subtask.priority)} font-medium`}>{subtask.priority || 'None'}</span>
                                                                                        </div>

                                                                                        {/* Only show Severity if present */}
                                                                                        {subtask.severity && (
                                                                                            <div className="flex items-center gap-1">
                                                                                                <span className="font-medium text-gray-400">Severity:</span>
                                                                                                <span>{subtask.severity}</span>
                                                                                            </div>
                                                                                        )}

                                                                                        {subtask.tags && subtask.tags.length > 0 && (
                                                                                            <div className="flex items-center gap-1">
                                                                                                <span className="font-medium text-gray-400">Tags:</span>
                                                                                                <div className="flex flex-wrap gap-1">
                                                                                                    {subtask.tags.map((tag, idx) => (
                                                                                                        <span key={idx} className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                                                                                            {tag}
                                                                                                        </span>
                                                                                                    ))}
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <button
                                                                                onClick={() => handleEditClick(subtask)}
                                                                                className="ml-4 text-gray-400 hover:text-blue-600 transition-colors"
                                                                                title="Edit Subtask"
                                                                            >
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                </svg>
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDeleteSubtask(subtask.id);
                                                                                }}
                                                                                className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                                                                                title="Delete Subtask"
                                                                            >
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-6 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded">
                                                            No subtasks found for this item
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
