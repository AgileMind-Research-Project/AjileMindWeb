'use client';

/**
 * /dashboard/meetings — Scheduled Meetings Page
 *
 * Shows all scheduled meetings for the current user's projects
 * with a "Schedule Meeting" button that opens the create modal.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { scheduledMeetingAPI, ScheduledMeeting } from '@/lib/api/scheduledMeetingAPI';
import { ScheduleMeetingModal } from '@/components/meetings/ScheduleMeetingModal';
import { ScheduledMeetingsList } from '@/components/meetings/ScheduledMeetingsList';
import { API_CONFIG } from '@/lib/config/api.config';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Project { id: number; name: string }
interface Sprint { id: number; name: string; project_id: number }

// ── Token helper (shared pattern) ─────────────────────────────────────────────

function getAuthToken(): string {
    try {
        const raw = localStorage.getItem('auth-storage');
        if (raw) {
            const parsed = JSON.parse(raw);
            const t = parsed?.state?.accessToken;
            if (t) return t;
        }
    } catch (_) { }
    return localStorage.getItem('access_token') ?? '';
}

function getCurrentUserEmail(): string {
    try {
        const token = getAuthToken();
        if (!token) return '';
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.username || payload.email || payload.sub || '';
    } catch (_) { return ''; }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MeetingsPage() {
    const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedProject, setSelected] = useState<number | 'all'>('all');
    const [toast, setToast] = useState<string | null>(null);
    const currentEmail = getCurrentUserEmail();

    // ── Fetch projects + meetings ──────────────────────────────────────────

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch(
                `${API_CONFIG.baseURL}/api/v1/projects`,
                { headers: { Authorization: `Bearer ${getAuthToken()}` } }
            );
            if (!res.ok) return;
            const data = await res.json();
            const list: Project[] = (data?.data?.projects ?? data?.projects ?? []).map((p: any) => ({
                id: p.project_id ?? p.id,
                name: p.project_name ?? p.name,
            }));
            setProjects(list);

            // Fetch sprints for all projects
            const sprintResults = await Promise.all(
                list.map((p) =>
                    fetch(
                        `${API_CONFIG.baseURL}/api/v1/projects/${p.id}/sprints`,
                        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
                    )
                        .then((r) => r.json())
                        .then((d) =>
                            (d?.data?.sprints ?? d?.sprints ?? []).map((s: any) => ({
                                id: s.sprint_id ?? s.id,
                                name: s.sprint_name ?? s.name,
                                project_id: p.id,
                            }))
                        )
                        .catch(() => [] as Sprint[])
                )
            );
            setSprints(sprintResults.flat());
            return list;
        } catch (_) { return [] as Project[]; }
    }, []);

    const fetchMeetings = useCallback(async (projectIds: number[]) => {
        setLoading(true);
        try {
            const results = await Promise.all(
                projectIds.map((pid) => scheduledMeetingAPI.getByProject(pid))
            );
            const all = results.flatMap((r) => r.data?.meetings ?? []);
            // Sort: nearest upcoming first
            all.sort((a, b) =>
                a.meeting_date.localeCompare(b.meeting_date) ||
                a.start_time.localeCompare(b.start_time)
            );
            setMeetings(all);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects().then((list) => {
            if (list && list.length > 0) fetchMeetings(list.map((p) => p.id));
            else setLoading(false);
        });
    }, [fetchProjects, fetchMeetings]);

    // ── Derived list (filtered by selected project) ────────────────────────

    const displayMeetings =
        selectedProject === 'all'
            ? meetings
            : meetings.filter((m) => m.project_id === selectedProject);

    // ── Handlers ──────────────────────────────────────────────────────────

    const handleCreated = (m: ScheduledMeeting) => {
        setMeetings((prev) =>
            [...prev, m].sort(
                (a, b) =>
                    a.meeting_date.localeCompare(b.meeting_date) ||
                    a.start_time.localeCompare(b.start_time)
            )
        );
        setShowModal(false);
        showToast('Meeting scheduled successfully 🎉');
    };

    const handleDeleted = (id: string) => {
        setMeetings((prev) => prev.filter((m) => m.meeting_id !== id));
        showToast('Meeting deleted');
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    };

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Scheduled Meetings</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} across all projects
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Schedule Meeting
                    </button>
                </div>

                {/* Project filter tabs */}
                {projects.length > 1 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button
                            onClick={() => setSelected('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${selectedProject === 'all'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                }`}
                        >
                            All Projects
                        </button>
                        {projects.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setSelected(p.id)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${selectedProject === p.id
                                        ? 'bg-blue-600 text-white border-blue-600 shadow'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Meetings list */}
                <ScheduledMeetingsList
                    meetings={displayMeetings}
                    loading={loading}
                    currentUserEmail={currentEmail}
                    onDeleted={handleDeleted}
                    onSchedule={() => setShowModal(true)}
                />
            </div>

            {/* Schedule Meeting Modal */}
            {showModal && (
                <ScheduleMeetingModal
                    onSuccess={handleCreated}
                    onClose={() => setShowModal(false)}
                    projects={projects}
                    sprints={sprints}
                    defaultProjectId={typeof selectedProject === 'number' ? selectedProject : undefined}
                />
            )}

            {/* Toast notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg animate-fade-in">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {toast}
                </div>
            )}
        </div>
    );
}
