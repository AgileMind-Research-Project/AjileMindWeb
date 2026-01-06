import React, { useState, useEffect } from 'react';
import { notificationsApi, DowntimeType, Priority, Audience, DowntimeNotificationRequest } from '@/lib/api/notifications.api';
import { projectsApi, Project } from '@/lib/api/projects.api';
import { meetingsApi } from '@/lib/api/meetings.api';
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

    // Form State
    const [formData, setFormData] = useState<DowntimeNotificationRequest>({
        type: DowntimeType.PLANNED_MAINTENANCE,
        priority: Priority.HIGH,
        affected_components: [],
        schedule: {
            start_time: '',
            end_time: '',
            timezone: 'UTC'
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

    // Load Project Members when Project Selected
    useEffect(() => {
        if (formData.project_id) {
            const fetchMembers = async () => {
                setFetchingMembers(true);
                try {
                    const members = await meetingsApi.getProjectUsers(formData.project_id!);
                    setProjectMembers(members);
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

    const handleSend = async (isImmediate = false) => {
        if (!formData.schedule.start_time || !formData.schedule.end_time) {
            toast.error('Please select both start and end times');
            return;
        }
        if (formData.affected_components.length === 0) {
            toast.error('Please select at least one affected component');
            return;
        }

        // Validate scheduling if not immediate
        // Note: isImmediate might be the event object if called directly from onClick without args, so check type
        const immediate = typeof isImmediate === 'boolean' ? isImmediate : false;

        if (!immediate) {
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
        setStatusMessage('Initializing...');

        try {
            console.log("DEBUG: Preparing to send. Audience:", formData.audience, "Project:", formData.project_id, "Members:", projectMembers);

            // Simulate sending animation if we have members visible
            if (projectMembers.length > 0 && (formData.audience === Audience.PROJECT_MEMBERS || formData.project_id)) {
                for (const member of projectMembers) {
                    setStatusMessage(`Sending to mail (${member.first_name} ${member.last_name})...`);
                    // Artificial delay for the effect
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
            } else {
                setStatusMessage('Sending notification...');
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const payload = { ...formData };
            if (immediate) {
                delete payload.scheduled_at; // Ensure we don't send a schedule time for immediate sending
            }

            const response = await notificationsApi.sendDowntimeNotification(payload);
            if (response.success) {
                toast.success(response.message);
                if (activeTab === 'history') {
                    loadHistory();
                } else {
                    toast('Notification sent/scheduled', {
                        action: {
                            label: 'View History',
                            onClick: () => setActiveTab('history')
                        }
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

    return (
        <div className="flex flex-col h-full space-y-3">
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
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-y-auto">
                        <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-lg">📢</span> DownTime Sender
                        </h2>

                        <div className="space-y-2">
                            {/* Type & Priority */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Downtime Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => handleTypeChange(e.target.value as DowntimeType)}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    >
                                        {Object.values(DowntimeType).map(t => (
                                            <option key={t} value={t}>{t.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    >
                                        {Object.values(Priority).map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Affected Services */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Affected Services</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {COMPONENTS.map(comp => (
                                        <button
                                            key={comp}
                                            type="button"
                                            onClick={() => toggleComponent(comp)}
                                            className={`px-2 py-1 rounded-full text-[10px] font-medium border transition-colors
                                                ${formData.affected_components.includes(comp)
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                        >
                                            {comp}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.schedule.start_time}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            schedule: { ...formData.schedule, start_time: e.target.value }
                                        })}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Estimated End Time</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.schedule.end_time}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            schedule: { ...formData.schedule, end_time: e.target.value }
                                        })}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            {/* Project Selection */}
                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Affected Project (Optional)</label>
                                <select
                                    value={formData.project_id || ''}
                                    onChange={(e) => {
                                        const pid = e.target.value ? Number(e.target.value) : null;

                                        // Update content with project name if applicable
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
                                            // Auto-select audience if project selected
                                            audience: pid ? Audience.PROJECT_MEMBERS : formData.audience
                                        });
                                    }}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-2 text-sm"
                                >
                                    <option value="">Select a Project...</option>
                                    {projects.map(p => (
                                        <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                                    ))}
                                </select>

                                {/* Show Members */}
                                {formData.project_id && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 mb-2">
                                            Project Members ({projectMembers.length})
                                            {fetchingMembers && <span className="ml-2 font-normal animate-pulse">Loading...</span>}
                                        </p>
                                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                                            {projectMembers.map((member: any) => {
                                                const isSelected = formData.audience === Audience.PROJECT_MEMBERS &&
                                                    (!formData.target_roles || formData.target_roles.length === 0 || formData.target_roles.includes(member.role));

                                                return (
                                                    <div key={member.user_id || member.email}
                                                        className={`flex items-center text-xs border rounded-md p-2 transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
                                                    >
                                                        <div className={`w-4 h-4 mr-3 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                        </div>
                                                        <div className="flex items-center flex-1 min-w-0 gap-2">
                                                            <span className="font-medium text-gray-800 whitespace-nowrap">
                                                                {member.first_name} {member.last_name}
                                                            </span>
                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                                                {member.role}
                                                            </span>
                                                            <span className="text-gray-400 text-[10px] truncate">
                                                                {member.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {!fetchingMembers && projectMembers.length === 0 && (
                                                <span className="text-xs text-gray-400 italic top-1">No members found.</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Target Audience */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Target Audience</label>
                                    <select
                                        value={formData.target_roles && formData.target_roles.length > 0 ? formData.target_roles[0] : formData.audience}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (formData.project_id) {
                                                // If filtering by role
                                                if (availableRoles.includes(val)) {
                                                    setFormData({
                                                        ...formData,
                                                        audience: Audience.PROJECT_MEMBERS,
                                                        target_roles: [val]
                                                    });
                                                } else {
                                                    // All Project Members
                                                    setFormData({
                                                        ...formData,
                                                        audience: Audience.PROJECT_MEMBERS,
                                                        target_roles: []
                                                    });
                                                }
                                            } else {
                                                // Standard Audience Selection
                                                setFormData({ ...formData, audience: val as Audience, target_roles: [] });
                                            }
                                        }}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
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

                                {/* Subject Line */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Subject Line</label>
                                    <input
                                        type="text"
                                        value={formData.content.subject}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            content: { ...formData.content, subject: e.target.value }
                                        })}
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="Email Subject"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Message Body</label>
                                <textarea
                                    value={formData.content.message_body}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        content: { ...formData.content, message_body: e.target.value }
                                    })}
                                    rows={3}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                    placeholder="Explanation of the downtime..."
                                />
                            </div>

                            {/* Scheduling */}
                            <div className="pt-3 border-t border-gray-100">
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Schedule Send Time</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.scheduled_at || ''}
                                            onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleSend(false)}
                                            disabled={sending}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData.scheduled_at
                                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            Schedule
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, scheduled_at: '' }));
                                                handleSend(true);
                                            }}
                                            disabled={sending}
                                            className="px-4 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium shadow-sm flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {sending ? statusMessage || 'Sending...' : 'Send Now 🚀'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: LIVE PREVIEW */}
                    <div className="bg-gray-100 rounded-xl flex flex-col items-center justify-start p-4 overflow-y-auto">
                        <div className="mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Email Preview</div>

                        <div className={`w-full max-w-sm bg-white rounded-lg shadow-xl overflow-hidden border ${theme.border}`}>
                            {/* Email Header */}
                            <div className={`${theme.header} p-3 text-white text-center`}>
                                <div className="text-2xl mb-1">
                                    {formData.type === DowntimeType.EMERGENCY_OUTAGE ? '🚨' : formData.type === DowntimeType.FEATURE_UPGRADE ? '🚀' : '🔧'}
                                </div>
                                <h3 className="font-bold text-base tracking-tight">
                                    {formData.type === DowntimeType.EMERGENCY_OUTAGE ? 'Service Outage Notification' : formData.type === DowntimeType.FEATURE_UPGRADE ? 'New Feature Alert' : 'System Maintenance Alert'}
                                </h3>
                            </div>

                            {/* Email Body */}
                            <div className="p-4 space-y-3">
                                <div className="border-b border-gray-100 pb-2">
                                    <h4 className="font-bold text-gray-900 text-sm leading-tight">{formData.content.subject}</h4>
                                </div>

                                <div className="prose prose-xs text-gray-600">
                                    <p className="text-xs">Dear {formData.audience === Audience.INTERNAL_TEAM ? 'Team' : 'User'},</p>
                                    <p className="whitespace-pre-wrap text-[11px]">{formData.content.message_body}</p>
                                </div>

                                {/* Details Box */}
                                <div className={`${theme.bg} rounded-lg p-3 border ${theme.border} space-y-2`}>
                                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                                        <div className="text-gray-500 font-medium">📅 When:</div>
                                        <div className={`col-span-2 font-medium ${theme.text}`}>
                                            {formData.schedule.start_time ? new Date(formData.schedule.start_time).toLocaleString() : '[Start Date]'}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                                        <div className="text-gray-500 font-medium">⏳ Until:</div>
                                        <div className={`col-span-2 font-medium ${theme.text}`}>
                                            {formData.schedule.end_time ? new Date(formData.schedule.end_time).toLocaleString() : '[End Date]'}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                                        <div className="text-gray-500 font-medium">📉 Impact:</div>
                                        <div className={`col-span-2 font-medium ${theme.text}`}>
                                            {formData.affected_components.length > 0 ? formData.affected_components.join(', ') : '[Selected Components]'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 text-center text-xs text-gray-400 max-w-xs">
                            This is how the email will appear to {projectMembers.length > 0 ? `${projectMembers.length} members` : 'recipients'}.
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
                                                <button className="text-gray-400 hover:text-gray-600 disabled:opacity-50 text-[10px]" disabled>
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
