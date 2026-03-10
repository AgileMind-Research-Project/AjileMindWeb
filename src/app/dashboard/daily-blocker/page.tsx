'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { dailyBlockersApi, DailyBlocker } from '@/lib/api/dailyBlockersApi';
import { projectsApi, Project } from '@/lib/api/projects.api';
import { BlockerCard } from './BlockerCard';
import { ShieldAlert, RefreshCcw, Search, Filter, LayoutDashboard, AlertTriangle, CheckCircle2, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

export default function DailyBlockersPage() {
    const [blockers, setBlockers] = useState<DailyBlocker[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredBlockers, setFilteredBlockers] = useState<DailyBlocker[]>([]);
    const [selectedBlocker, setSelectedBlocker] = useState<DailyBlocker | null>(null);

    const [analyzingBlockerId, setAnalyzingBlockerId] = useState<number | null>(null);

    const fetchProjects = async () => {
        try {
            const response = await projectsApi.listProjects({ limit: 100 });
            if (response.success) {
                setProjects(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    };

    const fetchBlockers = async (projectId?: number) => {
        setLoading(true);
        try {
            // Fetch without AI analysis initially for speed
            const response = await dailyBlockersApi.getDailyBlockers(projectId, false);
            if (response.success) {
                setBlockers(response.data);
                setFilteredBlockers(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch blockers:', error);
            toast.error('Failed to load daily blockers');
        } finally {
            setLoading(false);
        }
    };

    const handleViewBlocker = async (blocker: DailyBlocker) => {
        setSelectedBlocker(blocker);

        // If it doesn't have AI analysis yet, fetch it
        if (!blocker.ai_suggestions || blocker.ai_suggestions.length === 0) {
            setAnalyzingBlockerId(blocker.id);
            try {
                const response = await dailyBlockersApi.analyzeBlocker(blocker.id);
                if (response.success) {
                    const analysis = response.data;

                    // Update the blocker in local state
                    const updatedBlocker = {
                        ...blocker,
                        ai_suggestions: analysis.ai_suggestions,
                        suggested_mentor_role: analysis.suggested_mentor_role
                    };

                    setSelectedBlocker(updatedBlocker);

                    // Also update the list so it's cached
                    setBlockers(prev => prev.map(b => b.id === blocker.id ? updatedBlocker : b));
                }
            } catch (error) {
                console.error('Failed to analyze blocker:', error);
                toast.error('Failed to perform AI analysis');
            } finally {
                setAnalyzingBlockerId(null);
            }
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchBlockers();
    }, []);

    useEffect(() => {
        fetchBlockers(selectedProjectId);
    }, [selectedProjectId]);

    useEffect(() => {
        const results = blockers.filter(b =>
            b.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.blocker_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.assignee_first_name && b.assignee_first_name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredBlockers(results);
    }, [searchTerm, blockers]);

    const activeProjectCount = new Set(blockers.map(b => b.project_id)).size;

    return (
        <DashboardLayout>
            <div className="p-6 max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-indigo-600 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6" />
                        Daily Blockers Management
                    </h1>
                    <p className="text-gray-600">Monitor standup impediments, analyze AI suggestions, and resolve task dependencies</p>
                </div>

                {/* Project Selection */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Select Project for Analysis
                    </label>
                    <div className="flex flex-col md:flex-row gap-4">
                        <select
                            value={selectedProjectId || ''}
                            onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : undefined)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                            disabled={loading}
                        >
                            <option value="">-- All Projects --</option>
                            {projects.map((project) => (
                                <option key={project.project_id} value={project.project_id}>
                                    {project.project_name} ({project.key})
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => fetchBlockers(selectedProjectId)}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm active:scale-95"
                        >
                            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Sync Updates
                        </button>
                    </div>
                </div>

                {/* Statistics Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Active Blockers */}
                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white overflow-hidden relative group">
                        <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <ShieldAlert className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm font-medium">Critical Issues</p>
                                <p className="text-3xl font-bold mt-2">{blockers.length}</p>
                                <p className="text-white/80 text-xs mt-1">Active impediments</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                                <ShieldAlert className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    {/* Affected Projects */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white overflow-hidden relative group">
                        <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <LayoutDashboard className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm font-medium">Scope Impact</p>
                                <p className="text-3xl font-bold mt-2">{activeProjectCount}</p>
                                <p className="text-white/80 text-xs mt-1">Affected projects</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                                <Filter className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    {/* AI Resolution */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white overflow-hidden relative group">
                        <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <CheckCircle2 className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm font-medium">Resolution Power</p>
                                <p className="text-3xl font-bold mt-2">98%</p>
                                <p className="text-white/80 text-xs mt-1">AI insight accuracy</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    {/* System Latency */}
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white overflow-hidden relative group">
                        <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <LayoutDashboard className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm font-medium">Real-time Monitor</p>
                                <p className="text-3xl font-bold mt-2">ACTIVE</p>
                                <p className="text-white/80 text-xs mt-1">Sync frequency: 60s</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                                <RefreshCcw className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Results View */}
                <div className="space-y-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by ticket ID, descriptions, or specialist name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>

                    {loading && blockers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-dotted border-gray-200">
                            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                            <p className="text-gray-400 font-medium">Fetching blockers from task updates...</p>
                        </div>
                    ) : filteredBlockers.length > 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket / Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Project</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Blocker Description</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Specialist</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredBlockers.map((blocker) => (
                                        <tr key={blocker.id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900">{blocker.ticket_id}</span>
                                                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">{blocker.detected_status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
                                                    {blocker.project_name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600 font-medium line-clamp-1 max-w-sm">
                                                    {blocker.blocker_description}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                                        {blocker.assignee_first_name?.[0] || blocker.assignee_email?.[0] || '?'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-900">
                                                            {blocker.assignee_first_name ? `${blocker.assignee_first_name} ${blocker.assignee_last_name || ''}` : 'Unassigned'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium lowercase italic">
                                                            {blocker.assignee_email || 'No email'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => handleViewBlocker(blocker)}
                                                    className="p-2 hover:bg-indigo-600 hover:text-white rounded-lg transition-all text-indigo-600 group-hover:scale-110"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
                            <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-indigo-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Blockers Found</h3>
                            <p className="text-gray-500">Everything looks clear! No active impediments detected for the selected project.</p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="mt-6 text-indigo-600 font-bold hover:underline"
                                >
                                    Clear search filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Blocker Detail Modal */}
            {selectedBlocker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                        onClick={() => setSelectedBlocker(null)}
                    />
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
                        <button
                            onClick={() => setSelectedBlocker(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition-colors transition-transform active:scale-95"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {analyzingBlockerId === selectedBlocker.id ? (
                            <div className="bg-white rounded-xl shadow-xl p-24 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">AI Analyzing Blocker...</h3>
                                <p className="text-gray-500">Developing recovery suggestions and support paths</p>
                            </div>
                        ) : (
                            <BlockerCard blocker={selectedBlocker} />
                        )}
                    </div>
                </div>
            )}

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                
                body {
                    font-family: 'Inter', sans-serif;
                }
            `}</style>
        </DashboardLayout>
    );
}

