'use client';

/**
 * ScheduleMeetingModal
 *
 * Full-featured modal for scheduling a Scrum meeting.
 * Category is a dropdown pre-populated with all 11 Scrum ceremony types.
 */

import React, { useState } from 'react';
import { scheduledMeetingAPI, SCRUM_MEETING_CATEGORIES, ScheduleMeetingPayload } from '@/lib/api/scheduledMeetingAPI';

interface Props {
    /** Called after successful creation with the new meeting data */
    onSuccess: (meeting: any) => void;
    onClose: () => void;
    /** Pre-select a project */
    defaultProjectId?: number;
    /** Pre-select a sprint */
    defaultSprintId?: number;
    /** Available projects [{id, name}] */
    projects?: { id: number; name: string }[];
    /** Available sprints [{id, name, project_id}] */
    sprints?: { id: number; name: string; project_id: number }[];
    /** If true, the project selection is disabled (locked to defaultProjectId) */
    lockProject?: boolean;
}

const INPUT_BASE =
    'w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-500';

const LABEL = 'block text-xs font-semibold text-gray-600 mb-1';

const STATUS_COLOR: Record<string, string> = {
    'Daily Standup': 'bg-sky-100 text-sky-700',
    'Sprint Planning': 'bg-indigo-100 text-indigo-700',
    'Sprint Review': 'bg-violet-100 text-violet-700',
    'Sprint Retrospective': 'bg-pink-100 text-pink-700',
    'Backlog Refinement / Grooming': 'bg-amber-100 text-amber-700',
    'Release Planning': 'bg-emerald-100 text-emerald-700',
    'Stakeholder Review': 'bg-teal-100 text-teal-700',
    'Technical Design Meeting': 'bg-blue-100 text-blue-700',
    'Incident / Post-Mortem': 'bg-red-100 text-red-700',
    'One-on-One': 'bg-orange-100 text-orange-700',
    'Other': 'bg-gray-100 text-gray-700',
};

export function ScheduleMeetingModal({
    onSuccess,
    onClose,
    defaultProjectId,
    defaultSprintId,
    projects = [],
    sprints = [],
    lockProject = false,
}: Props) {
    const [form, setForm] = useState<ScheduleMeetingPayload>({
        project_id: defaultProjectId ?? 0,
        sprint_id: defaultSprintId ?? 0,
        title: '',
        meeting_category: 'Daily Standup',
        meeting_date: '',
        start_time: '09:00',
        end_time: '09:30',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const filteredSprints = sprints.filter(
        (s: any) => !form.project_id || s.project_id === form.project_id
    );

    // If defaultProjectId changes (e.g. active channel changes), update form
    React.useEffect(() => {
        if (defaultProjectId && form.project_id !== defaultProjectId) {
            setForm(prev => ({ ...prev, project_id: defaultProjectId, sprint_id: defaultSprintId ?? 0 }));
        }
    }, [defaultProjectId, defaultSprintId]);

    const set = (field: keyof ScheduleMeetingPayload, value: any) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!form.project_id || !form.sprint_id) {
            setError('Please select a project and sprint.');
            return;
        }
        if (!form.meeting_date) {
            setError('Please choose a meeting date.');
            return;
        }
        if (form.end_time <= form.start_time) {
            setError('End time must be after start time.');
            return;
        }


        setLoading(true);
        try {
            const res = await scheduledMeetingAPI.create(form);
            if (!res.success) throw new Error((res as any).detail ?? 'Failed to schedule meeting');
            onSuccess(res.data!);
        } catch (err: any) {
            setError(err.message ?? 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const selectedCategory = form.meeting_category as string;
    const categoryChipClass = STATUS_COLOR[selectedCategory] ?? 'bg-gray-100 text-gray-700';

    const selectedProjectName = projects.find((p: any) => p.id === form.project_id)?.name || 'Project';

    return (
        /* Backdrop */
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Schedule Meeting</h2>
                        <p className="text-blue-100 text-xs mt-0.5">Add a Scrum ceremony or team meeting</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/20 transition text-white"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form id="schedule-meeting-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Project & Sprint selection */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL}>Project *</label>
                                {lockProject ? (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-blue-700">
                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        {selectedProjectName}
                                        <span className="ml-auto text-[10px] uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded text-blue-500">Locked</span>
                                    </div>
                                ) : (
                                    projects.length > 0 ? (
                                        <select
                                            className={INPUT_BASE}
                                            value={form.project_id}
                                            onChange={(e) => {
                                                set('project_id', Number(e.target.value));
                                                set('sprint_id', 0);
                                            }}
                                            required
                                        >
                                            <option value={0} disabled>Select project…</option>
                                            {projects.map((p) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="number"
                                            className={INPUT_BASE}
                                            placeholder="Project ID"
                                            value={form.project_id || ''}
                                            onChange={(e) => set('project_id', Number(e.target.value))}
                                            required
                                        />
                                    )
                                )}
                            </div>
                            <div>
                                <label className={LABEL}>Sprint *</label>
                                {sprints.length > 0 ? (
                                    <select
                                        className={INPUT_BASE}
                                        value={form.sprint_id}
                                        onChange={(e) => set('sprint_id', Number(e.target.value))}
                                        required
                                    >
                                        <option value={0} disabled>Select sprint…</option>
                                        {filteredSprints.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="number"
                                        className={INPUT_BASE}
                                        placeholder="Sprint ID"
                                        value={form.sprint_id || ''}
                                        onChange={(e) => set('sprint_id', Number(e.target.value))}
                                        required
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className={LABEL}>Meeting Title *</label>
                        <input
                            type="text"
                            className={INPUT_BASE}
                            placeholder="e.g. Sprint 14 Planning"
                            value={form.title}
                            onChange={(e) => set('title', e.target.value)}
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className={LABEL}>Meeting Category *</label>
                        <div className="relative">
                            <select
                                className={INPUT_BASE + ' pr-10 appearance-none'}
                                value={form.meeting_category}
                                onChange={(e) => set('meeting_category', e.target.value)}
                                required
                            >
                                {SCRUM_MEETING_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <svg className="pointer-events-none absolute right-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                        {/* Live preview chip */}
                        <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryChipClass}`}>
                            {form.meeting_category}
                        </span>
                    </div>

                    {/* Date & Times */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className={LABEL}>Date *</label>
                            <input
                                type="date"
                                className={INPUT_BASE}
                                value={form.meeting_date}
                                onChange={(e) => set('meeting_date', e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className={LABEL}>Start Time *</label>
                            <input
                                type="time"
                                className={INPUT_BASE}
                                value={form.start_time}
                                onChange={(e) => set('start_time', e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className={LABEL}>End Time *</label>
                            <input
                                type="time"
                                className={INPUT_BASE}
                                value={form.end_time}
                                onChange={(e) => set('end_time', e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="schedule-meeting-form"
                        disabled={loading}
                        onClick={handleSubmit as any}
                        className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow transition disabled:opacity-60 flex items-center gap-2"
                    >
                        {loading && (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        )}
                        {loading ? 'Scheduling…' : 'Schedule Meeting'}
                    </button>
                </div >
            </div >
        </div >
    );
}
