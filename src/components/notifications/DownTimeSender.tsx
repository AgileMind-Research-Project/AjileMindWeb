import React, { useState, useEffect } from 'react';
import { notificationsApi, DowntimeType, Priority, Audience, DowntimeNotificationRequest } from '@/lib/api/notifications.api';
import { projectsApi, Project } from '@/lib/api/projects.api';
import { meetingsApi } from '@/lib/api/meetings.api';
import { toast } from 'sonner';

export default function DownTimeSender() {
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectMembers, setProjectMembers] = useState<any[]>([]);
    const [fetchingMembers, setFetchingMembers] = useState(false);

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
        scheduled_at: ''
    });

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

        if (type === DowntimeType.PLANNED_MAINTENANCE) {
            subject = '🔧 Scheduled Maintenance: [System Name]';
            body = 'We will be performing scheduled maintenance on the [Affected Service] to improve performance and security.';
        } else if (type === DowntimeType.EMERGENCY_OUTAGE) {
            subject = '🚨 Urgent: Service Disruption - [System Name]';
            body = 'We are currently experiencing an unexpected issue with [Affected Service]. Our engineering team is actively investigating the root cause.';
        } else if (type === DowntimeType.FEATURE_UPGRADE) {
            subject = '🚀 New Feature Deployment';
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

        if (!immediate && !formData.scheduled_at) {
            toast.error('Please select a "Schedule Send Time" to schedule.');
            return;
        }

        setSending(true);
        try {
            const payload = { ...formData };
            if (immediate) {
                delete payload.scheduled_at; // Ensure we don't send a schedule time for immediate sending
            }

            const response = await notificationsApi.sendDowntimeNotification(payload);
            if (response.success) {
                toast.success(response.message);
                // Reset form optionally?
            }
        } catch (error) {
            console.error('Failed to send notification:', error);
            toast.error('Failed to send notification');
        } finally {
            setSending(false);
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* LEFT SIDE: FORM */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-y-auto">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">📢</span> DownTime Sender
                </h2>

                <div className="space-y-4">
                    {/* Type & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Downtime Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => handleTypeChange(e.target.value as DowntimeType)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {Object.values(DowntimeType).map(t => (
                                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {Object.values(Priority).map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Affected Services */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Affected Services</label>
                        <div className="flex flex-wrap gap-2">
                            {COMPONENTS.map(comp => (
                                <button
                                    key={comp}
                                    type="button"
                                    onClick={() => toggleComponent(comp)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                                type="datetime-local"
                                value={formData.schedule.start_time}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    schedule: { ...formData.schedule, start_time: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated End Time</label>
                            <input
                                type="datetime-local"
                                value={formData.schedule.end_time}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    schedule: { ...formData.schedule, end_time: e.target.value }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Project Selection */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Affected Project (Optional)</label>
                        <select
                            value={formData.project_id || ''}
                            onChange={(e) => {
                                const pid = e.target.value ? Number(e.target.value) : null;
                                setFormData({
                                    ...formData,
                                    project_id: pid,
                                    // Auto-select audience if project selected
                                    audience: pid ? Audience.PROJECT_MEMBERS : formData.audience
                                });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-3"
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
                                    {projectMembers.map((member: any) => (
                                        <div key={member.user_id || member.email} className="flex items-center text-xs bg-white border border-gray-200 rounded-md p-2">
                                            <span className="font-medium text-gray-800 mr-1">
                                                {member.first_name} {member.last_name}
                                            </span>
                                            <span className="text-gray-500 mr-2">
                                                ({member.role})
                                            </span>
                                            <span className="text-gray-400 border-l border-gray-200 pl-2">
                                                {member.email}
                                            </span>
                                        </div>
                                    ))}
                                    {!fetchingMembers && projectMembers.length === 0 && (
                                        <span className="text-xs text-gray-400 italic top-1">No members found.</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Target Audience */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                        <select
                            value={formData.audience}
                            onChange={(e) => setFormData({ ...formData, audience: e.target.value as Audience })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {Object.values(Audience).map(a => (
                                <option key={a} value={a}>{a.replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                        <input
                            type="text"
                            value={formData.content.subject}
                            onChange={(e) => setFormData({
                                ...formData,
                                content: { ...formData.content, subject: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Email Subject"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
                        <textarea
                            value={formData.content.message_body}
                            onChange={(e) => setFormData({
                                ...formData,
                                content: { ...formData.content, message_body: e.target.value }
                            })}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                            placeholder="Explanation of the downtime..."
                        />
                    </div>

                    {/* Scheduling */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-end gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Schedule Send Time</label>
                                <input
                                    type="datetime-local"
                                    value={formData.scheduled_at || ''}
                                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleSend(false)}
                                    disabled={sending}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${formData.scheduled_at
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Schedule Send
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, scheduled_at: '' }));
                                        handleSend(true);
                                    }}
                                    disabled={sending}
                                    className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium shadow-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {sending ? 'Sending...' : 'Send Now 🚀'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: LIVE PREVIEW */}
            <div className="bg-gray-100 p-6 rounded-xl flex flex-col items-center justify-center overflow-y-auto">
                <div className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">Live Email Preview</div>

                <div className={`w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden border ${theme.border}`}>
                    {/* Email Header */}
                    <div className={`${theme.header} p-4 text-white text-center`}>
                        <div className="text-3xl mb-1">
                            {formData.type === DowntimeType.EMERGENCY_OUTAGE ? '🚨' : formData.type === DowntimeType.FEATURE_UPGRADE ? '🚀' : '🔧'}
                        </div>
                        <h3 className="font-bold text-lg tracking-tight">
                            {formData.type === DowntimeType.EMERGENCY_OUTAGE ? 'Service Outage Notification' : formData.type === DowntimeType.FEATURE_UPGRADE ? 'New Feature Alert' : 'System Maintenance Alert'}
                        </h3>
                    </div>

                    {/* Email Body */}
                    <div className="p-6 space-y-4">
                        <div className="border-b border-gray-100 pb-3">
                            <h4 className="font-bold text-gray-900 text-base leading-tight">{formData.content.subject}</h4>
                        </div>

                        <div className="prose prose-sm text-gray-600">
                            <p>Dear {formData.audience === Audience.INTERNAL_TEAM ? 'Team' : 'User'},</p>
                            <p className="whitespace-pre-wrap">{formData.content.message_body}</p>
                        </div>

                        {/* Details Box */}
                        <div className={`${theme.bg} rounded-lg p-4 border ${theme.border} space-y-3`}>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-gray-500 font-medium">📅 When:</div>
                                <div className={`col-span-2 font-medium ${theme.text}`}>
                                    {formData.schedule.start_time ? new Date(formData.schedule.start_time).toLocaleString() : '[Start Date]'}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-gray-500 font-medium">⏳ Until:</div>
                                <div className={`col-span-2 font-medium ${theme.text}`}>
                                    {formData.schedule.end_time ? new Date(formData.schedule.end_time).toLocaleString() : '[End Date]'}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-gray-500 font-medium">📉 Impact:</div>
                                <div className={`col-span-2 font-medium ${theme.text}`}>
                                    {formData.affected_components.length > 0 ? formData.affected_components.join(', ') : '[Selected Components]'}
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-gray-400 text-center pt-4 border-t border-gray-100">
                            Sent by {formData.type === DowntimeType.EMERGENCY_OUTAGE ? 'Incident Response Team' : 'DevOps Team'} • AjileMind
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-center text-xs text-gray-400 max-w-xs">
                    This is how the email will appear to {projectMembers.length > 0 ? `${projectMembers.length} members` : 'recipients'}.
                </div>
            </div>
        </div>
    );
}
