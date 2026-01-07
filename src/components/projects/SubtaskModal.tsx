'use client';

import { useState, useEffect } from 'react';
import { ToastService } from '@/lib/utils/toast.utils';

interface BacklogItem {
    id: string; // The backend returns 'id', not 'backlog_id' in list_backlog_by_project usually, need to check Schema/Response
    project_id: number;
    summary: string;
    description: string | null;
    issue_type: string;
    status: string;
    priority: string | null;
    assignee: string | null;
    story_points: number;
    parent_task_id: string | null;
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

    useEffect(() => {
        if (isOpen) {
            fetchBacklog();
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

    const toggleExpand = (taskId: string) => {
        const newExpanded = new Set(expandedTasks);
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId);
        } else {
            newExpanded.add(taskId);
        }
        setExpandedTasks(newExpanded);
    };

    // Group items: Parents (no parent_task_id) and Subtasks (have parent_task_id)
    const parentTasks = items.filter(i => !i.parent_task_id);
    const subtasksMap = items.reduce((acc, item) => {
        if (item.parent_task_id) {
            if (!acc[item.parent_task_id]) {
                acc[item.parent_task_id] = [];
            }
            acc[item.parent_task_id].push(item);
        }
        return acc;
    }, {} as Record<string, BacklogItem[]>);

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
                                                className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50 border-b border-gray-100' : ''}`}
                                                onClick={() => toggleExpand(task.id)}
                                            >
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

                                                <div className="flex items-center gap-6 text-sm text-gray-500 hidden md:flex">
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
                                                        <div className="space-y-3 pl-10">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subtasks</p>
                                                            {subtasks.map((subtask) => (
                                                                <div key={subtask.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm flex items-center justify-between hover:border-blue-300 transition-colors">
                                                                    <div className="flex items-center gap-4">
                                                                        <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className="text-xs font-mono text-gray-500">{subtask.id}</span>
                                                                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-teal-50 text-teal-700 rounded border border-teal-100">
                                                                                    SUB-TASK
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-sm font-medium text-gray-900">{subtask.summary}</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-4 text-xs">
                                                                        <span className={`px-1.5 py-0.5 rounded ${subtask.status === 'done' ? 'bg-green-50 text-green-700' :
                                                                                'bg-gray-100 text-gray-600'
                                                                            }`}>
                                                                            {subtask.status}
                                                                        </span>
                                                                        <span className="text-gray-500">{subtask.assignee || 'Unassigned'}</span>
                                                                    </div>
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
