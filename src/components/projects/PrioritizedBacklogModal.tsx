'use client';

import { useState, useEffect } from 'react';
import { ToastService } from '@/lib/utils/toast.utils';

interface BacklogItem {
    backlog_id: string;
    rank: number;
    summary: string;
    description: string | null;
    issue_type: string;
    status: string;
    priority: string | null;
    assignee: string | null;
    story_points: number;
    sprint_id: number | null;
}

interface PrioritizedBacklogModalProps {
    projectId: number;
    projectName: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function PrioritizedBacklogModal({
    projectId,
    projectName,
    isOpen,
    onClose
}: PrioritizedBacklogModalProps) {
    const [items, setItems] = useState<BacklogItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchPrioritizedBacklog();
        }
    }, [isOpen, projectId]);

    const fetchPrioritizedBacklog = async () => {
        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            const response = await fetch(
                `${apiUrl}/api/v1/backlog-priority/projects/${projectId}/prioritized-backlog`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch prioritized backlog');
            }

            const data = await response.json();
            if (data.success) {
                setItems(data.data.items || []);
            }
        } catch (error) {
            console.error('Error fetching prioritized backlog:', error);
            ToastService.showError('Failed to load prioritized backlog items');
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            return;
        }

        const newItems = [...items];
        const draggedItem = newItems[draggedIndex];

        // Remove dragged item
        newItems.splice(draggedIndex, 1);

        // Insert at new position
        newItems.splice(dropIndex, 0, draggedItem);

        // Update ranks
        newItems.forEach((item, idx) => {
            item.rank = idx + 1;
        });

        setItems(newItems);
        setHasChanges(true);
        setDraggedIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleConfirm = async () => {
        setSaving(true);
        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            // Prepare updates
            const updates = items.map(item => ({
                backlog_id: item.backlog_id,
                new_rank: item.rank
            }));

            const response = await fetch(
                `${apiUrl}/api/v1/backlog-priority/projects/${projectId}/prioritized-backlog/update-ranks`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ updates })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update ranks');
            }

            const data = await response.json();
            if (data.success) {
                ToastService.showSuccess(`Successfully updated ${data.data.updated_count} item rank(s)!`);
                setHasChanges(false);
                // Close modal after a short delay to show the toast
                setTimeout(() => {
                    onClose();
                }, 1500);
            }
        } catch (error) {
            console.error('Error updating ranks:', error);
            ToastService.showError('Failed to update rankings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const getIssueTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'bug':
                return 'bg-red-100 text-red-800';
            case 'feature':
                return 'bg-purple-100 text-purple-800';
            case 'story':
                return 'bg-blue-100 text-blue-800';
            case 'change':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string | null) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'text-red-600';
            case 'medium':
                return 'text-yellow-600';
            case 'low':
                return 'text-green-600';
            default:
                return 'text-gray-600';
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
                    className="relative bg-white rounded-xl shadow-2xl transform transition-all w-full max-w-4xl max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Prioritized Backlog</h2>
                            <p className="text-sm text-gray-600 mt-1">{projectName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No prioritized items</h3>
                                <p className="mt-1 text-sm text-gray-500">This project has no prioritized backlog items with assigned sprints yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-blue-600 mb-4">💡 Drag and drop items to reorder priority</p>
                                {items.map((item, index) => (
                                    <div
                                        key={item.backlog_id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`border border-gray-200 rounded-lg p-4 transition-all cursor-move ${draggedIndex === index
                                            ? 'opacity-50 bg-gray-100'
                                            : 'hover:shadow-md bg-white hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Rank and Drag Handle */}
                                            <div className="flex flex-col items-center gap-1 pt-1">
                                                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                                                </svg>
                                                <span className="text-lg font-bold text-blue-600 min-w-[2rem] text-center">#{item.rank}</span>
                                            </div>

                                            {/* Item Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`px-2 py-1 text-xs font-medium rounded ${getIssueTypeColor(item.issue_type)}`}>
                                                                {item.issue_type}
                                                            </span>
                                                            <span className="text-xs text-gray-500">{item.backlog_id}</span>
                                                        </div>
                                                        <h4 className="text-sm font-medium text-gray-900 mb-1">{item.summary}</h4>
                                                        {item.description && (
                                                            <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                                    {item.priority && (
                                                        <span className={`font-medium ${getPriorityColor(item.priority)}`}>
                                                            {item.priority} Priority
                                                        </span>
                                                    )}
                                                    {item.assignee && (
                                                        <span>👤 {item.assignee}</span>
                                                    )}
                                                    {item.story_points > 0 && (
                                                        <span>📊 {item.story_points} pts</span>
                                                    )}
                                                    <span className="px-2 py-1 bg-gray-100 rounded">{item.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                        <div className="text-sm text-gray-600">
                            {hasChanges && (
                                <span className="text-yellow-600 font-medium">⚠️ You have unsaved changes</span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!hasChanges || saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Confirm Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
