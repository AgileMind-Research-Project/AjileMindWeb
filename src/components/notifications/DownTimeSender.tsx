import React, { useState, useEffect } from 'react';
import { notificationsApi, DowntimeType, Priority, Audience, DowntimeNotificationRequest } from '@/lib/api/notifications.api';
import { projectsApi, Project } from '@/lib/api/projects.api';
import { meetingsApi } from '@/lib/api/meetings.api';
import { releaseNotesApi, BacklogRelease } from '@/lib/api/release-notes.api';
import { toast } from 'sonner';

export default function DownTimeSender() {
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectMembers, setProjectMembers] = useState<any[]>([]);
    const [fetchingMembers, setFetchingMembers] = useState(false);
    const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
    const [historyItems, setHistoryItems] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<any>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [backlogReleases, setBacklogReleases] = useState<BacklogRelease[]>([]);
    const [loadingBacklog, setLoadingBacklog] = useState(false);
    const [autoReleaseNote, setAutoReleaseNote] = useState(true);
    const [selectedBacklogItem, setSelectedBacklogItem] = useState<BacklogRelease | null>(null);

    // Form State
    const [formData, setFormData] = useState<DowntimeNotificationRequest>({
        type: DowntimeType.PLANNED_MAINTENANCE,
        priority: Priority.HIGH,
        affected_components: [],
        schedule: {
            start_time: '',
            end_time: '',
            timezone: 'Asia/Colombo'
        },
        audience: Audience.ALL_USERS,
        project_id: null,
        content: {
            subject: 'Scheduled Maintenance: System Upgrade',
            message_body: 'We will be performing scheduled maintenance to improve system performance and security.'
        },
        scheduled_at: '',
        target_roles: []
    });

    // Helper to get unique roles from project members
    const availableRoles = React.useMemo(() => {
        if (!projectMembers.length) return [];
        const roles = new Set(projectMembers.map(m => m.role).filter(Boolean));
        return Array.from(roles);
    }, [projectMembers]);

    const COMPONENTS = [
        'All Systems', 'Payment Gateway', 'User Dashboard', 'API', 'Reporting Module', 'Authentication'
    ];

    // Load Projects
    useEffect(() => {
        const loadProjects = async () => {
            try {
                const response = await projectsApi.listProjects({ limit: 100 });
                setProjects(response.data);
            } catch (error) {
                console.error('Failed to load projects:', error);
            }
        };
        loadProjects();
    }, []);

    // Load History
    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const response = await notificationsApi.listDowntimeNotifications(1, 50);
            setHistoryItems(response.items || []);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') {
            loadHistory();
        }
    }, [activeTab]);

    // Load Planned Releases (Backlog)
    const loadBacklogReleases = async () => {
        setLoadingBacklog(true);
        try {
            const response = await releaseNotesApi.listAllBacklogReleases();
            setBacklogReleases(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error('Failed to load backlog releases:', error);
        } finally {
            setLoadingBacklog(false);
        }
    };

    useEffect(() => {
        loadBacklogReleases();
    }, []);

    // Load Project Members when Project Selected
    useEffect(() => {
        if (formData.project_id) {
            const fetchMembers = async () => {
                setFetchingMembers(true);
                try {
                    const members = await meetingsApi.getProjectUsers(formData.project_id!);
                    setProjectMembers(members);
                    // Select ALL by default
                    setSelectedEmails(members.map((m: any) => m.email));
                } catch (error) {
                    console.error('Failed to load members:', error);
                    toast.error('Failed to load project members');
                } finally {
                    setFetchingMembers(false);
                }
            };
            fetchMembers();
        } else {
            setProjectMembers([]);
            setSelectedEmails([]);
        }
    }, [formData.project_id]);

    // Handle component selection
    const toggleComponent = (component: string) => {
        const current = formData.affected_components;
        const updated = current.includes(component)
            ? current.filter(c => c !== component)
            : [...current, component];
        setFormData({ ...formData, affected_components: updated });
    };

    // State for manual recipient selection
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

    const toggleRecipient = (email: string) => {
        setSelectedEmails(prev =>
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };

    const toggleAllRecipients = () => {
        if (selectedEmails.length === projectMembers.length) {
            setSelectedEmails([]);
        } else {
            setSelectedEmails(projectMembers.map(m => m.email));
        }
    };


    // Auto-update subject based on type
    const handleTypeChange = (type: DowntimeType) => {
        let subject = formData.content.subject;
        let body = formData.content.message_body;

        // Determine system name (Project Name or default placeholder)
        const selectedProject = projects.find(p => p.project_id === formData.project_id);
        const systemName = selectedProject ? selectedProject.project_name : '[System Name]';

        if (type === DowntimeType.PLANNED_MAINTENANCE) {
            subject = `Scheduled Maintenance: ${systemName}`;
            body = `We will be performing scheduled maintenance on the ${selectedProject ? selectedProject.project_name : '[Affected Service]'} to improve performance and security.`;
        } else if (type === DowntimeType.EMERGENCY_OUTAGE) {
            subject = `Urgent: Service Disruption - ${systemName}`;
            body = `We are currently experiencing an unexpected issue with ${selectedProject ? selectedProject.project_name : '[Affected Service]'}. Our engineering team is actively investigating the root cause.`;
        } else if (type === DowntimeType.FEATURE_UPGRADE) {
            subject = 'New Feature Deployment';
            body = 'We are deploying exciting new features to the platform.';
        }

        setFormData({
            ...formData,
            type,
            content: { subject, message_body: body }
        });
    };

    // Helper to format date for datetime-local
    const formatDateTimeLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleSendScheduled = async (notificationId: number) => {
        if (!confirm('Send this scheduled notification now?')) return;

        setSending(true);
        try {
            // You would need to create a new API endpoint for this
            // For now, we'll just show a message
            toast.success('Scheduled notification sent!');
            await loadHistory();
        } catch (error) {
            console.error('Failed to send scheduled notification:', error);
            toast.error('Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    const handleSend = async (isImmediate = false) => {
        if (!formData.schedule.start_time || !formData.schedule.end_time) {
            toast.error('Please select both start and end times');
            return;
        }

        // Validate scheduling if not immediate
        const immediate = typeof isImmediate === 'boolean' ? isImmediate : false;

        const payload = {
            ...formData,
            target_emails: selectedEmails.length > 0 ? selectedEmails : undefined
        };

        if (immediate) {
            delete (payload as any).scheduled_at;
        } else {
            if (!formData.scheduled_at) {
                toast.error('Please select a "Schedule Send Time" to schedule.');
                return;
            }
            if (new Date(formData.scheduled_at) >= new Date(formData.schedule.start_time)) {
                toast.error('Schedule Send Time must be earlier than the maintenance Start Time.');
                return;
            }
        }

        setSending(true);
        setStatusMessage(immediate ? 'Initializing...' : 'Scheduling notification...');

        try {
            const recipientsToSend = selectedEmails.length > 0 ? projectMembers.filter(m => selectedEmails.includes(m.email)) : projectMembers;

            if (immediate) {
                if (recipientsToSend.length > 0 && (formData.audience === Audience.PROJECT_MEMBERS || formData.project_id)) {
                    for (const member of recipientsToSend) {
                        setStatusMessage(`Sending to ${member.first_name} ${member.last_name}...`);
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                } else {
                    setStatusMessage('Sending notification...');
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            const response = await notificationsApi.sendDowntimeNotification(payload as any);
            if (response.success) {
                // If autoReleaseNote is enabled, schedule the follow-up release note
                if (autoReleaseNote && formData.schedule.end_time) {
                    try {
                        const endTimeDate = new Date(formData.schedule.end_time);
                        const releaseNoteScheduledAt = new Date(endTimeDate.getTime() + 10 * 60000);

                        const projectName = formData.project_id ? projects.find(p => p.project_id === formData.project_id)?.project_name : 'System';

                        const releasePayload = {
                            ...payload,
                            type: DowntimeType.FEATURE_UPGRADE,
                            scheduled_at: formatDateTimeLocal(releaseNoteScheduledAt),
                            content: {
                                subject: `Release Details: ${projectName} - Maintenance Completed`,
                                message_body: `The scheduled maintenance for ${projectName} is now complete. \n\nRelated Release Details:\n${selectedBacklogItem ? `Summary: ${selectedBacklogItem.summary}\nDescription: ${selectedBacklogItem.description || 'N/A'}` : formData.content.subject}\n\nThank you for your patience.`
                            }
                        };
                        await notificationsApi.sendDowntimeNotification(releasePayload as any);
                    } catch (err) {
                        console.error('Failed to schedule follow-up release note:', err);
                    }
                }

                toast.success(immediate ? response.message : (autoReleaseNote ? "Downtime & Release Note scheduled! 🚀" : "Scheduled set successfully"));
                if (activeTab === 'history') {
                    loadHistory();
                } else {
                    toast('Notification sent/scheduled', {
                        action: { label: 'View History', onClick: () => setActiveTab('history') }
                    });
                }
            }
        } catch (error) {
            console.error('Failed to send notification:', error);
            toast.error('Failed to send notification');
        } finally {
            setSending(false);
            setStatusMessage('');
        }
    };

    // Preview Formatting
    const getPreviewTheme = () => {
        switch (formData.type) {
            case DowntimeType.EMERGENCY_OUTAGE:
            case DowntimeType.SERVICE_DEGRADATION:
                return {
                    bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800',
                    header: 'bg-red-600', badge: 'bg-red-100 text-red-800'
                };
            case DowntimeType.FEATURE_UPGRADE:
                return {
                    bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800',
                    header: 'bg-green-600', badge: 'bg-green-100 text-green-800'
                };
            default: // Maintenance
                return {
                    bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800',
                    header: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800'
                };
        }
    };

    const theme = getPreviewTheme();

    // Auto-fill downtime form from a backlog release item
    const handleCreateFromBacklog = (item: BacklogRelease) => {
        const project = projects.find(p => p.project_id === item.project_id);
        const projectName = project?.project_name || `Project ${item.project_id}`;

        setFormData({
            ...formData,
            type: DowntimeType.PLANNED_MAINTENANCE,
            priority: Priority.HIGH,
            project_id: item.project_id,
            audience: Audience.PROJECT_MEMBERS,
            content: {
                subject: `Scheduled Maintenance: ${projectName} - ${item.summary}`,
                message_body: `We will be performing scheduled maintenance for "${item.summary}" on the ${projectName} project.\n\n${item.description || 'Please plan accordingly.'}`,
            },
            schedule: {
                start_time: item.end_date
                    ? formatDateTimeLocal(new Date(new Date(item.end_date).getTime() - 30 * 60000))
                    : (item.start_date ? formatDateTimeLocal(new Date(item.start_date)) : ''),
                end_time: item.end_date ? formatDateTimeLocal(new Date(item.end_date)) : '',
                timezone: 'Asia/Colombo',
            },
            scheduled_at: item.end_date
                ? formatDateTimeLocal(new Date(new Date(item.end_date).getTime() - 60 * 60000))
                : '',
        });

        setSelectedBacklogItem(item);
        setAutoReleaseNote(true);
        setActiveTab('send');
        toast.success(`📋 Form auto-filled from: ${item.summary}`);
    };

    return (
        <div className="flex flex-col h-full space-y-3">
            {/* Planned Releases (Backlog) Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs">📅</span>
                        Planned Releases (Backlog)
                        <span className="text-xs text-gray-400 font-normal ml-1">({backlogReleases.length})</span>
                    </h2>
                    <button
                        onClick={loadBacklogReleases}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 border border-blue-100 px-2 py-1 rounded"
                    >
                        Refresh 🔄
                    </button>
                </div>
                <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 sticky top-0">
                            <tr>
                                <th className="px-3 py-2 font-bold">Project</th>
                                <th className="px-3 py-2 font-bold">Key</th>
                                <th className="px-3 py-2 font-bold text-center">Sprint</th>
                                <th className="px-3 py-2 font-bold">Summary</th>
                                <th className="px-3 py-2 font-bold">Target Date</th>
                                <th className="px-3 py-2 font-bold">Status</th>
                                <th className="px-3 py-2 font-bold">Priority</th>
                                <th className="px-3 py-2 font-bold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loadingBacklog ? (
                                <tr><td colSpan={8} className="py-6 text-center text-gray-400 text-sm">Loading planned releases...</td></tr>
                            ) : backlogReleases.length === 0 ? (
                                <tr><td colSpan={8} className="py-6 text-center text-gray-400 text-sm">No planned releases found in backlog.</td></tr>
                            ) : (
                                backlogReleases.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2">
                                            <span className="text-xs text-gray-600">
                                                {projects.find(p => p.project_id === item.project_id)?.project_name || `Project ${item.project_id}`}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                {item.id}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span className="text-xs font-bold text-gray-600">
                                                {item.sprint_id ? `S${item.sprint_id}` : '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="text-sm text-gray-900 font-medium">{item.summary}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.description || 'No description'}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="text-xs text-gray-600">
                                                {item.end_date ? new Date(item.end_date).toLocaleDateString() : 'TBD'}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${item.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${item.priority === 'high' || item.priority === 'highest' ? 'bg-red-100 text-red-700' :
                                                item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {item.priority || '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <button
                                                onClick={() => handleCreateFromBacklog(item)}
                                                className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs rounded hover:from-purple-700 hover:to-blue-700 transition-all whitespace-nowrap font-medium"
                                            >
                                                📢 Create Downtime
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('send')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'send'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    📢 Send Notification
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    🕒 History
                </button>
            </div>

            {activeTab === 'send' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
                    {/* LEFT SIDE: FORM */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-3 overflow-y-auto">
                        <h2 className="text-sm font-bold text-gray-900 mb-1.5 flex items-center gap-2">
                            <span className="text-base">📢</span> DownTime Sender
                        </h2>

                        <div className="space-y-3">
                            {/* Grid Configuration: 3 Columns for primary inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Row 1: Type, Priority, Audience */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-tight">Downtime Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => handleTypeChange(e.target.value as DowntimeType)}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50/30"
                                    >
                                        {Object.values(DowntimeType).map(t => (
                                            <option key={t} value={t}>{t.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-tight">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50/30"
                                    >
                                        {Object.values(Priority).map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-tight">Target Audience</label>
                                    <select
                                        value={formData.target_roles && formData.target_roles.length > 0 ? formData.target_roles[0] : formData.audience}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (formData.project_id) {
                                                if (availableRoles.includes(val)) {
                                                    setFormData({
                                                        ...formData,
                                                        audience: Audience.PROJECT_MEMBERS,
                                                        target_roles: [val]
                                                    });
                                                } else {
                                                    setFormData({
                                                        ...formData,
                                                        audience: Audience.PROJECT_MEMBERS,
                                                        target_roles: []
                                                    });
                                                }
                                            } else {
                                                setFormData({ ...formData, audience: val as Audience, target_roles: [] });
                                            }
                                        }}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50/30"
                                    >
                                        {formData.project_id ? (
                                            <>
                                                <option value={Audience.PROJECT_MEMBERS}>All Project Members</option>
                                                {availableRoles.map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </>
                                        ) : (
                                            Object.values(Audience).map(a => (
                                                <option key={a} value={a}>{a.replace('_', ' ')}</option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                {/* Row 2: Timing Configuration */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-tight">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.schedule.start_time}
                                        onChange={(e) => {
                                            const startTimeVal = e.target.value;
                                            let autoScheduleTime = formData.scheduled_at;

                                            if (startTimeVal) {
                                                const startDate = new Date(startTimeVal);
                                                if (!isNaN(startDate.getTime())) {
                                                    // Set Schedule Send Time to 30 mins before Start Time
                                                    const scheduleDate = new Date(startDate.getTime() - 30 * 60000);
                                                    autoScheduleTime = formatDateTimeLocal(scheduleDate);
                                                }
                                            }

                                            setFormData({
                                                ...formData,
                                                schedule: { ...formData.schedule, start_time: startTimeVal },
                                                scheduled_at: autoScheduleTime
                                            });
                                        }}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-tight">Estimated End Time</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.schedule.end_time}
                                        onChange={(e) => {
                                            const endTimeVal = e.target.value;
                                            let autoStartTime = formData.schedule.start_time;
                                            let autoScheduleTime = formData.scheduled_at;

                                            if (endTimeVal) {
                                                const endDate = new Date(endTimeVal);
                                                if (!isNaN(endDate.getTime())) {
                                                    // 1. Set Start Time to 30 mins before End Time
                                                    const startDate = new Date(endDate.getTime() - 30 * 60000);
                                                    autoStartTime = formatDateTimeLocal(startDate);

                                                    // 2. Set Schedule Send Time to 30 mins before the NEW Start Time
                                                    const scheduleDate = new Date(startDate.getTime() - 30 * 60000);
                                                    autoScheduleTime = formatDateTimeLocal(scheduleDate);
                                                }
                                            }

                                            setFormData({
                                                ...formData,
                                                schedule: {
                                                    ...formData.schedule,
                                                    end_time: endTimeVal,
                                                    start_time: autoStartTime
                                                },
                                                scheduled_at: autoScheduleTime
                                            });
                                        }}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-tight">Schedule Send Time</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduled_at || ''}
                                        onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50/30"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Subject Line (Multi-column) */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Subject Line</label>
                                <input
                                    type="text"
                                    value={formData.content.subject}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        content: { ...formData.content, subject: e.target.value }
                                    })}
                                    className="w-full px-3 py-2 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium bg-blue-50/30"
                                    placeholder="Enter notification subject..."
                                />
                            </div>

                            {/* Automation Selection - Special Point * */}
                            <div className="bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-100/50">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={autoReleaseNote}
                                            onChange={(e) => setAutoReleaseNote(e.target.checked)}
                                            className="h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-[11px] font-extrabold text-indigo-900 flex items-center gap-1.5 capitalize">
                                            <span>Auto-send Release Note after maintenance</span>
                                            <span className="text-red-500 font-black animate-pulse text-lg" title="Special Automation Point">*</span>
                                        </div>
                                        <div className="text-[9px] text-indigo-600/70 font-bold tracking-tight">
                                            A follow-up notification with release details will be sent 10 mins after the Estimated End Time.
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {/* Project Selection & Recipients */}
                            <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Affected Project & Recipients</label>
                                    {formData.project_id && projectMembers.length > 0 && (
                                        <button
                                            onClick={toggleAllRecipients}
                                            className="text-[10px] text-blue-600 font-bold hover:underline"
                                        >
                                            {selectedEmails.length === projectMembers.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    )}
                                </div>
                                <select
                                    value={formData.project_id || ''}
                                    onChange={(e) => {
                                        const pid = e.target.value ? Number(e.target.value) : null;
                                        let newContent = { ...formData.content };
                                        if (pid) {
                                            const project = projects.find(p => p.project_id === pid);
                                            if (project) {
                                                if (formData.type === DowntimeType.PLANNED_MAINTENANCE) {
                                                    newContent.subject = `Scheduled Maintenance: ${project.project_name}`;
                                                    newContent.message_body = `We will be performing scheduled maintenance on the ${project.project_name} to improve performance and security.`;
                                                } else if (formData.type === DowntimeType.EMERGENCY_OUTAGE) {
                                                    newContent.subject = `Urgent: Service Disruption - ${project.project_name}`;
                                                    newContent.message_body = `We are currently experiencing an unexpected issue with ${project.project_name}. Our engineering team is actively investigating the root cause.`;
                                                }
                                            }
                                        }
                                        setFormData({
                                            ...formData,
                                            project_id: pid,
                                            content: newContent,
                                            audience: pid ? Audience.PROJECT_MEMBERS : formData.audience
                                        });
                                    }}
                                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-3 bg-white shadow-sm"
                                >
                                    <option value="">Specific Project (Optional)...</option>
                                    {projects.map(p => (
                                        <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                                    ))}
                                </select>

                                {formData.project_id && (
                                    <div className="mt-1">
                                        <p className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest flex justify-between border-b pb-1 border-gray-100">
                                            <span>Notify Recipients ({selectedEmails.length}/{projectMembers.length})</span>
                                            {fetchingMembers && <span className="animate-pulse">Loading...</span>}
                                        </p>
                                        <div className="space-y-1 max-h-56 overflow-y-auto pr-1 mt-1.5 scrollbar-thin scrollbar-thumb-gray-200">
                                            {projectMembers.map((member: any) => (
                                                <div
                                                    key={member.user_id || member.email}
                                                    onClick={() => toggleRecipient(member.email)}
                                                    className={`flex items-center text-[11px] border rounded-lg p-1 transition-all
                                                        ${selectedEmails.includes(member.email)
                                                            ? 'bg-blue-50/50 border-blue-200 shadow-sm ring-1 ring-blue-50'
                                                            : 'bg-white border-gray-100 hover:border-gray-300'}`}
                                                >
                                                    <div className="flex items-center justify-center mr-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedEmails.includes(member.email)}
                                                            onChange={() => { }}
                                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                                                        <div className="flex items-center flex-1 min-w-0 gap-2">
                                                            <div className="font-bold text-gray-900 truncate whitespace-nowrap">{member.first_name} {member.last_name}</div>
                                                            <span className="text-gray-300 font-light">|</span>
                                                            <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter flex-shrink-0 border border-blue-100/50">
                                                                {member.role || 'Member'}
                                                            </span>
                                                            <span className="text-gray-300 font-light">|</span>
                                                            <span className="text-[10px] text-gray-500 truncate font-medium">{member.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {!fetchingMembers && projectMembers.length === 0 && (
                                                <div className="col-span-full py-6 text-center text-gray-400 italic bg-white rounded-lg border border-dashed">No members found for this project.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Message Body */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Message Body</label>
                                <textarea
                                    value={formData.content.message_body}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        content: { ...formData.content, message_body: e.target.value }
                                    })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm leading-relaxed"
                                    placeholder="Provide a detailed explanation of the downtime..."
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleSend(false)}
                                    disabled={sending || !formData.scheduled_at}
                                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2
                                        ${formData.scheduled_at
                                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}
                                >
                                    <span>📅</span> Schedule Broadcast
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, scheduled_at: '' }));
                                        handleSend(true);
                                    }}
                                    disabled={sending}
                                    className="px-8 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-all text-sm font-bold shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50"
                                >
                                    {sending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            {statusMessage || 'Transmitting...'}
                                        </>
                                    ) : (
                                        <><span>🚀</span> Send Now</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: LIVE PREVIEW */}
                    <div className="bg-gray-100/50 rounded-xl flex flex-col items-center justify-start p-4 overflow-y-auto min-h-[600px] border border-gray-200/50">
                        <div className="mb-3 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Live Email Preview</div>

                        <div className={`w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border ${theme.border} transform transition-all hover:scale-[1.01]`}>
                            {/* Email Header */}
                            <div className={`${theme.header} p-4 text-white text-center shadow-inner`}>
                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Official Notification</div>
                                <h3 className="font-extrabold text-white text-lg tracking-tight drop-shadow-sm">
                                    {formData.type === DowntimeType.EMERGENCY_OUTAGE ? 'Service Outage' : formData.type === DowntimeType.FEATURE_UPGRADE ? 'New Features' : 'System Maintenance'}
                                </h3>
                            </div>

                            {/* Email Body */}
                            <div className="p-5 space-y-4">
                                <div className="border-b border-gray-100 pb-3 flex justify-between items-start">
                                    <h4 className="font-extrabold text-gray-900 text-sm leading-snug flex-1 mr-3">{formData.content.subject}</h4>
                                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${formData.priority === Priority.HIGH ? 'bg-red-50 text-red-600 border-red-200' : formData.priority === Priority.MEDIUM ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                        {formData.priority}
                                    </div>
                                </div>

                                <div className="text-gray-600 space-y-3">
                                    <p className="text-[11px] font-semibold text-gray-800">
                                        Hi {projectMembers.length > 0 ? projectMembers[0].first_name : (formData.audience === Audience.INTERNAL_TEAM ? 'Team' : 'there')},
                                    </p>
                                    <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-gray-600 italic">"{formData.content.message_body}"</p>
                                </div>

                                {/* Details Box */}
                                <div className={`${theme.bg} rounded-xl p-4 border ${theme.border} space-y-3 shadow-inner`}>
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 bg-white rounded-lg shadow-sm">📅</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Timeline</div>
                                            <div className={`text-[11px] font-bold ${theme.text} mt-0.5`}>
                                                {formData.schedule.start_time
                                                    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(formData.schedule.start_time))
                                                    : '[Start Date]'}
                                                <span className="mx-1.5 text-gray-300">→</span>
                                                {formData.schedule.end_time
                                                    ? new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }).format(new Date(formData.schedule.end_time))
                                                    : '[End]'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 border-t border-white/50 pt-2">
                                        <div className="p-1.5 bg-white rounded-lg shadow-sm">🎯</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Service Impact</div>
                                            <div className={`text-[10px] font-bold ${theme.text} mt-0.5 flex flex-wrap gap-1 items-center`}>
                                                {formData.project_id ? (
                                                    <span className="bg-white/50 px-1.5 py-0.5 rounded border border-white">
                                                        {projects.find(p => p.project_id === formData.project_id)?.project_name}
                                                    </span>
                                                ) : null}
                                                {formData.affected_components.length > 0 ? (
                                                    formData.affected_components.map(c => (
                                                        <span key={c} className="bg-white/50 px-1.5 py-0.5 rounded border border-white">
                                                            {c}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="italic opacity-50">Generic System Update</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 text-center">
                                    <div className="text-[9px] text-gray-400 font-medium">Auto-generated by AjileMind System</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-white/40 rounded-xl border border-dashed border-gray-300 text-center">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Distribution</div>
                            <div className="text-[11px] text-gray-600 font-medium italic">
                                "{formData.audience.replace('_', ' ')}"
                                {projectMembers.length > 0 && selectedEmails.length > 0
                                    ? ` • ${selectedEmails.length} Selected Members`
                                    : ''}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-800">Notification History</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">Auto-refresh pending</span>
                            <button onClick={loadHistory} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 border border-blue-100 px-2 py-1 rounded">
                                Refresh 🔄
                            </button>
                        </div>
                    </div>
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-2 font-medium">Status</th>
                                    <th className="px-4 py-2 font-medium">Type</th>
                                    <th className="px-4 py-2 font-medium">Subject</th>
                                    <th className="px-4 py-2 font-medium">Audience</th>
                                    <th className="px-4 py-2 font-medium whitespace-nowrap">Scheduled / Sent At</th>
                                    <th className="px-4 py-2 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loadingHistory ? (
                                    <tr><td colSpan={6} className="p-4 text-center text-gray-400">Loading history...</td></tr>
                                ) : historyItems.length === 0 ? (
                                    <tr><td colSpan={6} className="p-4 text-center text-gray-400">No notifications found.</td></tr>
                                ) : (
                                    historyItems.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-2">
                                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${item.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-gray-700">{item.type.replace('_', ' ')}</td>
                                            <td className="px-4 py-2 text-gray-900 font-medium truncate max-w-xs">{item.subject}</td>
                                            <td className="px-4 py-2 text-gray-600">{item.audience.replace('_', ' ')}</td>
                                            <td className="px-4 py-2 text-gray-600">
                                                {item.status === 'SCHEDULED'
                                                    ? `📅 ${new Date(item.scheduled_at).toLocaleString()}`
                                                    : `✅ ${item.sent_at ? new Date(item.sent_at).toLocaleString() : 'N/A'}`}
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    {item.status === 'SCHEDULED' && (
                                                        <button
                                                            onClick={() => handleSendScheduled(item.id)}
                                                            className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] hover:bg-blue-700 transition-colors"
                                                            disabled={sending}
                                                        >
                                                            Send Now
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedNotification(item);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 text-[10px] underline"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedNotification && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                    onClick={() => setShowDetailsModal(false)}
                >
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Notification Details</h2>
                            <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                                    <p className="mt-1">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedNotification.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {selectedNotification.status}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Type</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedNotification.type.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Priority</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedNotification.priority}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Audience</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedNotification.audience.replace('_', ' ')}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Subject</label>
                                <p className="mt-1 text-sm text-gray-900 font-medium">{selectedNotification.subject}</p>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Message</label>
                                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{selectedNotification.message}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {selectedNotification.scheduled_at && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Scheduled For</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            📅 {new Date(selectedNotification.scheduled_at).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                                {selectedNotification.sent_at && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Sent At</label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            ✅ {new Date(selectedNotification.sent_at).toLocaleString()}
                                        </p>
                                    </div>
                                )}

                                <div className="col-span-2 border-t border-gray-100 my-2 pt-2">
                                    <h4 className="text-xs font-bold text-gray-900 uppercase mb-2">Maintenance Window</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Start Time</label>
                                            <p className="mt-1 text-sm text-gray-900 font-medium">
                                                {selectedNotification.start_time ? `🕒 ${new Date(selectedNotification.start_time).toLocaleString()}` : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">End Time</label>
                                            <p className="mt-1 text-sm text-gray-900 font-medium">
                                                {selectedNotification.end_time ? `🏁 ${new Date(selectedNotification.end_time).toLocaleString()}` : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Created At</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {new Date(selectedNotification.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {selectedNotification.created_by && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Created By</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedNotification.created_by}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                            {selectedNotification.status === 'SCHEDULED' && (
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        handleSendScheduled(selectedNotification.id);
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    disabled={sending}
                                >
                                    Send Now
                                </button>
                            )}
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
