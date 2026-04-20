'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { API_CONFIG } from '@/lib/config/api.config';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface BacklogItem {
    id: string;
    project_id: number;
    project_name?: string;
    project_key?: string;
    parent_summary?: string;
    parent_task_id?: string;
    summary: string;
    description?: string;
    issue_type: string;
    status: string;
    priority: string;
    assignee?: string;
    tags?: string[];
    severity?: string;
    created_at: string;
    is_jira: boolean;
}

export default function MyTasksPage() {
    const [tasks, setTasks] = useState<BacklogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
    useAuth();

    useEffect(() => {
        const fetchMyTasks = async () => {
            setLoading(true);
            setError(null);

            try {
                const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
                if (!token) {
                    setError('Please log in to view tasks');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_CONFIG.baseURL}/api/v1/backlog/my-tasks`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch tasks');
                }

                const data = await response.json();
                setTasks(data.data || []);
            } catch (err: any) {
                console.error('Error fetching tasks:', err);
                setError(err.message || 'Failed to load tasks');
            } finally {
                setLoading(false);
            }
        };

        fetchMyTasks();
    }, []);

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'done': return 'bg-green-100 text-green-800 border-green-200';
            case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'todo': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const filteredTasks = tasks.filter((task) => {
        if (selectedStatus === 'all') {
            return true;
        }
        return task.status?.toLowerCase() === selectedStatus;
    });

    // Group filtered tasks by project
    const groupedTasks = filteredTasks.reduce((acc, task) => {
        const key = task.project_name || `Project ${task.project_id}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
    }, {} as Record<string, BacklogItem[]>);

    const statusCounts = {
        all: tasks.length,
        todo: tasks.filter((task) => task.status?.toLowerCase() === 'todo').length,
        in_progress: tasks.filter((task) => task.status?.toLowerCase() === 'in_progress').length,
        done: tasks.filter((task) => task.status?.toLowerCase() === 'done').length,
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-full min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="p-6">
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6 space-y-8 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            View all tasks assigned to you across projects.
                        </p>
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
                        {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'} Assigned
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setSelectedStatus('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            selectedStatus === 'all'
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        All ({statusCounts.all})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedStatus('todo')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            selectedStatus === 'todo'
                                ? 'bg-gray-700 text-white border-gray-700'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        Todo ({statusCounts.todo})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedStatus('in_progress')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            selectedStatus === 'in_progress'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        In Progress ({statusCounts.in_progress})
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedStatus('done')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            selectedStatus === 'done'
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        Done ({statusCounts.done})
                    </button>
                </div>

                {filteredTasks.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found for this filter</h3>
                        <p className="mt-1 text-sm text-gray-500">Try selecting another status to view your assigned tasks.</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {Object.entries(groupedTasks).map(([projectName, projectTasks]) => (
                            <div key={projectName} className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-1 bg-indigo-500 rounded-full"></div>
                                    <h2 className="text-lg font-semibold text-gray-900">{projectName}</h2>
                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {projectTasks.length}
                                    </span>
                                </div>

                                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary & Context</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Type</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Priority</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Created</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {projectTasks.map((task) => (
                                                    <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap align-top">
                                                            <span className="font-mono text-sm font-medium text-gray-900">{task.id}</span>
                                                        </td>
                                                        <td className="px-6 py-4 align-top">
                                                            <div className="flex flex-col">
                                                                <div className="text-sm text-gray-900 font-medium">{task.summary}</div>
                                                                {task.parent_task_id && task.parent_summary && (
                                                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit" title="Parent Task">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                                        </svg>
                                                                        <span className="font-medium">{task.parent_task_id}: {task.parent_summary}</span>
                                                                    </div>
                                                                )}
                                                                {task.description && (
                                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-sm">{task.description}</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap align-top">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                                                {task.issue_type.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap align-top">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)} capitalize`}>
                                                                {task.status.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap align-top">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)} capitalize`}>
                                                                {task.priority || 'None'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                                                            {new Date(task.created_at).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
