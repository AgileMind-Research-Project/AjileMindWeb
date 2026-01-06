import React, { useState, useEffect } from 'react';
import { CreateMeetingRequest, meetingsApi, Meeting } from '@/lib/api/meetings.api';
import { projectsApi, Project } from '@/lib/api/projects.api';
import { toast } from 'sonner';

interface CreateMeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    meeting?: Meeting | null;
}

const INITIAL_FORM: CreateMeetingRequest = {
    title: '',
    description: '',
    project_id: null,
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
    category: 'Daily Meeting',
    attendees: []
};

export default function CreateMeetingModal({ isOpen, onClose, onSuccess, meeting }: CreateMeetingModalProps) {
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectUsers, setProjectUsers] = useState<any[]>([]);
    const [fetchingUsers, setFetchingUsers] = useState(false);

    const [formData, setFormData] = useState<CreateMeetingRequest>(INITIAL_FORM);

    useEffect(() => {
        if (isOpen) {
            loadProjects();
            if (meeting) {
                // Formatting time HH:MM:SS -> HH:MM
                const formatTime = (t: string) => t && t.length > 5 ? t.substring(0, 5) : t;

                setFormData({
                    title: meeting.title,
                    description: meeting.description || '',
                    project_id: meeting.project_id,
                    date: meeting.date,
                    start_time: formatTime(meeting.start_time),
                    end_time: formatTime(meeting.end_time),
                    category: meeting.category || 'Daily Meeting',
                    attendees: meeting.attendees || []
                });

                if (meeting.project_id) {
                    fetchProjectUsers(meeting.project_id);
                } else {
                    setProjectUsers([]);
                }
            } else {
                setFormData(INITIAL_FORM);
                setProjectUsers([]);
            }
        }
    }, [isOpen, meeting]);

    const loadProjects = async () => {
        try {
            const response = await projectsApi.listProjects({ limit: 100 });
            setProjects(response.data);
        } catch (error) {
            console.error('Failed to load projects:', error);
        }
    };

    const fetchProjectUsers = async (projectId: number) => {
        setFetchingUsers(true);
        try {
            const users = await meetingsApi.getProjectUsers(projectId);
            setProjectUsers(users);
        } catch (error) {
            console.error('Failed to load project users:', error);
        } finally {
            setFetchingUsers(false);
        }
    };

    const handleProjectChange = async (projectId: string) => {
        const id = projectId ? parseInt(projectId) : null;
        setFormData(prev => ({ ...prev, project_id: id }));

        if (id) {
            setProjectUsers([]); // Clear while loading
            setFetchingUsers(true);
            try {
                const users = await meetingsApi.getProjectUsers(id);
                setProjectUsers(users);

                // Auto-fill attendees when project changes
                const userEmails = users.map(u => u.email);
                setFormData(prev => ({ ...prev, attendees: userEmails }));
                toast.info(`Assigned ${users.length} team members from project`);

            } catch (error) {
                console.error('Failed to load project users:', error);
                toast.error('Failed to load team members');
            } finally {
                setFetchingUsers(false);
            }
        } else {
            setProjectUsers([]);
            setFormData(prev => ({ ...prev, attendees: [] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                start_time: formData.start_time.length === 5 ? `${formData.start_time}:00` : formData.start_time,
                end_time: formData.end_time.length === 5 ? `${formData.end_time}:00` : formData.end_time,
            };

            if (meeting) {
                await meetingsApi.updateMeeting(meeting.meeting_id, payload);
                toast.success('Meeting updated successfully');
            } else {
                await meetingsApi.createMeeting(payload);
                toast.success('Meeting scheduled successfully');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save meeting:', error);
            toast.error(meeting ? 'Failed to update meeting' : 'Failed to create meeting');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {meeting ? 'Edit Meeting' : 'Schedule New Meeting'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="e.g., Daily Standup"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Project (Auto-assigns team)</label>
                            <select
                                value={formData.project_id || ''}
                                onChange={e => handleProjectChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            >
                                <option value="">Select a Project...</option>
                                {projects.map(p => (
                                    <option key={p.project_id} value={p.project_id}>{p.project_name} ({p.key})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            >
                                <option value="Daily Meeting">Daily Meeting</option>
                                <option value="Sprint Planning">Sprint Planning</option>
                                <option value="Sprint Review">Sprint Review</option>
                                <option value="Retrospective">Retrospective</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                                type="time"
                                required
                                value={formData.start_time}
                                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input
                                type="time"
                                required
                                value={formData.end_time}
                                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Meeting agenda and topic..."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assigned Team Members ({projectUsers.length > 0 ? projectUsers.length : (formData.attendees?.length || 0)})
                                {fetchingUsers && <span className="ml-2 text-xs text-blue-500">Loading...</span>}
                            </label>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                                {projectUsers.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {projectUsers.map(user => (
                                            <span key={user.user_id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {user.first_name} {user.last_name}
                                            </span>
                                        ))}
                                    </div>
                                ) : formData.attendees && formData.attendees.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.attendees.map((email, i) => (
                                            <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {email}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Select a project to automatically assign team members.</p>
                                )}
                            </div>
                        </div>

                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading && (
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            {meeting ? 'Update Meeting' : 'Schedule Meeting'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
