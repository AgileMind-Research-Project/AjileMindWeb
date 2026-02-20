'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrustComponent {
    name: string;
    key: string;
    score: number;
    raw_value: number;
    unit: string;
    description: string;
    formula: string;
}


interface TrustIndexData {
    project_id: number;
    trust_index: number;
    release_threshold: number;
    is_ready_to_release: boolean;
    components: TrustComponent[];
    calculation_method: string;
    num_components: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrustIndexDashboard() {
    const { user } = useAuth();
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [projects, setProjects] = useState<any[]>([]);
    const [trustData, setTrustData] = useState<TrustIndexData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Fetch projects list ──────────────────────────────────────────────────
    useEffect(() => {
        fetchProjects();
    }, [user]);

    const fetchProjects = async () => {
        try {
            const authStorage = localStorage.getItem('auth-storage');
            if (!authStorage) { setError('Please log in to view projects'); return; }
            const token = JSON.parse(authStorage).state?.accessToken;
            if (!token) { setError('Please log in to view projects'); return; }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/v1/projects/?page=1&limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401) { setError('Your session has expired. Please log in again.'); return; }
            if (!res.ok) throw new Error('Failed to fetch projects');

            const result = await res.json();
            setProjects(result.data || []);
        } catch {
            setError('Failed to load projects');
        }
    };

    // ── Fetch trust index on project change ──────────────────────────────────
    useEffect(() => {
        if (selectedProject) fetchTrustIndex();
    }, [selectedProject]);

