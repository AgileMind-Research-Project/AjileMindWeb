'use client';

import { useState, useEffect } from 'react';
import { ToastService } from '@/lib/utils/toast.utils';

interface BacklogItem {
    backlog_id: string;
    rank?: number;
    summary: string;
    description: string | null;
    issue_type: string;
    status: string;
    priority: string | null;
    assignee: string | null;
    story_points: number;
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
    const [prioritizedItems, setPrioritizedItems] = useState<BacklogItem[]>([]);
    const [availableItems, setAvailableItems] = useState<BacklogItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'prioritized' | 'available'>('prioritized');
    const [sprintId, setSprintId] = useState<number | null>(null);
    const [automationApproval, setAutomationApproval] = useState<any>(null);
    const [addingItemId, setAddingItemId] = useState<string | null>(null);
    const [removingItemId, setRemovingItemId] = useState<string | null>(null);

    const isLocked = !!automationApproval?.backlog_prioritize;
    const canChangeApproval = isLocked && !automationApproval?.split_tasks && !automationApproval?.assign_tasks;


    const fetchBothLists = async () => {
        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            // Fetch prioritized items
            const prioritizedRes = await fetch(
                `${apiUrl}/api/v1/backlog-priority/projects/${projectId}/prioritized-backlog`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Fetch available items
            const availableRes = await fetch(
                `${apiUrl}/api/v1/backlog-priority/projects/${projectId}/available-backlog`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (prioritizedRes.ok) {
                const data = await prioritizedRes.json();
                if (data.success) {
                    setPrioritizedItems(data.data.items || []);
                }
            }

            if (availableRes.ok) {
                const data = await availableRes.json();
                if (data.success) {
                    setAvailableItems(data.data.items || []);
                }
            }
        } catch (error) {
            console.error('Error fetching backlog:', error);
            ToastService.showError('Failed to load backlog items');
        } finally {
            setLoading(false);
        }
    };

    const fetchAutomationApproval = async (sid: number) => {
        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(
                `${apiUrl}/api/v1/backlog-priority/projects/${projectId}/sprints/${sid}/automation-approval`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setAutomationApproval(data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching automation approval:', error);
        }
    };

    const fetchSprints = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(
                `${apiUrl}/api/v1/projects/${projectId}/sprints`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data.sprints.length > 0) {
                    // Find active sprint or latest
                    const sprints = data.data.sprints;
                    const activeSprint = sprints.find((s: any) => s.sprint_status === 'Active') || sprints[0];
                    setSprintId(activeSprint.sprint_id);
                    fetchAutomationApproval(activeSprint.sprint_id);
                }
            }
        } catch (error) {
            console.error('Error fetching sprints:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchBothLists();
            fetchSprints();
            setHasChanges(false); // Reset changes on open
        }
    }, [isOpen, projectId]);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        if (isLocked) return;
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
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

        const newItems = [...prioritizedItems];
        const draggedItem = newItems[draggedIndex];

        newItems.splice(draggedIndex, 1);
        newItems.splice(dropIndex, 0, draggedItem);

        newItems.forEach((item, idx) => {
            item.rank = idx + 1;
        });

        setPrioritizedItems(newItems);
        setHasChanges(true);
        setDraggedIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleAddToPriority = async (backlogId: string) => {
        setAddingItemId(backlogId);
        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            const response = await fetch(
                `${apiUrl}/api/v1/backlog-priority/projects/${projectId}/prioritized-backlog/add`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ backlog_id: backlogId })
                }
            );

            if (response.ok) {
                ToastService.showSuccess('Item added to priority list');
                fetchBothLists();
                // setHasChanges(true); // Removed: Add persists to DB immediately
            } else {
                throw new Error('Failed to add item');
            }
        } catch (error) {
            console.error('Error adding item:', error);
            ToastService.showError('Failed to add item to priority');
        } finally {
            setAddingItemId(null);
        }
    };

    const handleRemoveFromPriority = async (backlogId: string) => {
        setRemovingItemId(backlogId);
        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            const response = await fetch(
                `${apiUrl}/api/v1/backlog-priority/projects/${projectId}/prioritized-backlog/${backlogId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                ToastService.showSuccess('Item removed from priority list');
                fetchBothLists();
                // setHasChanges(true); // Removed: Remove persists to DB immediately
            } else {
                throw new Error('Failed to remove item');
            }
        } catch (error) {
            console.error('Error removing item:', error);
            ToastService.showError('Failed to remove item');
        } finally {
            setRemovingItemId(null);
        }
    };

    const handleConfirm = async () => {
        setSaving(true);
        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            // Check Jira Status
            let syncToJira = false;
            try {
                const statusRes = await fetch(`${apiUrl}/api/v1/jira/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    if (statusData.data?.connected) {
                        syncToJira = true;
                    }
                }
            } catch (e) {
                console.warn('Failed to check Jira status', e);
            }

            const updates = prioritizedItems.map(item => ({
                backlog_id: item.backlog_id,
                new_rank: item.rank
            }));

            // 1. Update Ranks (Don't sync here, we do it separate)
            const response = await fetch(
                `${apiUrl}/api/v1/backlog-priority/projects/${projectId}/prioritized-backlog/update-ranks`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ updates, sync_to_jira: false })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update ranks');
            }

            const data = await response.json();
            if (data.success) {
                const message = `Successfully updated ${data.data.updated_count} item rank(s)!`;
                ToastService.showSuccess(message);
                setHasChanges(false);
                onClose();
            }
        } catch (error) {
            console.error('Error updating ranks:', error);
            ToastService.showError('Failed to update rankings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = async (status: boolean = true) => {
        if (!sprintId) {
            ToastService.showError('No active sprint found to approve');
            return;
        }

        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            const response = await fetch(
                `${apiUrl}/api/v1/backlog-priority/projects/${projectId}/sprints/${sprintId}/automation-approval/approve`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        backlog_prioritize: typeof status === 'boolean' ? status : true
                    })
                }
            );

            if (response.ok) {
                ToastService.showSuccess(status === false ? 'Approval revoked' : 'Automation approved successfully');
                fetchAutomationApproval(sprintId);
                if (status === false) {
                    setHasChanges(false);
                }
            } else {
                throw new Error('Failed to approve');
            }
        } catch (error) {
            console.error('Error approving:', error);
            ToastService.showError('Failed to approve automation');
        }
    };

    const getIssueTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'bug': return 'bg-red-100 text-red-800';
            case 'feature': return 'bg-purple-100 text-purple-800';
            case 'story': return 'bg-blue-100 text-blue-800';
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

    const renderItem = (item: BacklogItem, index?: number, isPrioritized: boolean = false) => (
        <div
            key={item.backlog_id}
            draggable={isPrioritized && !isLocked}
            onDragStart={isPrioritized && !isLocked ? (e) => handleDragStart(e, index!) : undefined}
            onDragOver={isPrioritized ? handleDragOver : undefined}
            onDrop={isPrioritized ? (e) => handleDrop(e, index!) : undefined}
            onDragEnd={isPrioritized ? handleDragEnd : undefined}
            className={`border border-gray-200 rounded-lg p-4 transition-all ${isPrioritized ? 'cursor-move' : ''
                } ${draggedIndex === index
                    ? 'opacity-50 bg-gray-100'
                    : 'hover:shadow-md bg-white hover:border-blue-300'
                }`}
        >
            <div className="flex items-start gap-4">
                {isPrioritized && (
                    <div className="flex flex-col items-center gap-1 pt-1">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                        </svg>
                        <span className="text-lg font-bold text-blue-600 min-w-[2rem] text-center">#{item.rank}</span>
                    </div>
                )}

                <div className="flex-1 min-w-0">
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
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        {item.priority && (
                            <span className={`font-medium ${getPriorityColor(item.priority)}`}>
                                {item.priority} Priority
                            </span>
                        )}
                        {item.assignee && <span>👤 {item.assignee}</span>}
                        {item.story_points > 0 && <span>📊 {item.story_points} pts</span>}
                        <span className="px-2 py-1 bg-gray-100 rounded">{item.status}</span>
                    </div>
                </div>

                <div className="flex-shrink-0">
                    {isPrioritized ? (
                        <button
                            onClick={() => !isLocked && !removingItemId && handleRemoveFromPriority(item.backlog_id)}
                            disabled={isLocked || removingItemId === item.backlog_id}
                            className={`px-3 py-1.5 text-xs font-medium border rounded transition-colors flex items-center gap-1 ${isLocked || removingItemId === item.backlog_id ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-red-600 border-red-600 hover:bg-red-50'}`}
                            title={isLocked ? "Approval active - cannot remove" : "Remove from priority"}
                        >
                            {removingItemId === item.backlog_id ? (
                                <>
                                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Removing...
                                </>
                            ) : 'Remove'}
                        </button>
                    ) : (
                        <button
                            onClick={() => !isLocked && !addingItemId && handleAddToPriority(item.backlog_id)}
                            disabled={isLocked || addingItemId === item.backlog_id}
                            className={`px-3 py-1.5 text-xs font-medium border rounded transition-colors flex items-center gap-1 ${isLocked || addingItemId === item.backlog_id ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-blue-600 border-blue-600 hover:bg-blue-50'}`}
                            title={isLocked ? "Approval active - cannot add" : "Add to priority"}
                        >
                            {addingItemId === item.backlog_id ? (
                                <>
                                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Adding...
                                </>
                            ) : 'Add'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/60 transition-opacity"
                onClick={onClose}
            ></div>

            <div className="flex items-center justify-center min-h-screen px-4 py-8">
                <div
                    className="relative bg-white rounded-xl shadow-2xl transform transition-all w-full max-w-5xl max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Backlog Priority Manager</h2>
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

                    {/* Tabs */}
                    <div className="px-6 pt-4 border-b border-gray-200">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setActiveTab('prioritized')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'prioritized'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Prioritized ({prioritizedItems.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('available')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'available'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Available ({availableItems.length})
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : activeTab === 'prioritized' ? (
                            prioritizedItems.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No prioritized items</h3>
                                    <p className="mt-1 text-sm text-gray-500">Add items from the Available tab</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm text-blue-600 mb-4">
                                        {isLocked ? '🔒 Backlog is approved and locked. Revoke approval to make changes.' : '💡 Drag and drop items to reorder priority'}
                                    </p>
                                    {prioritizedItems.map((item, index) => renderItem(item, index, true))}
                                </div>
                            )
                        ) : (
                            availableItems.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">All items prioritized!</h3>
                                    <p className="mt-1 text-sm text-gray-500">No available items to add</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600 mb-4">Click "Add" to include items in priority list</p>
                                    {availableItems.map((item) => renderItem(item, undefined, false))}
                                </div>
                            )
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                        <div className="text-sm text-gray-600">
                            {hasChanges && activeTab === 'prioritized' && (
                                <span className="text-yellow-600 font-medium">⚠️ You have unsaved changes</span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            {activeTab === 'prioritized' && automationApproval && (
                                !automationApproval.backlog_prioritize ? (
                                    <button
                                        onClick={() => handleApprove(true)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Approve
                                    </button>
                                ) : (
                                    canChangeApproval && (
                                        <button
                                            onClick={() => handleApprove(false)}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 transition-colors shadow-sm flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            Change
                                        </button>
                                    )
                                )
                            )}
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                            {activeTab === 'prioritized' && (
                                <button
                                    onClick={handleConfirm}
                                    disabled={saving || !hasChanges || isLocked}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Processing...' : 'Confirm'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
