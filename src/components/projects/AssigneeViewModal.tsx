'use client';

import { useState, useEffect } from 'react';
import { ToastService } from '@/lib/utils/toast.utils';
import { authApi } from '@/lib/api/auth.api';

interface BacklogItem {
    id: string; // From full backlog
    backlog_id?: string; // From prioritized backlog
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
    rank?: number;
}

interface User {
    user_id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    projects?: number[] | string[];
}

interface AssigneeViewModalProps {
    projectId: number;
    projectName: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function AssigneeViewModal({
    projectId,
    projectName,
    isOpen,
    onClose
}: AssigneeViewModalProps) {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<BacklogItem[]>([]);
    const [subtaskMap, setSubtaskMap] = useState<Map<string, BacklogItem[]>>(new Map());
    const [users, setUsers] = useState<User[]>([]);
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

    // Automation Approval State
    const [sprintId, setSprintId] = useState<number | null>(null);
    const [automationApproval, setAutomationApproval] = useState<any>(null);

    // Assignment UI
    const [assigningTask, setAssigningTask] = useState<string | null>(null); // Task ID being assigned
    const [searchUser, setSearchUser] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchSprints();
            fetchData();
        }
    }, [isOpen, projectId]);

    const fetchSprints = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/v1/projects/${projectId}/sprints`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.sprints && data.data.sprints.length > 0) {
                    const sprints = data.data.sprints;
                    const activeSprint = sprints.find((s: any) => s.sprint_status === 'Active') || sprints[0];
                    if (activeSprint) {
                        setSprintId(activeSprint.sprint_id);
                        fetchAutomationApproval(activeSprint.sprint_id);
                    }
                } else {
                    console.warn(`No sprints found for project ${projectId}. Automation features may be disabled.`);
                }
            }
        } catch (error) {
            console.error('Error fetching sprints:', error);
        }
    };

    const fetchAutomationApproval = async (sid: number) => {
        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(
                `${apiUrl}/api/v1/backlog-priority/projects/${projectId}/sprints/${sid}/automation-approval`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setAutomationApproval(data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching automation approval:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            // 1. Fetch Prioritized Items (for order)
            const prioritizedRes = await fetch(
                `${apiUrl}/api/v1/backlog-priority/projects/${projectId}/prioritized-backlog`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            // 2. Fetch Full Backlog (for subtasks and details)
            const fullBacklogRes = await fetch(
                `${apiUrl}/api/v1/backlog/project/${projectId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            // 3. Fetch All Users (then filter by project)
            const usersRes = await fetch(
                `${apiUrl}/api/v1/users`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (prioritizedRes.ok && fullBacklogRes.ok) {
                const prioData = await prioritizedRes.json();
                const fullData = await fullBacklogRes.json();

                const prioritizedList = prioData.success ? (prioData.data.items || []) : [];
                const fullList = fullData.success ? (fullData.data || []) : [];

                // Process Data
                // Create a map of full items for easy lookup
                const fullItemMap = new Map(fullList.map((i: any) => [i.id, i]));

                // Identify Subtasks and build Map
                const newSubtaskMap = new Map<string, BacklogItem[]>();
                fullList.forEach((item: any) => {
                    if (item.parent_task_id) {
                        const pid = item.parent_task_id;
                        if (!newSubtaskMap.has(pid)) newSubtaskMap.set(pid, []);
                        newSubtaskMap.get(pid)?.push(item);
                    }
                });
                setSubtaskMap(newSubtaskMap);

                // Build Final List based on Priority Rank
                const finalList: BacklogItem[] = [];

                // First add prioritized items that exist in full backlog as Parents
                prioritizedList.forEach((pItem: any) => {
                    const fullItem = fullItemMap.get(pItem.backlog_id);
                    if (fullItem) {
                        finalList.push({
                            ...(fullItem as BacklogItem),
                            rank: pItem.rank
                        });
                    }
                });

                setItems(finalList);
            }

            // Process Users
            if (usersRes.ok) {
                const usersResponse = await usersRes.json();
                let usersList: any[] = [];
                if (usersResponse.success && usersResponse.data && Array.isArray(usersResponse.data.users)) {
                    usersList = usersResponse.data.users;
                } else if (Array.isArray(usersResponse.data)) {
                    usersList = usersResponse.data;
                }

                // Filter users who belong to this project
                const projectUsers = usersList.filter((u: any) => {
                    const isActive = u.status === 'ACTIVE';

                    // Check if user is assigned to this project
                    // Handle both string and number types in projects array
                    // Backend returns 'project_ids', checking 'projects' as fallback
                    const userProjects = u.project_ids || u.projects || [];
                    const isInProject = Array.isArray(userProjects) && userProjects.some((p: any) =>
                        String(p) === String(projectId)
                    );

                    return isActive && isInProject;
                });

                setUsers(projectUsers);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            ToastService.showError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAssignee = async (taskId: string, userId: string, userEmail: string) => {
        try {
            const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            const response = await fetch(
                `${apiUrl}/api/v1/backlog/${taskId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        assignee: userEmail
                    })
                }
            );

            if (response.ok) {
                ToastService.showSuccess(`Assigned to ${userEmail}`);
                fetchData(); // Refresh to ensure sync
                setAssigningTask(null);
            } else {
                throw new Error('Failed to update assignee');
            }
        } catch (error) {
            console.error('Assign error:', error);
            ToastService.showError('Failed to assign user');
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

    const handleApprove = async (field: 'assign_tasks', status: boolean) => {
        if (!sprintId) {
            ToastService.showError('No active sprint found');
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
                        [field]: status
                    })
                }
            );

            if (response.ok) {
                ToastService.showSuccess(status === false ? 'Approval revoked' : 'Automation approved successfully');
                fetchAutomationApproval(sprintId);
            } else {
                throw new Error('Failed to update approval');
            }
        } catch (error) {
            console.error('Error updating approval:', error);
            ToastService.showError('Failed to update automation approval');
        }
    };

    const assignLocked = !!automationApproval?.assign_tasks;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    const renderAssigneeModal = () => {
        if (!assigningTask) return null;

        const filteredUsers = users.filter(u =>
            u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
            (u.first_name + ' ' + (u.last_name || '')).toLowerCase().includes(searchUser.toLowerCase())
        );

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[1px]" onClick={() => setAssigningTask(null)}>
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-80 max-h-96 flex flex-col overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchUser}
                            onChange={e => setSearchUser(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredUsers.length > 0 ? filteredUsers.map(user => (
                            <button
                                key={user.user_id}
                                onClick={() => handleUpdateAssignee(assigningTask, user.user_id, user.email)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-blue-50 rounded-md transition-colors text-left group"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold group-hover:bg-blue-200">
                                    {getInitials(user.first_name || user.email)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                        {user.first_name} {user.last_name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                </div>
                            </button>
                        )) : (
                            <div className="text-center py-4 text-xs text-gray-400">No users found</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/60 transition-opacity backdrop-blur-sm" onClick={onClose}></div>
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col transform transition-all" onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-xl">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="text-2xl">📋</span> Assignee View
                            </h2>
                            <p className="text-sm text-gray-600 mt-1 pl-9">
                                Manage assignments and view hierarchy for <span className="font-semibold text-gray-900">{projectName}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={async () => {
                                    if (!assignLocked) {
                                        ToastService.showWarning('Please approve assignment automation first');
                                        return;
                                    }
                                    try {
                                        const token = JSON.parse(localStorage.getItem('auth-storage') || '{}').state.accessToken;
                                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

                                        ToastService.showInfo('Checking Jira status...');

                                        // Check Jira Status
                                        const statusRes = await fetch(`${apiUrl}/api/v1/jira/status`, {
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });

                                        if (statusRes.ok) {
                                            const statusData = await statusRes.json();
                                            if (statusData.data?.connected) {
                                                ToastService.showInfo('Syncing with Jira...');

                                                // Trigger Sync
                                                const syncRes = await fetch(
                                                    `${apiUrl}/api/v1/backlog-priority/projects/${projectId}/prioritized-backlog/update-ranks`,
                                                    {
                                                        method: 'PUT',
                                                        headers: {
                                                            'Authorization': `Bearer ${token}`,
                                                            'Content-Type': 'application/json'
                                                        },
                                                        body: JSON.stringify({ updates: [], sync_to_jira: true })
                                                    }
                                                );

                                                if (syncRes.ok) {
                                                    ToastService.showSuccess('Synced successfully! reloading...');
                                                    setTimeout(() => window.location.reload(), 1500);
                                                } else {
                                                    throw new Error('Sync failed');
                                                }
                                            } else {
                                                ToastService.showError('Jira not connected');
                                            }
                                        } else {
                                            throw new Error('Failed to check status');
                                        }
                                    } catch (e) {
                                        console.error('Sync error:', e);
                                        ToastService.showError('Failed to sync to Jira');
                                    }
                                }}
                                disabled={!assignLocked}
                                className={`px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors flex items-center gap-2 ${!assignLocked ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-blue-600 hover:bg-blue-700'}`}
                                title={!assignLocked ? 'Approve assignment to enable' : ''}
                            >
                                <span>🔄</span> Confirm Tasks
                            </button>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50/50">
                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-500 text-lg">No prioritized items found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item) => {
                                    const itemSubtasks = subtaskMap.get(item.id) || [];
                                    const isExpanded = expandedTasks.has(item.id);

                                    return (
                                        <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                            {/* Parent Row */}
                                            <div className="flex items-center p-4 gap-4 bg-white group">
                                                {/* Rank */}
                                                <div className="flex flex-col items-center justify-center w-12 h-12 bg-purple-50 text-purple-700 rounded-lg font-bold text-lg border border-purple-100">
                                                    #{item.rank}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 uppercase tracking-wider">
                                                            {item.issue_type}
                                                        </span>
                                                        <span className="text-xs font-mono text-gray-400">{item.id}</span>
                                                        {itemSubtasks.length > 0 && (
                                                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-full">
                                                                {itemSubtasks.length} subtasks
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-base font-semibold text-gray-900 truncate pr-4">{item.summary}</h3>
                                                </div>

                                                {/* Parent Assignee */}
                                                <div className="flex flex-col items-end min-w-[150px]">
                                                    <button
                                                        onClick={() => {
                                                            if (!assignLocked) {
                                                                setAssigningTask(item.id);
                                                                setSearchUser('');
                                                            }
                                                        }}
                                                        disabled={assignLocked}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all group/assignee ${assignLocked ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-80' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${item.assignee ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                                                            {item.assignee ? getInitials(item.assignee) : '?'}
                                                        </div>
                                                        <span className={`text-sm max-w-[100px] truncate ${item.assignee ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                                            {item.assignee || 'Unassigned'}
                                                        </span>
                                                        <svg className={`w-3 h-3 text-gray-400 ${!assignLocked && 'group-hover/assignee:text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    </button>
                                                </div>

                                                {/* Expand Toggle */}
                                                <button
                                                    onClick={() => toggleExpand(item.id)}
                                                    className={`p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all ${isExpanded ? 'bg-gray-100 text-gray-900' : ''}`}
                                                    title={isExpanded ? "Collapse" : "Expand"}
                                                >
                                                    <svg className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </button>
                                            </div>

                                            {/* Subtasks */}
                                            {isExpanded && (
                                                <div className="bg-gray-50/50 border-t border-gray-100 pl-16 pr-4 py-3 space-y-2 animate-fadeIn">
                                                    {itemSubtasks.length > 0 ? itemSubtasks.map(sub => (
                                                        <div key={sub.id} className="flex items-center gap-4 p-3 bg-white rounded-md border border-gray-200 hover:border-gray-300 transition-colors">
                                                            <div className="flex-1 min-w-0 flex items-center gap-3">
                                                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-teal-50 text-teal-700 rounded border border-teal-100 uppercase">
                                                                    Subtask
                                                                </span>
                                                                <span className="text-sm text-gray-700 truncate">{sub.summary}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className={`text-xs px-2 py-1 rounded ${sub.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{sub.status}</span>

                                                                {/* Subtask Assignee */}
                                                                <button
                                                                    onClick={() => {
                                                                        if (!assignLocked) {
                                                                            setAssigningTask(sub.id);
                                                                            setSearchUser('');
                                                                        }
                                                                    }}
                                                                    disabled={assignLocked}
                                                                    className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${assignLocked ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-100'}`}
                                                                >
                                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${sub.assignee ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-400'}`}>
                                                                        {sub.assignee ? getInitials(sub.assignee) : '?'}
                                                                    </div>
                                                                    <span className={`text-xs max-w-[80px] truncate ${sub.assignee ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                                                        {sub.assignee || 'Assign'}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="text-center py-2 text-sm text-gray-400 italic">No subtasks</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer Added for Approval */}
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white rounded-b-xl">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Assign Automation</span>
                            <div className="flex items-center gap-2 mt-1">
                                {assignLocked ? (
                                    <button
                                        onClick={() => handleApprove('assign_tasks', false)}
                                        className="px-3 py-1 text-xs font-semibold text-gray-700 bg-yellow-100 border border-yellow-300 rounded hover:bg-yellow-200 transition-colors flex items-center gap-1.5"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Change Assign
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleApprove('assign_tasks', true)}
                                        className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        Approve Assign
                                    </button>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-all shadow-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
            {renderAssigneeModal()}
        </div>
    );
}