    const fetchTrustIndex = async () => {
        if (!selectedProject) return;
        setLoading(true);
        setError(null);
        setTrustData(null);

        try {
            const authStorage = localStorage.getItem('auth-storage');
            if (!authStorage) { setError('Please log in'); return; }
            const token = JSON.parse(authStorage).state?.accessToken;
            if (!token) { setError('Please log in'); return; }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${apiUrl}/api/v1/trust-index/${selectedProject}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401) { setError('Your session has expired. Please log in again.'); return; }
            if (res.ok) {
                const result = await res.json();
                setTrustData(result.data);
            } else {
                const err = await res.json();
                setError(err.detail || 'Failed to fetch Trust Index');
            }
        } catch {
            setError('Network error while fetching Trust Index');
        } finally {
            setLoading(false);
        }
    };

    // ── Helpers ──────────────────────────────────────────────────────────────

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        if (score >= 40) return 'text-orange-500';
        return 'text-red-600';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'from-green-500 to-green-600';
        if (score >= 60) return 'from-yellow-500 to-yellow-600';
        if (score >= 40) return 'from-orange-500 to-orange-600';
        return 'from-red-500 to-red-600';
    };

    const getComponentBarColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        if (score >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };


    // Circular gauge arc helper (SVG)
    const describeArc = (radius: number, startAngle: number, endAngle: number) => {
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const cx = 100, cy = 100;
        const start = {
            x: cx + radius * Math.cos(toRad(startAngle - 90)),
            y: cy + radius * Math.sin(toRad(startAngle - 90)),
        };
        const end = {
            x: cx + radius * Math.cos(toRad(endAngle - 90)),
            y: cy + radius * Math.sin(toRad(endAngle - 90)),
        };
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;
        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
    };

    const trustArcDeg = trustData ? (trustData.trust_index / 100) * 360 : 0;
    const trustArc = trustArcDeg > 0 ? describeArc(75, 0, Math.min(trustArcDeg, 359.9)) : '';

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* ── Project Selector ── */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Project
                </label>
                <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                >
                    <option value="">-- Select a Project --</option>
                    {projects.map((p) => (
                        <option key={p.project_id} value={p.project_id}>
                            {p.project_name} ({p.key})
                        </option>
                    ))}
                </select>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* ── Loading ── */}
            {loading && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">Calculating Trust Index…</p>
                    <p className="text-gray-400 text-sm mt-1">Analysing risk, delay, velocity and availability data</p>
                </div>
            )}

            {/* ── Main Dashboard ── */}
            {trustData && (
                <>
                    {/* ── Release Readiness Banner ── */}
                    <div className={`rounded-xl shadow-lg overflow-hidden border-2 ${trustData.is_ready_to_release
                        ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50'
                        : 'border-red-400 bg-gradient-to-r from-red-50 to-rose-50'
                        }`}>
                        <div className={`px-6 py-5 flex items-center justify-between ${trustData.is_ready_to_release
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                            : 'bg-gradient-to-r from-red-500 to-rose-600'
                            }`}>
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl">
                                    {trustData.is_ready_to_release ? '✅' : '🚫'}
                                </span>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {trustData.is_ready_to_release
                                            ? 'READY TO RELEASE'
                                            : 'NOT READY TO RELEASE'}
                                    </h2>
                                    <p className="text-white/80 text-sm mt-0.5">
                                        {trustData.is_ready_to_release
                                            ? `Trust Index (${trustData.trust_index.toFixed(1)}) meets the release threshold of ${trustData.release_threshold}`
                                            : `Trust Index (${trustData.trust_index.toFixed(1)}) is below the release threshold of ${trustData.release_threshold}`}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white/70 text-xs uppercase tracking-wider">Release Threshold</p>
                                <p className="text-white font-bold text-2xl">{trustData.release_threshold}</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Trust Index Score + Gauge ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Circular Gauge */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col items-center justify-center">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                                Trust Index Score
                            </h3>
                            <div className="relative">
                                <svg width="200" height="200" viewBox="0 0 200 200">
                                    {/* Background track */}
                                    <circle cx="100" cy="100" r="75" fill="none" stroke="#e5e7eb" strokeWidth="14" />
                                    {/* Score arc */}
                                    {trustArcDeg > 0 && (
                                        <path
                                            d={trustArc}
                                            fill="none"
                                            stroke={
                                                trustData.trust_index >= 80 ? '#16a34a'
                                                    : trustData.trust_index >= 60 ? '#ca8a04'
                                                        : trustData.trust_index >= 40 ? '#ea580c'
                                                            : '#dc2626'
                                            }
                                            strokeWidth="14"
                                            strokeLinecap="round"
                                        />
                                    )}
                                    {/* Threshold marker */}
                                    <line
                                        x1="100"
                                        y1="25"
                                        x2="100"
                                        y2="38"
                                        stroke="#6366f1"
                                        strokeWidth="2"
                                        strokeDasharray="3"
                                        transform={`rotate(${(trustData.release_threshold / 100) * 360}, 100, 100)`}
                                    />
                                    {/* Center text */}
                                    <text x="100" y="94" textAnchor="middle" className="font-bold" style={{ fontSize: '28px', fontWeight: 700, fill: trustData.trust_index >= 80 ? '#16a34a' : trustData.trust_index >= 60 ? '#ca8a04' : trustData.trust_index >= 40 ? '#ea580c' : '#dc2626' }}>
                                        {trustData.trust_index.toFixed(1)}
                                    </text>
                                    <text x="100" y="116" textAnchor="middle" style={{ fontSize: '12px', fill: '#6b7280' }}>
                                        out of 100
                                    </text>
                                </svg>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 text-center">
                                {trustData.calculation_method}
                            </p>
                        </div>

                        {/* Stats Summary */}
                        <div className="md:col-span-2 grid grid-cols-2 gap-4">
                            {/* Trust Score Card */}
                            <div className={`bg-gradient-to-br ${getScoreBg(trustData.trust_index)} rounded-xl shadow-lg p-6 text-white`}>
                                <p className="text-white/80 text-sm font-medium">Trust Index</p>
                                <p className="text-5xl font-bold mt-2">{trustData.trust_index.toFixed(1)}</p>
                                <p className="text-white/70 text-xs mt-1">Geometric Mean (6 components)</p>
                            </div>


                            {/* Threshold */}
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                                <p className="text-purple-100 text-sm font-medium">Release Threshold</p>
                                <p className="text-5xl font-bold mt-2">{trustData.release_threshold}</p>
                                <p className="text-purple-100 text-xs mt-1">minimum score to release</p>
                            </div>

                            {/* Gap / Surplus */}
                            <div className={`bg-gradient-to-br ${trustData.is_ready_to_release
                                ? 'from-green-500 to-green-600'
                                : 'from-orange-500 to-orange-600'
                                } rounded-xl shadow-lg p-6 text-white`}>
                                <p className="text-white/80 text-sm font-medium">
                                    {trustData.is_ready_to_release ? 'Surplus' : 'Gap to Release'}
                                </p>
                                <p className="text-5xl font-bold mt-2">
                                    {trustData.is_ready_to_release ? '+' : '-'}
                                    {Math.abs(trustData.trust_index - trustData.release_threshold).toFixed(1)}
                                </p>
                                <p className="text-white/70 text-xs mt-1">points from threshold</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Component Breakdown ── */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                            <h3 className="text-lg font-bold text-white flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Component Breakdown
                            </h3>
                            <p className="text-indigo-200 text-sm mt-0.5">All 6 factors contributing to the Trust Index (score ≥ 80 = good)</p>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {trustData.components.map((comp) => (
                                <div key={comp.key} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold text-gray-700">{comp.name}</h4>
                                        <span className={`text-xl font-bold ${getScoreColor(comp.score)}`}>
                                            {comp.score.toFixed(1)}
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-700 ${getComponentBarColor(comp.score)}`}
                                            style={{ width: `${Math.min(comp.score, 100)}%` }}
                                        />
                                    </div>

                                    {/* Status badge */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-500">
                                            {comp.raw_value.toFixed(1)}{comp.unit}
                                        </p>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${comp.score >= 80 ? 'bg-green-100 text-green-700'
                                            : comp.score >= 60 ? 'bg-yellow-100 text-yellow-700'
                                                : comp.score >= 40 ? 'bg-orange-100 text-orange-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                            {comp.score >= 80 ? '✓ Good' : comp.score >= 60 ? '⚠ Fair' : comp.score >= 40 ? '⚠ Poor' : '✗ Critical'}
                                        </span>
                                    </div>

                                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">{comp.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* ── Ready to release success panel ── */}
                    {trustData.is_ready_to_release && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md border border-green-200 p-6 flex items-center space-x-4">
                            <div className="text-5xl">🎉</div>
                            <div>
                                <h3 className="text-lg font-bold text-green-800">All systems green!</h3>
                                <p className="text-green-700 text-sm mt-1">
                                    The project Trust Index of <strong>{trustData.trust_index.toFixed(1)}</strong> meets or
                                    exceeds the release threshold of <strong>{trustData.release_threshold}</strong>.
                                    All quality indicators are satisfactory for a production release.
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
